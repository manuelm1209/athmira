import type { PoseFrameResult } from "@athmira/types";
import type { CameraView } from "expo-camera";
import { detectPoseFromUri, getActiveDelegate, warmUp } from "expo-pose-landmarker";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Floor on how often we kick off a fresh capture. MediaPipe GPU inference
// itself is ~15-25 ms; the bottleneck is takePictureAsync round-trip
// (~50-80 ms on modern devices). Keep a small floor so we don't pin the
// camera thread when inference comes back faster.
const MIN_FRAME_GAP_MS = 60;

const CAPTURE_QUALITY = 0.4;

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
  const onPoseRef = useRef(onPose);

  useEffect(() => {
    onPoseRef.current = onPose;
  }, [onPose]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setState("loading");
        // Prime MediaPipe's Metal/GPU pipeline so the first real frame
        // doesn't pay the 200-400 ms warm-up cost.
        await warmUp();
        if (cancelled) {
          return;
        }
        if (__DEV__) {
          console.log("[pose-detector] active delegate:", getActiveDelegate());
        }
        setState("loaded");
        setErrorMessage(null);
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }

    const snapshot = await camera.takePictureAsync({
      base64: false,
      exif: false,
      quality: CAPTURE_QUALITY,
      skipProcessing: true
    });

    if (!snapshot?.uri) {
      return;
    }

    const { pose } = await detectPoseFromUri(snapshot.uri);
    onPoseRef.current(pose);
  }, [cameraRef]);

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
