import { createPoseFrameResult, selectCyclingSide } from "@athmira/pose-engine";
import type { JointAngles, PoseFrameResult, PoseKeypoint } from "@athmira/types";
import { colors, spacing } from "@athmira/ui";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties
} from "react";
import { StyleSheet, Text, View } from "react-native";

import type { BikeFitCameraHandle, BikeFitCameraProps } from "./BikeFitCamera.types";
import { RiderSilhouetteOverlay } from "./RiderSilhouetteOverlay";

const POSE_CONFIDENCE_THRESHOLD = 0.35;

type PoseDetector = {
  dispose?: () => void;
  estimatePoses: (
    image: HTMLVideoElement,
    config?: { flipHorizontal?: boolean; maxPoses?: number }
  ) => Promise<{ keypoints: { name?: string; part?: string; score?: number; x: number; y: number }[] }[]>;
};

type RecordingState = {
  durationMs: number;
  reject: (error: Error) => void;
  resolve: (samples: PoseFrameResult[]) => void;
  samples: PoseFrameResult[];
  startedAt: number;
};

export const BikeFitCamera = forwardRef<BikeFitCameraHandle, BikeFitCameraProps>(function BikeFitCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const latestResultRef = useRef<PoseFrameResult | null>(null);
  const recordingRef = useRef<RecordingState | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectionBusyRef = useRef(false);
  const lastDetectionAtRef = useRef(0);
  const [status, setStatus] = useState(labels.cameraPermissionRequesting);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [poseDetected, setPoseDetected] = useState(false);

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      const canvas = canvasRef.current;

      if (!canvas) {
        return null;
      }

      return canvas.toDataURL("image/jpeg", 0.82);
    },
    async startAnalysis(durationMs = 8000) {
      if (!latestResultRef.current || latestResultRef.current.confidenceScore < POSE_CONFIDENCE_THRESHOLD) {
        throw new Error(labels.poseNotReady);
      }

      return new Promise<PoseFrameResult[]>((resolve, reject) => {
        recordingRef.current = {
          durationMs,
          reject,
          resolve,
          samples: [],
          startedAt: performance.now()
        };
        setProgress(0);
      });
    }
  }));

  useEffect(() => {
    let cancelled = false;

    async function bootCameraAndModel() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(labels.cameraUnsupported);
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "user",
            height: { ideal: 720 },
            width: { ideal: 1280 }
          }
        });

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus(labels.poseDetectorLoading);

        const [tf, poseDetection] = await Promise.all([
          import("@tensorflow/tfjs-core"),
          import("@tensorflow-models/pose-detection"),
          import("@tensorflow/tfjs-backend-cpu"),
          import("@tensorflow/tfjs-backend-webgl"),
          import("@tensorflow/tfjs-converter")
        ]).then(([tfModule, poseDetectionModule]) => [tfModule, poseDetectionModule] as const);

        try {
          await tf.setBackend("webgl");
        } catch {
          await tf.setBackend("cpu");
        }

        await tf.ready();

        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
          enableSmoothing: true,
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
        });

        if (cancelled) {
          detector.dispose();
          return;
        }

        detectorRef.current = detector;
        setStatus(labels.poseDetectionActive);
        onReadyChange?.(true);
        animationRef.current = requestAnimationFrame(detectLoop);
      } catch (cameraError) {
        if (!cancelled) {
          const message = cameraError instanceof Error ? cameraError.message : labels.cameraAnalysisUnavailable;
          setError(message);
          setStatus(labels.cameraAnalysisUnavailable);
          onReadyChange?.(false);
        }
      }
    }

    bootCameraAndModel();

    return () => {
      cancelled = true;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      detectorRef.current?.dispose?.();
      stopStream(streamRef.current);
      onReadyChange?.(false);
    };
  // The camera/model lifecycle should start once; the detection loop reads mutable refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function detectLoop(timestamp: number) {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (video && detector && video.readyState >= 2 && !detectionBusyRef.current && timestamp - lastDetectionAtRef.current > 90) {
      detectionBusyRef.current = true;
      lastDetectionAtRef.current = timestamp;

      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false, maxPoses: 1 });
        const result = createResultFromPose(poses[0], video);
        latestResultRef.current = result;
        setPoseDetected(Boolean(result && result.confidenceScore >= POSE_CONFIDENCE_THRESHOLD));
        onLiveResult?.(result);
        handleRecording(result);
        drawOverlay(result);
      } catch (detectionError) {
        setError(detectionError instanceof Error ? detectionError.message : labels.poseDetectionFailed);
      } finally {
        detectionBusyRef.current = false;
      }
    }

    animationRef.current = requestAnimationFrame(detectLoop);
  }

  function handleRecording(result: PoseFrameResult | null) {
    const recording = recordingRef.current;

    if (!recording) {
      return;
    }

    if (result && result.confidenceScore >= 0.35) {
      recording.samples.push(result);
    }

    const elapsedMs = performance.now() - recording.startedAt;
    setProgress(Math.min(1, elapsedMs / recording.durationMs));

    if (elapsedMs >= recording.durationMs) {
      recordingRef.current = null;
      setProgress(null);

      if (recording.samples.length < 6) {
        recording.reject(new Error(labels.insufficientPoseSamples));
      } else {
        recording.resolve(recording.samples);
      }
    }
  }

  function drawOverlay(result: PoseFrameResult | null) {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    const width = video.videoWidth || canvas.clientWidth || 1280;
    const height = video.videoHeight || canvas.clientHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);

    if (!result) {
      return;
    }

    const side = selectCyclingSide(result.keypoints);
    drawSegments(context, result.keypoints, side);
    drawKeypoints(context, result.keypoints);
    drawAngleLabels(context, result.keypoints, side, result.angles);
  }

  return (
    <View style={styles.frame}>
      <video autoPlay muted playsInline ref={videoRef} style={videoStyle} />
      <canvas
        ref={canvasRef}
        style={{ ...canvasStyle, opacity: poseDetected ? 1 : 0 }}
      />
      <RiderSilhouetteOverlay
        detected={poseDetected}
        detectedLabel={labels.riderPositionDetected}
        guide={labels.riderPositionGuide}
        title={labels.riderPositionTitle}
      />
      <View style={[styles.statusPanel, styles.noPointerEvents]}>
        <Text style={styles.statusText}>
          {progress === null ? status : `${labels.analyzing} ${(progress * 100).toFixed(0)}%`}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
});

