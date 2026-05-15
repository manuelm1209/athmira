import { analyzeFrontKneeTracking, toFrontKneeTrackingSample } from "@athmira/fit-engine";
import { createPoseFrameResult } from "@athmira/pose-engine";
import type { FrontKneeTrackingSample, PoseFrameResult, PoseKeypoint } from "@athmira/types";
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

import type { FrontKneeCameraHandle, FrontKneeCameraLabels, FrontKneeCameraProps } from "./FrontKneeCamera.types";

type PoseDetector = {
  dispose?: () => void;
  estimatePoses: (
    image: HTMLVideoElement,
    config?: { flipHorizontal?: boolean; maxPoses?: number }
  ) => Promise<{ keypoints: { name?: string; part?: string; score?: number; x: number; y: number }[] }[]>;
};

type TrackingState = {
  countdownMs: number;
  durationMs: number;
  recordingStartedAt?: number;
  reject: (error: Error) => void;
  resolve: (samples: PoseFrameResult[]) => void;
  samples: PoseFrameResult[];
  startedAt: number;
};

type TrackingPhase = "idle" | "countdown" | "recording" | "complete";

export const FrontKneeCamera = forwardRef<FrontKneeCameraHandle, FrontKneeCameraProps>(function FrontKneeCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<PoseDetector | null>(null);
  const latestResultRef = useRef<PoseFrameResult | null>(null);
  const trackingRef = useRef<TrackingState | null>(null);
  const animationRef = useRef<number | null>(null);
  const pathSamplesRef = useRef<FrontKneeTrackingSample[]>([]);
  const detectionBusyRef = useRef(false);
  const lastDetectionAtRef = useRef(0);
  const [status, setStatus] = useState(labels.cameraPermissionRequesting);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<TrackingPhase>("idle");
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      const canvas = canvasRef.current;

      if (!canvas) {
        return null;
      }

      return canvas.toDataURL("image/jpeg", 0.82);
    },
    async startTracking({ countdownMs = 10000, durationMs = 10000 } = {}) {
      if (!detectorRef.current || !latestResultRef.current || latestResultRef.current.confidenceScore < 0.35) {
        throw new Error(labels.poseNotReady);
      }

      return new Promise<PoseFrameResult[]>((resolve, reject) => {
        pathSamplesRef.current = [];
        trackingRef.current = {
          countdownMs,
          durationMs,
          reject,
          resolve,
          samples: [],
          startedAt: performance.now()
        };
        setCountdownSeconds(Math.ceil(countdownMs / 1000));
        setError(null);
        setPhase("countdown");
        setProgress(null);
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
            height: { ideal: 1280 },
            width: { ideal: 720 }
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
  // The detector loop reads mutable refs and should only boot once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function detectLoop(timestamp: number) {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (video && detector && video.readyState >= 2 && !detectionBusyRef.current && timestamp - lastDetectionAtRef.current > 80) {
      detectionBusyRef.current = true;
      lastDetectionAtRef.current = timestamp;

      try {
        const poses = await detector.estimatePoses(video, { flipHorizontal: false, maxPoses: 1 });
        const result = createResultFromPose(poses[0], video);
        latestResultRef.current = result;
        onLiveResult?.(result);
        handleTracking(result);
        drawOverlay(result);
      } catch (detectionError) {
        setError(detectionError instanceof Error ? detectionError.message : labels.poseDetectionFailed);
      } finally {
        detectionBusyRef.current = false;
      }
    }

    animationRef.current = requestAnimationFrame(detectLoop);
  }

  function handleTracking(result: PoseFrameResult | null) {
    const tracking = trackingRef.current;

    if (!tracking) {
      return;
    }

    const now = performance.now();
    const countdownElapsed = now - tracking.startedAt;

    if (!tracking.recordingStartedAt) {
      const remainingMs = tracking.countdownMs - countdownElapsed;
      setCountdownSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));

      if (remainingMs > 0) {
        return;
      }

      tracking.recordingStartedAt = now;
      setCountdownSeconds(null);
      setPhase("recording");
      setProgress(0);
    }

    const recordingElapsed = now - tracking.recordingStartedAt;
    setProgress(Math.min(1, recordingElapsed / tracking.durationMs));

    if (result && result.confidenceScore >= 0.35) {
      tracking.samples.push(result);
      pathSamplesRef.current.push(toFrontKneeTrackingSample(result));
    }

    if (recordingElapsed >= tracking.durationMs) {
      trackingRef.current = null;
      setPhase("complete");
      setProgress(null);

      if (tracking.samples.length < 8) {
        tracking.reject(new Error(labels.insufficientPoseSamples));
      } else {
        tracking.resolve(tracking.samples);
      }
    }
  }

  function drawOverlay(result: PoseFrameResult | null) {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    const width = video.videoWidth || canvas.clientWidth || 720;
    const height = video.videoHeight || canvas.clientHeight || 1280;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    drawCenterGuide(context, width, height);
    drawPaths(context, pathSamplesRef.current);

    if (!result) {
      return;
    }

    const sample = toFrontKneeTrackingSample(result);
    drawLiveJoints(context, sample);

    const activeSamples = pathSamplesRef.current.length ? pathSamplesRef.current : [sample];
    const analysis = analyzeFrontKneeTracking(
      activeSamples.map((activeSample) => sampleToPoseFrame(activeSample, width, height)),
      { durationMs: 10000 }
    );
    drawMeasurementBox(context, sample.leftKnee, sample.leftAnkle, analysis.left.horizontalTravelPx, analysis.left.verticalTravelPx);
    drawMeasurementBox(
      context,
      sample.rightKnee,
      sample.rightAnkle,
      analysis.right.horizontalTravelPx,
      analysis.right.verticalTravelPx
    );
  }

  const overlayLabel = getOverlayLabel({
    countdownSeconds,
    labels,
    phase,
    progress
  });

  return (
    <View style={styles.frame}>
      <video autoPlay muted playsInline ref={videoRef} style={videoStyle} />
      <canvas ref={canvasRef} style={canvasStyle} />
      <View style={[styles.statusPanel, styles.noPointerEvents]}>
        <Text style={styles.statusText}>{status}</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
      {overlayLabel ? (
        <View style={[styles.bigOverlay, styles.noPointerEvents]}>
          <Text style={styles.bigOverlayText}>{overlayLabel}</Text>
        </View>
      ) : null}
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
    height: video.videoHeight || 1280,
    timestampMs: performance.now(),
    width: video.videoWidth || 720
  };
  const keypoints: PoseKeypoint[] = pose.keypoints.map((keypoint) => ({
    confidence: keypoint.score ?? 0,
    name: keypoint.name ?? keypoint.part ?? "keypoint",
    x: keypoint.x,
    y: keypoint.y
  }));

  return createPoseFrameResult(keypoints, frame);
}

