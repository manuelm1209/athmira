import { createPoseFrameResult } from "@athmira/pose-engine";
import type { PoseFrameResult, PoseKeypoint } from "@athmira/types";
import type { CameraView } from "expo-camera";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { decode as decodeJpeg } from "jpeg-js";

type PoseDetector = {
  dispose?: () => void;
  estimatePoses: (image: unknown, config?: { flipHorizontal?: boolean; maxPoses?: number }) => Promise<
    { keypoints: { name?: string; part?: string; score?: number; x: number; y: number }[] }[]
  >;
};

// Downsample the captured frame to this side length before passing to the
// detector. MoveNet Lightning ultimately consumes 192×192, so 256 leaves
// just enough headroom for the detector's internal smart-crop without
// burning cycles on a giant tensor.
const DOWNSAMPLE_SIZE = 256;

// JPEG quality from the camera. Lower = faster encode + decode and smaller
// base64 payload, but pose detection gets brittle below ~0.25.
const CAPTURE_QUALITY = 0.3;

// Cap how often we kick off a fresh capture, even if the previous one
// finished faster. Prevents starving the JS thread on top-end devices.
const MIN_FRAME_GAP_MS = 250;

export type MoveNetDetectorState = "idle" | "loading" | "loaded" | "error";

export type MoveNetDetectorResult = {
  state: MoveNetDetectorState;
  errorMessage: string | null;
};

export type MoveNetDetectorOptions = {
  cameraRef: RefObject<CameraView | null>;
  enabled: boolean;
  onPose: (result: PoseFrameResult | null) => void;
};

export function useMoveNetDetector({
  cameraRef,
  enabled,
  onPose
}: MoveNetDetectorOptions): MoveNetDetectorResult {
  const [state, setState] = useState<MoveNetDetectorState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const tfRef = useRef<typeof import("@tensorflow/tfjs-core") | null>(null);
  const onPoseRef = useRef(onPose);

  useEffect(() => {
    onPoseRef.current = onPose;
  }, [onPose]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setState("loading");
        const [tf, poseDetection] = await Promise.all([
          import("@tensorflow/tfjs-core"),
          import("@tensorflow-models/pose-detection"),
          import("@tensorflow/tfjs-backend-cpu"),
          import("@tensorflow/tfjs-converter")
        ]);
        registerReactNativePlatform(tf);
        await tf.setBackend("cpu");
        await tf.ready();

        const detector = (await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          enableSmoothing: true,
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        })) as unknown as PoseDetector;

        if (cancelled) {
          detector.dispose?.();
          return;
        }

        tfRef.current = tf;
        detectorRef.current = detector;
        setState("loaded");
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setErrorMessage(error instanceof Error ? error.message : "Failed to load pose model");
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
      detectorRef.current?.dispose?.();
      detectorRef.current = null;
    };
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    const camera = cameraRef.current;
    const detector = detectorRef.current;
    const tf = tfRef.current;

    if (!camera || !detector || !tf) {
      return;
    }

    const snapshot = await camera.takePictureAsync({
      base64: true,
      exif: false,
      quality: CAPTURE_QUALITY,
      skipProcessing: true
    });

    if (!snapshot?.base64) {
      return;
    }

    const jpegBytes = base64ToUint8Array(snapshot.base64);
    const decoded = decodeJpeg(jpegBytes, { useTArray: true });
    const sourceRgba = decoded.data;
    const sourceWidth = decoded.width;
    const sourceHeight = decoded.height;

    // Downsample directly from RGBA to RGB at DOWNSAMPLE_SIZE×DOWNSAMPLE_SIZE.
    // Doing it in one pass avoids an intermediate full-res RGB buffer (~3MB
    // for 1280x720) and yields a tiny tensor for the detector.
    const targetW = DOWNSAMPLE_SIZE;
    const targetH = DOWNSAMPLE_SIZE;
    const rgb = new Uint8Array(targetW * targetH * 3);
    const xRatio = sourceWidth / targetW;
    const yRatio = sourceHeight / targetH;

    for (let y = 0; y < targetH; y += 1) {
      const sourceRow = Math.floor(y * yRatio) * sourceWidth;
      const targetRow = y * targetW;
      for (let x = 0; x < targetW; x += 1) {
        const sourcePixel = (sourceRow + Math.floor(x * xRatio)) * 4;
        const targetPixel = (targetRow + x) * 3;
        rgb[targetPixel] = sourceRgba[sourcePixel] ?? 0;
        rgb[targetPixel + 1] = sourceRgba[sourcePixel + 1] ?? 0;
        rgb[targetPixel + 2] = sourceRgba[sourcePixel + 2] ?? 0;
      }
    }

    const tensor = tf.tensor3d(rgb, [targetH, targetW, 3], "int32");
    try {
      const poses = await detector.estimatePoses(tensor, { flipHorizontal: false, maxPoses: 1 });
      const result = buildResult(poses[0]);
      onPoseRef.current(result);
    } finally {
      tensor.dispose();
    }
  }, [cameraRef]);

  // Continuous capture loop. Chains the next capture as soon as the previous
  // one finishes (instead of using a fixed setInterval that could fire while
  // the previous frame is still mid-flight).
  useEffect(() => {
    if (!enabled || state !== "loaded") {
      return;
    }

    let cancelled = false;
    let lastStartedAt = 0;

    const loop = async () => {
      while (!cancelled) {
        const sinceLast = Date.now() - lastStartedAt;
        if (sinceLast < MIN_FRAME_GAP_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_FRAME_GAP_MS - sinceLast));
        }
        if (cancelled) {
          break;
        }
        lastStartedAt = Date.now();
        try {
          await captureAndAnalyze();
        } catch (error) {
          if (__DEV__) {
            console.warn("[pose-detector] frame failed:", error);
          }
        }
      }
    };

    loop();

    return () => {
      cancelled = true;
    };
  }, [captureAndAnalyze, enabled, state]);

  return { errorMessage, state };
}