function createResultFromPose(
  pose: { keypoints: { name?: string; part?: string; score?: number; x: number; y: number }[] } | undefined,
  video: HTMLVideoElement
): PoseFrameResult | null {
  if (!pose) {
    return null;
  }

  const frame = {
    height: video.videoHeight || 720,
    timestampMs: performance.now(),
    width: video.videoWidth || 1280
  };
  const keypoints: PoseKeypoint[] = pose.keypoints.map((keypoint) => ({
    confidence: keypoint.score ?? 0,
    name: keypoint.name ?? keypoint.part ?? "keypoint",
    x: keypoint.x,
    y: keypoint.y
  }));

  return createPoseFrameResult(keypoints, frame);
}

function drawSegments(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[], side: "left" | "right") {
  const segments: [string, string][] = [
    [`${side}_shoulder`, `${side}_elbow`],
    [`${side}_elbow`, `${side}_wrist`],
    [`${side}_shoulder`, `${side}_hip`],
    [`${side}_hip`, `${side}_knee`],
    [`${side}_knee`, `${side}_ankle`]
  ];

  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 8;
  context.strokeStyle = "rgba(12, 175, 215, 0.92)";

  for (const [startName, endName] of segments) {
    const start = findKeypoint(keypoints, startName);
    const end = findKeypoint(keypoints, endName);

    if (!start || !end) {
      continue;
    }

    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
}

function drawKeypoints(context: CanvasRenderingContext2D, keypoints: PoseKeypoint[]) {
  for (const keypoint of keypoints) {
    if (keypoint.confidence < 0.35) {
      continue;
    }

    context.beginPath();
    context.arc(keypoint.x, keypoint.y, 9, 0, Math.PI * 2);
    context.fillStyle = "#ff2d16";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "#ffffff";
    context.stroke();
  }
}

function drawAngleLabels(
  context: CanvasRenderingContext2D,
  keypoints: PoseKeypoint[],
  side: "left" | "right",
  angles: JointAngles
) {
  drawLabel(context, formatAngle("Knee", angles.kneeAngle), findKeypoint(keypoints, `${side}_knee`));
  drawLabel(context, formatAngle("Hip", angles.hipAngle), findKeypoint(keypoints, `${side}_hip`));
  drawLabel(context, formatAngle("Torso", angles.torsoAngle), findKeypoint(keypoints, `${side}_shoulder`));
  drawLabel(context, formatAngle("Elbow", angles.elbowAngle), findKeypoint(keypoints, `${side}_elbow`));
}

function drawLabel(context: CanvasRenderingContext2D, label: string | null, point?: PoseKeypoint) {
  if (!label || !point) {
    return;
  }

  context.font = "700 22px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const paddingX = 10;
  const paddingY = 7;
  const metrics = context.measureText(label);
  const width = metrics.width + paddingX * 2;
  const height = 36;
  const x = point.x + 14;
  const y = point.y - height - 8;

  context.fillStyle = "rgba(20, 35, 29, 0.78)";
  roundRect(context, x, y, width, height, 8);
  context.fill();
  context.fillStyle = "#ffffff";
  context.fillText(label, x + paddingX, y + height - paddingY - 2);
}

function formatAngle(label: string, value?: number): string | null {
  return typeof value === "number" ? `${label} ${value}°` : null;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function findKeypoint(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  return keypoints.find((keypoint) => keypoint.name === name && keypoint.confidence >= 0.25);
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

const videoStyle: CSSProperties = {
  height: "100%",
  left: 0,
  objectFit: "fill",
  position: "absolute",
  top: 0,
  width: "100%"
};

const canvasStyle: CSSProperties = {
  height: "100%",
  left: 0,
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  transition: "opacity 300ms ease",
  width: "100%"
};

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.ink,
    borderRadius: 8,
    minHeight: 320,
    overflow: "hidden",
    position: "relative"
  },
  statusPanel: {
    backgroundColor: "rgba(20,35,29,0.72)",
    borderRadius: 6,
    left: spacing.md,
    maxWidth: 360,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    top: spacing.md
  },
  noPointerEvents: {
    pointerEvents: "none"
  },
  statusText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800"
  },
  errorText: {
    color: "#ffd6d1",
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs
  }
});