function sampleToPoseFrame(sample: FrontKneeTrackingSample, width: number, height: number): PoseFrameResult {
  const keypoints: PoseKeypoint[] = [
    toPoseKeypoint("left_hip", sample.leftHip),
    toPoseKeypoint("left_knee", sample.leftKnee),
    toPoseKeypoint("left_ankle", sample.leftAnkle),
    toPoseKeypoint("right_hip", sample.rightHip),
    toPoseKeypoint("right_knee", sample.rightKnee),
    toPoseKeypoint("right_ankle", sample.rightAnkle)
  ].filter((keypoint): keypoint is PoseKeypoint => Boolean(keypoint));

  return createPoseFrameResult(keypoints, {
    height,
    timestampMs: sample.timestampMs,
    width
  });
}

function toPoseKeypoint(name: string, point?: { confidence: number; x: number; y: number }): PoseKeypoint | null {
  if (!point) {
    return null;
  }

  return {
    confidence: point.confidence,
    name,
    x: point.x,
    y: point.y
  };
}

function drawCenterGuide(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.strokeStyle = "rgba(255,255,255,0.4)";
  context.lineWidth = 3;
  context.setLineDash([12, 12]);
  context.beginPath();
  context.moveTo(width / 2, height * 0.06);
  context.lineTo(width / 2, height * 0.94);
  context.stroke();
  context.restore();
}

function drawPaths(context: CanvasRenderingContext2D, samples: FrontKneeTrackingSample[]) {
  drawPath(context, samples.map((sample) => sample.leftKnee), "rgba(255,45,22,0.86)");
  drawPath(context, samples.map((sample) => sample.rightKnee), "rgba(255,45,22,0.86)");
}