function buildResult(
  pose: { keypoints: { name?: string; part?: string; score?: number; x: number; y: number }[] } | undefined
): PoseFrameResult | null {
  if (!pose) {
    return null;
  }
  // The detector returns pixel coords in the input image's coordinate space.
  // Since we always feed DOWNSAMPLE_SIZE x DOWNSAMPLE_SIZE, normalize to
  // [0, 1] so the SVG overlay (viewBox 0 0 1000 1000) scales correctly.
  const keypoints: PoseKeypoint[] = pose.keypoints.map((keypoint) => ({
    confidence: keypoint.score ?? 0,
    name: keypoint.name ?? keypoint.part ?? "keypoint",
    x: keypoint.x / DOWNSAMPLE_SIZE,
    y: keypoint.y / DOWNSAMPLE_SIZE
  }));
  return createPoseFrameResult(keypoints, {
    height: DOWNSAMPLE_SIZE,
    timestampMs: Date.now(),
    width: DOWNSAMPLE_SIZE
  });
}

// TFJS expects a Platform abstraction with `fetch`, `now`, etc. In browsers
// it auto-registers a 'browser' platform; in React Native nothing registers
// one, so calls like `tf.io.loadGraphModel(url)` blow up with
// "Cannot read property 'fetch' of undefined" when the MoveNet weights are
// downloaded from TF Hub. Register a minimal RN-flavoured shim once.
function registerReactNativePlatform(tf: typeof import("@tensorflow/tfjs-core")): void {
  const env = tf.env();
  const existing = env.platform as { fetch?: unknown } | undefined;
  if (existing && typeof existing.fetch === "function") {
    return;
  }

  env.setPlatform("athmira-rn", {
    fetch: (path: RequestInfo, init?: RequestInit) => fetch(path, init),
    now: () => Date.now(),
    encode: (text: string, encoding: string) => {
      if (encoding !== "utf-8" && encoding !== "utf8") {
        throw new Error(`Unsupported encoding for encode: ${encoding}`);
      }
      return new TextEncoder().encode(text);
    },
    decode: (bytes: Uint8Array, encoding: string) =>
      new TextDecoder(encoding).decode(bytes),
    isTypedArray: (a: unknown): a is Uint8Array | Float32Array | Int32Array | Uint8ClampedArray =>
      a instanceof Uint8Array ||
      a instanceof Float32Array ||
      a instanceof Int32Array ||
      a instanceof Uint8ClampedArray,
    setTimeoutCustom: (handler: () => void, delayMs: number) => {
      setTimeout(handler, delayMs);
    }
  });
}

function base64ToUint8Array(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let index = 0; index < chars.length; index += 1) {
    lookup[chars.charCodeAt(index)] = index;
  }

  const len = base64.length;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const bytes = new Uint8Array(((len * 3) >> 2) - padding);

  let outIndex = 0;
  for (let inIndex = 0; inIndex < len; inIndex += 4) {
    const a = lookup[base64.charCodeAt(inIndex)] ?? 0;
    const b = lookup[base64.charCodeAt(inIndex + 1)] ?? 0;
    const c = lookup[base64.charCodeAt(inIndex + 2)] ?? 0;
    const d = lookup[base64.charCodeAt(inIndex + 3)] ?? 0;
    bytes[outIndex++] = (a << 2) | (b >> 4);
    if (outIndex < bytes.length) {
      bytes[outIndex++] = ((b & 15) << 4) | (c >> 2);
    }
    if (outIndex < bytes.length) {
      bytes[outIndex++] = ((c & 3) << 6) | d;
    }
  }

  return bytes;
}
