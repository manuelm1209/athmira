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
    drawAlignmentTrack(context, sample.leftHip, sample.leftAnkle);
    drawAlignmentTrack(context, sample.rightHip, sample.rightAnkle);
    drawDriftBadge(context, "L", sample.leftKnee, analysis.left.kneeDriftMm, analysis.left.kneeDriftPx, "left");
    drawDriftBadge(context, "R", sample.rightKnee, analysis.right.kneeDriftMm, analysis.right.kneeDriftPx, "right");
  }

  const overlay = getPhaseOverlay({
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
      {overlay ? (
        <View style={[styles.phaseOverlay, styles.noPointerEvents]}>
          {overlay.heading ? <Text style={styles.phaseHeading}>{overlay.heading}</Text> : null}
          {overlay.bigNumber ? <Text style={styles.phaseBigNumber}>{overlay.bigNumber}</Text> : null}
        </View>
      ) : null}
      {phase === "idle" ? (
        <View style={[styles.positionGuide, styles.noPointerEvents]}>
          <Text style={styles.positionGuideTitle}>{labels.frontKneePositionTitle}</Text>
          <Text style={styles.positionGuideBody}>{labels.frontKneePositionGuide}</Text>
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

const SKELETON_COLOR = "#b7e64a";
const SKELETON_GLOW = "rgba(183, 230, 74, 0.55)";
const PATH_COLOR = "rgba(239, 113, 95, 0.85)";
const LABEL_BG = "rgba(13, 27, 34, 0.82)";
const LABEL_BORDER = "rgba(183, 230, 74, 0.85)";

function drawCenterGuide(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.32)";
  context.lineWidth = 1;
  context.setLineDash([6, 8]);
  context.beginPath();
  context.moveTo(width / 2, height * 0.06);
  context.lineTo(width / 2, height * 0.94);
  context.stroke();
  context.restore();
}

function drawPaths(context: CanvasRenderingContext2D, samples: FrontKneeTrackingSample[]) {
  drawPath(context, samples.map((sample) => sample.leftKnee));
  drawPath(context, samples.map((sample) => sample.rightKnee));
}

function drawPath(context: CanvasRenderingContext2D, points: ({ x: number; y: number } | undefined)[]) {
  const usable = points.filter((point): point is { x: number; y: number } => Boolean(point));

  if (usable.length < 2) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 2.5;
  context.strokeStyle = PATH_COLOR;
  context.shadowColor = "rgba(239, 113, 95, 0.45)";
  context.shadowBlur = 4;
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
  context.lineJoin = "round";
  context.lineWidth = 3;
  context.strokeStyle = SKELETON_COLOR;
  context.shadowColor = SKELETON_GLOW;
  context.shadowBlur = 6;

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

  drawJointMarker(context, hip);
  drawJointMarker(context, knee);
  drawJointMarker(context, ankle);
  context.restore();
}

function drawJointMarker(context: CanvasRenderingContext2D, point: { x: number; y: number } | undefined) {
  if (!point) {
    return;
  }

  context.save();
  context.shadowColor = SKELETON_GLOW;
  context.shadowBlur = 8;
  context.beginPath();
  context.arc(point.x, point.y, 5.5, 0, Math.PI * 2);
  context.lineWidth = 2;
  context.strokeStyle = SKELETON_COLOR;
  context.fillStyle = "rgba(13, 27, 34, 0.9)";
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.beginPath();
  context.arc(point.x, point.y, 1.8, 0, Math.PI * 2);
  context.fillStyle = SKELETON_COLOR;
  context.fill();
  context.restore();
}

function drawAlignmentTrack(
  context: CanvasRenderingContext2D,
  hip?: { x: number; y: number },
  ankle?: { x: number; y: number }
) {
  if (!hip || !ankle) {
    return;
  }

  context.save();
  context.strokeStyle = "rgba(183, 230, 74, 0.45)";
  context.lineWidth = 1;
  context.setLineDash([4, 6]);
  context.beginPath();
  context.moveTo(hip.x, hip.y);
  context.lineTo(ankle.x, ankle.y);
  context.stroke();
  context.restore();
}

function drawDriftBadge(
  context: CanvasRenderingContext2D,
  side: "L" | "R",
  point: { x: number; y: number } | undefined,
  driftMm: number | null,
  driftPx: number,
  direction: "left" | "right"
) {
  if (!point) {
    return;
  }

  const labelText = `${side} DRIFT`;
  const valueText = driftMm !== null ? `${driftMm} mm` : `${Math.round(driftPx)} px`;

  context.save();
  context.font = "700 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const labelWidth = context.measureText(labelText).width;
  context.font = "900 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  const valueWidth = context.measureText(valueText).width;

  const paddingX = 16;
  const paddingY = 10;
  const innerWidth = Math.max(labelWidth, valueWidth);
  const width = innerWidth + paddingX * 2;
  const height = 62;
  const offset = 28;
  const x = direction === "left" ? point.x - width - offset : point.x + offset;
  const y = point.y - height / 2;

  context.strokeStyle = LABEL_BORDER;
  context.lineWidth = 1;
  context.setLineDash([3, 3]);
  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(direction === "left" ? x + width : x, y + height / 2);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = LABEL_BG;
  context.strokeStyle = LABEL_BORDER;
  context.lineWidth = 1.25;
  roundRect(context, x, y, width, height, 8);
  context.fill();
  context.stroke();

  context.save();
  context.scale(-1, 1);
  context.textBaseline = "top";

  const textAnchor = -(x + width - paddingX);
  context.fillStyle = "rgba(183, 230, 74, 0.95)";
  context.font = "700 16px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(labelText, textAnchor, y + paddingY - 2);

  context.fillStyle = "#ffffff";
  context.font = "900 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(valueText, textAnchor, y + paddingY + 18);
  context.restore();
  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function getPhaseOverlay(input: {
  countdownSeconds: number | null;
  labels: FrontKneeCameraLabels;
  phase: TrackingPhase;
  progress: number | null;
}) {
  if (input.phase === "countdown") {
    return {
      bigNumber: String(input.countdownSeconds ?? 0),
      heading: input.labels.frontKneeGetReady
    };
  }

  if (input.phase === "recording") {
    return {
      bigNumber: `${Math.round((input.progress ?? 0) * 100)}%`,
      heading: input.labels.frontKneeRecording
    };
  }

  if (input.phase === "complete") {
    return {
      bigNumber: null as string | null,
      heading: input.labels.frontKneeComplete
    };
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
  phaseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(6,11,9,0.32)",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.xl
  },
  phaseHeading: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 8
  },
  phaseBigNumber: {
    color: "#b7e64a",
    fontSize: 96,
    fontWeight: "900",
    lineHeight: 104,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 12
  },
  positionGuide: {
    backgroundColor: "rgba(13, 27, 34, 0.78)",
    borderColor: "rgba(183, 230, 74, 0.6)",
    borderRadius: 12,
    borderWidth: 1,
    bottom: spacing.lg,
    gap: spacing.xs,
    left: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: "absolute",
    right: spacing.md
  },
  positionGuideTitle: {
    color: "#b7e64a",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  positionGuideBody: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21
  }
});