function drawPath(context: CanvasRenderingContext2D, points: ({ x: number; y: number } | undefined)[], color: string) {
  const usable = points.filter((point): point is { x: number; y: number } => Boolean(point));

  if (usable.length < 2) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 10;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(usable[0]?.x ?? 0, usable[0]?.y ?? 0);

  for (const point of usable.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.stroke();
  context.restore();
}

function drawLiveJoints(context: CanvasRenderingContext2D, sample: FrontKneeTrackingSample) {
  drawJointGroup(context, sample.leftHip, sample.leftKnee, sample.leftAnkle);
  drawJointGroup(context, sample.rightHip, sample.rightKnee, sample.rightAnkle);
}

function drawJointGroup(
  context: CanvasRenderingContext2D,
  hip?: { x: number; y: number },
  knee?: { x: number; y: number },
  ankle?: { x: number; y: number }
) {
  context.save();
  context.lineCap = "round";
  context.lineWidth = 7;
  context.strokeStyle = "rgba(33,255,71,0.85)";

  if (hip && knee) {
    context.beginPath();
    context.moveTo(hip.x, hip.y);
    context.lineTo(knee.x, knee.y);
    context.stroke();
  }

  if (knee && ankle) {
    context.beginPath();
    context.moveTo(knee.x, knee.y);
    context.lineTo(ankle.x, ankle.y);
    context.stroke();
  }

  drawCircle(context, hip, 9, "#21ff47");
  drawCircle(context, knee, 15, "#ff2d16");
  drawCircle(context, ankle, 13, "#21ff47");
  context.restore();
}

function drawMeasurementBox(
  context: CanvasRenderingContext2D,
  knee?: { x: number; y: number },
  ankle?: { x: number; y: number },
  horizontalPx = 0,
  verticalPx = 0
) {
  if (!knee || !ankle) {
    return;
  }

  const x = knee.x;
  const top = Math.min(knee.y, ankle.y);
  const bottom = Math.max(knee.y, ankle.y);
  const horizontal = Math.max(28, horizontalPx);
  const vertical = Math.max(40, verticalPx);

  context.save();
  context.strokeStyle = "#21ff47";
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(x - horizontal / 2, knee.y);
  context.lineTo(x + horizontal / 2, knee.y);
  context.moveTo(x, top);
  context.lineTo(x, bottom + vertical * 0.1);
  context.moveTo(x - horizontal / 2, top);
  context.lineTo(x - horizontal / 2, top + vertical);
  context.moveTo(x + horizontal / 2, top);
  context.lineTo(x + horizontal / 2, top + vertical);
  context.stroke();
  context.restore();
}

function drawCircle(context: CanvasRenderingContext2D, point: { x: number; y: number } | undefined, radius: number, color: string) {
  if (!point) {
    return;
  }

  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = "rgba(255,255,255,0.75)";
  context.stroke();
}

function getOverlayLabel(input: {
  countdownSeconds: number | null;
  labels: FrontKneeCameraLabels;
  phase: TrackingPhase;
  progress: number | null;
}) {
  if (input.phase === "countdown") {
    return `${input.labels.frontKneeGetReady}\n${input.countdownSeconds ?? 0}`;
  }

  if (input.phase === "recording") {
    return `${input.labels.frontKneeRecording}\n${Math.round((input.progress ?? 0) * 100)}%`;
  }

  if (input.phase === "complete") {
    return input.labels.frontKneeComplete;
  }

  return null;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

const videoStyle: CSSProperties = {
  height: "100%",
  objectFit: "cover",
  transform: "scaleX(-1)",
  width: "100%"
};

const canvasStyle: CSSProperties = {
  height: "100%",
  inset: 0,
  pointerEvents: "none",
  position: "absolute",
  transform: "scaleX(-1)",
  width: "100%"
};

const styles = StyleSheet.create({
  frame: {
    alignSelf: "center",
    aspectRatio: 9 / 16,
    backgroundColor: colors.ink,
    borderRadius: 8,
    maxHeight: 760,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  noPointerEvents: {
    pointerEvents: "none"
  },
  statusPanel: {
    backgroundColor: "rgba(10,18,15,0.72)",
    borderRadius: 8,
    left: spacing.md,
    maxWidth: 360,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    top: spacing.md
  },
  statusText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  errorText: {
    color: "#ffd3d0",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4
  },
  bigOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(6,11,9,0.22)",
    justifyContent: "center",
    padding: spacing.xl
  },
  bigOverlayText: {
    color: "#ffffff",
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 54,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 8
  }
});
