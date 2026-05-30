import { analyzeFrontKneeTracking, toFrontKneeTrackingSample } from "@athmira/fit-engine";
import type { FrontKneeTrackingSample, PoseFrameResult } from "@athmira/types";
import { Body, Button, Card, colors, spacing } from "@athmira/ui";
import { useCameraPermissions } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { PoseLandmarkerView, type PoseLandmarkerViewRef } from "expo-pose-landmarker";
import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";

import type { FrontKneeCameraHandle, FrontKneeCameraProps } from "./FrontKneeCamera.types";
import {
  LABEL_BG,
  LABEL_BORDER,
  PATH_COLOR,
  POSE_CONFIDENCE_THRESHOLD,
  SKELETON_COLOR
} from "./native/poseOverlayMath";

type TrackingPhase = "idle" | "countdown" | "recording" | "complete";

const ACCENT = "#b7e64a";
const VIEWBOX = 1000;

type TrackingState = {
  countdownMs: number;
  durationMs: number;
  recordingStartedAt?: number;
  reject: (error: Error) => void;
  resolve: (samples: PoseFrameResult[]) => void;
  samples: PoseFrameResult[];
  startedAt: number;
};

export const FrontKneeCamera = forwardRef<FrontKneeCameraHandle, FrontKneeCameraProps>(function FrontKneeCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const cameraRef = useRef<PoseLandmarkerViewRef | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [previewReady, setPreviewReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [phase, setPhase] = useState<TrackingPhase>("idle");
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [recordingProgress, setRecordingProgress] = useState<number | null>(null);
  const [livePose, setLivePose] = useState<PoseFrameResult | null>(null);
  const [trackedSamples, setTrackedSamples] = useState<FrontKneeTrackingSample[]>([]);
  const trackingRef = useRef<TrackingState | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width } = useWindowDimensions();
  const compact = width < 520;
  const hasPermission = Boolean(permission?.granted);

  useKeepAwake("athmira-front-knee-camera");

  const handlePose = useCallback(
    (result: PoseFrameResult | null) => {
      setLivePose(result);
      onLiveResult?.(result);

      const tracking = trackingRef.current;
      if (!tracking || !tracking.recordingStartedAt) {
        return;
      }
      if (result && result.confidenceScore >= POSE_CONFIDENCE_THRESHOLD) {
        tracking.samples.push(result);
        const sample = toFrontKneeTrackingSample(result);
        setTrackedSamples((current) => [...current, sample]);
      }
    },
    [onLiveResult]
  );

  const detectorEnabled = Boolean(hasPermission && previewReady && !mountError);
  // M2: pose detection runs continuously inside PoseLandmarkerView. No more
  // polling hook — onPose fires for every native frame the detector resolves.
  const isReady = detectorEnabled;

  useEffect(() => {
    onReadyChange?.(isReady);
    if (!isReady) {
      onLiveResult?.(null);
    }
  }, [isReady, onLiveResult, onReadyChange]);

  useEffect(() => {
    if (!hasPermission) {
      setPreviewReady(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      trackingRef.current?.reject(new Error(labels.cameraAnalysisUnavailable));
      trackingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      if (!isReady) {
        return null;
      }
      try {
        return (await cameraRef.current?.takePicture()) ?? null;
      } catch {
        return null;
      }
    },
    async startTracking({ countdownMs = 10000, durationMs = 10000 } = {}) {
      if (!isReady || !livePose || livePose.confidenceScore < POSE_CONFIDENCE_THRESHOLD) {
        throw new Error(labels.poseNotReady);
      }

      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }

      setTrackedSamples([]);

      return new Promise<PoseFrameResult[]>((resolve, reject) => {
        trackingRef.current = {
          countdownMs,
          durationMs,
          reject,
          resolve,
          samples: [],
          startedAt: Date.now()
        };
        setCountdownSeconds(countdownMs > 0 ? Math.ceil(countdownMs / 1000) : null);
        setPhase(countdownMs > 0 ? "countdown" : "recording");
        setRecordingProgress(countdownMs > 0 ? null : 0);

        tickIntervalRef.current = setInterval(() => {
          const tracking = trackingRef.current;
          if (!tracking) {
            return;
          }
          const now = Date.now();
          if (!tracking.recordingStartedAt) {
            const remainingMs = tracking.countdownMs - (now - tracking.startedAt);
            setCountdownSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
            if (remainingMs <= 0) {
              tracking.recordingStartedAt = now;
              setCountdownSeconds(null);
              setPhase("recording");
              setRecordingProgress(0);
            }
            return;
          }
          const elapsedMs = now - tracking.recordingStartedAt;
          setRecordingProgress(Math.min(1, elapsedMs / tracking.durationMs));
          if (elapsedMs >= tracking.durationMs) {
            const finished = tracking;
            trackingRef.current = null;
            if (tickIntervalRef.current) {
              clearInterval(tickIntervalRef.current);
              tickIntervalRef.current = null;
            }
            setPhase("complete");
            setRecordingProgress(null);
            if (finished.samples.length < 8) {
              finished.reject(new Error(labels.insufficientPoseSamples));
            } else {
              finished.resolve(finished.samples);
            }
          }
        }, 100);
      });
    }
  }));

  if (!permission) {
    return (
      <Card>
        <Body>{labels.cameraPermissionLoading}</Body>
      </Card>
    );
  }

  if (!hasPermission) {
    return (
      <Card style={styles.permissionCard}>
        <Body>{labels.cameraDenied}</Body>
        <Button onPress={requestPermission}>{labels.cameraEnable}</Button>
      </Card>
    );
  }

  if (mountError) {
    return (
      <Card style={styles.permissionCard}>
        <Body>{mountError}</Body>
        <Button
          onPress={() => {
            setMountError(null);
            setPreviewReady(false);
          }}
        >
          {labels.cameraEnable}
        </Button>
      </Card>
    );
  }

  const overlay = getPhaseOverlay({ countdownSeconds, labels, phase, progress: recordingProgress });
  const poseDetected = Boolean(livePose && livePose.confidenceScore >= POSE_CONFIDENCE_THRESHOLD);

  return (
    <View style={[styles.cameraFrame, compact && styles.cameraFrameCompact]}>
      <PoseLandmarkerView
        enabled={hasPermission}
        facing="front"
        mirror
        onMountError={(message) => {
          setMountError(message);
          setPreviewReady(false);
        }}
        onPose={handlePose}
        onReady={() => setPreviewReady(true)}
        ref={cameraRef}
        style={styles.camera}
      />
      <View style={[styles.overlay, styles.noPointerEvents]} pointerEvents="none">
        {!previewReady ? (
          <View style={styles.previewStatus}>
            <Text style={styles.previewStatusText}>{labels.cameraPermissionRequesting}</Text>
          </View>
        ) : null}
        <View style={styles.centerGuide} pointerEvents="none" />
        <FrontKneeOverlay pose={poseDetected ? livePose : null} samples={trackedSamples} />
      </View>
      {overlay ? (
        <View style={[styles.phaseOverlay, styles.noPointerEvents]} pointerEvents="none">
          {overlay.heading ? <Text style={styles.phaseHeading}>{overlay.heading}</Text> : null}
          {overlay.bigNumber ? <Text style={styles.phaseBigNumber}>{overlay.bigNumber}</Text> : null}
        </View>
      ) : null}
      {phase === "idle" && previewReady ? (
        <View style={[styles.positionGuide, styles.noPointerEvents]} pointerEvents="none">
          <Text style={styles.positionGuideTitle}>{labels.frontKneePositionTitle}</Text>
          <Text style={styles.positionGuideBody}>{labels.frontKneePositionGuide}</Text>
        </View>
      ) : null}
    </View>
  );
});

function FrontKneeOverlay({
  pose,
  samples
}: {
  pose: PoseFrameResult | null;
  samples: FrontKneeTrackingSample[];
}) {
  const liveSample = useMemo(() => (pose ? toFrontKneeTrackingSample(pose) : null), [pose]);
  const allSamples = useMemo(
    () => (samples.length ? samples : liveSample ? [liveSample] : []),
    [samples, liveSample]
  );
  const analysis = useMemo(() => {
    if (!allSamples.length || !pose) {
      return null;
    }
    return analyzeFrontKneeTracking(
      allSamples.map((sample) => sampleToFrame(sample, pose)),
      { durationMs: 10000 }
    );
  }, [allSamples, pose]);

  return (
    <Svg style={[StyleSheet.absoluteFillObject]} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} preserveAspectRatio="none">
      <KneePath points={samples.map((sample) => sample.leftKnee)} />
      <KneePath points={samples.map((sample) => sample.rightKnee)} />
      {liveSample ? (
        <>
          <JointGroup hip={liveSample.leftHip} knee={liveSample.leftKnee} ankle={liveSample.leftAnkle} />
          <JointGroup hip={liveSample.rightHip} knee={liveSample.rightKnee} ankle={liveSample.rightAnkle} />
          <AlignmentTrack from={liveSample.leftHip} to={liveSample.leftAnkle} />
          <AlignmentTrack from={liveSample.rightHip} to={liveSample.rightAnkle} />
          {analysis ? (
            <>
              <DriftBadge
                direction="left"
                driftMm={analysis.left.kneeDriftMm}
                driftPx={analysis.left.kneeDriftPx}
                point={liveSample.leftKnee}
                side="L"
              />
              <DriftBadge
                direction="right"
                driftMm={analysis.right.kneeDriftMm}
                driftPx={analysis.right.kneeDriftPx}
                point={liveSample.rightKnee}
                side="R"
              />
            </>
          ) : null}
        </>
      ) : null}
    </Svg>
  );
}

function KneePath({ points }: { points: ({ x: number; y: number } | undefined)[] }) {
  const usable = points.filter((point): point is { x: number; y: number } => Boolean(point));
  if (usable.length < 2) {
    return null;
  }
  const polyPoints = usable.map((point) => `${point.x * VIEWBOX},${point.y * VIEWBOX}`).join(" ");
  return (
    <Polyline
      fill="none"
      points={polyPoints}
      stroke={PATH_COLOR}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={4}
    />
  );
}

function JointGroup({
  hip,
  knee,
  ankle
}: {
  hip?: { x: number; y: number };
  knee?: { x: number; y: number };
  ankle?: { x: number; y: number };
}) {
  return (
    <Fragment>
      {hip && knee ? (
        <Line
          stroke={SKELETON_COLOR}
          strokeLinecap="round"
          strokeWidth={6}
          x1={hip.x * VIEWBOX}
          x2={knee.x * VIEWBOX}
          y1={hip.y * VIEWBOX}
          y2={knee.y * VIEWBOX}
        />
      ) : null}
      {knee && ankle ? (
        <Line
          stroke={SKELETON_COLOR}
          strokeLinecap="round"
          strokeWidth={6}
          x1={knee.x * VIEWBOX}
          x2={ankle.x * VIEWBOX}
          y1={knee.y * VIEWBOX}
          y2={ankle.y * VIEWBOX}
        />
      ) : null}
      <JointMarker point={hip} />
      <JointMarker point={knee} />
      <JointMarker point={ankle} />
    </Fragment>
  );
}

function JointMarker({ point }: { point?: { x: number; y: number } }) {
  if (!point) {
    return null;
  }
  return (
    <Circle
      cx={point.x * VIEWBOX}
      cy={point.y * VIEWBOX}
      fill="rgba(13, 27, 34, 0.9)"
      r={9}
      stroke={SKELETON_COLOR}
      strokeWidth={2.5}
    />
  );
}

function AlignmentTrack({
  from,
  to
}: {
  from?: { x: number; y: number };
  to?: { x: number; y: number };
}) {
  if (!from || !to) {
    return null;
  }
  return (
    <Line
      stroke="rgba(183, 230, 74, 0.45)"
      strokeDasharray="4,6"
      strokeWidth={1.5}
      x1={from.x * VIEWBOX}
      x2={to.x * VIEWBOX}
      y1={from.y * VIEWBOX}
      y2={to.y * VIEWBOX}
    />
  );
}

function DriftBadge({
  direction,
  driftMm,
  driftPx,
  point,
  side
}: {
  direction: "left" | "right";
  driftMm: number | null;
  driftPx: number;
  point?: { x: number; y: number };
  side: "L" | "R";
}) {
  if (!point) {
    return null;
  }
  const value = driftMm !== null ? `${driftMm} mm` : `${Math.round(driftPx)} px`;
  const badgeWidth = 130;
  const badgeHeight = 72;
  const offset = 40;
  const px = point.x * VIEWBOX;
  const py = point.y * VIEWBOX;
  const x = direction === "left" ? px - offset - badgeWidth : px + offset;
  const y = py - badgeHeight / 2;

  return (
    <Fragment>
      <Rect
        fill={LABEL_BG}
        height={badgeHeight}
        rx={10}
        ry={10}
        stroke={LABEL_BORDER}
        strokeWidth={1.5}
        width={badgeWidth}
        x={x}
        y={y}
      />
      <SvgText fill={SKELETON_COLOR} fontSize={14} fontWeight="700" x={x + 14} y={y + 22}>
        {`${side} DRIFT`}
      </SvgText>
      <SvgText fill="#ffffff" fontSize={26} fontWeight="900" x={x + 14} y={y + 54}>
        {value}
      </SvgText>
    </Fragment>
  );
}

function sampleToFrame(sample: FrontKneeTrackingSample, source: PoseFrameResult): PoseFrameResult {
  return {
    angles: source.angles,
    confidenceScore: source.confidenceScore,
    frame: source.frame
      ? { height: source.frame.height, timestampMs: sample.timestampMs, width: source.frame.width }
      : undefined,
    keypoints: [
      sample.leftHip ? { confidence: sample.leftHip.confidence, name: "left_hip", x: sample.leftHip.x, y: sample.leftHip.y } : null,
      sample.leftKnee ? { confidence: sample.leftKnee.confidence, name: "left_knee", x: sample.leftKnee.x, y: sample.leftKnee.y } : null,
      sample.leftAnkle ? { confidence: sample.leftAnkle.confidence, name: "left_ankle", x: sample.leftAnkle.x, y: sample.leftAnkle.y } : null,
      sample.rightHip ? { confidence: sample.rightHip.confidence, name: "right_hip", x: sample.rightHip.x, y: sample.rightHip.y } : null,
      sample.rightKnee ? { confidence: sample.rightKnee.confidence, name: "right_knee", x: sample.rightKnee.x, y: sample.rightKnee.y } : null,
      sample.rightAnkle ? { confidence: sample.rightAnkle.confidence, name: "right_ankle", x: sample.rightAnkle.x, y: sample.rightAnkle.y } : null
    ].filter(Boolean) as PoseFrameResult["keypoints"]
  };
}

function getPhaseOverlay(input: {
  countdownSeconds: number | null;
  labels: FrontKneeCameraProps["labels"];
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

const styles = StyleSheet.create({
  permissionCard: {
    alignItems: "flex-start",
    gap: spacing.md
  },
  cameraFrame: {
    aspectRatio: 9 / 16,
    backgroundColor: colors.ink,
    borderRadius: 8,
    maxHeight: 680,
    minHeight: 420,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  cameraFrameCompact: {
    maxHeight: 620,
    minHeight: 360
  },
  camera: {
    ...StyleSheet.absoluteFillObject
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  noPointerEvents: {
    pointerEvents: "none"
  },
  previewStatus: {
    alignItems: "center",
    backgroundColor: "rgba(13,27,34,0.74)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  statusBadge: {
    backgroundColor: "rgba(13,27,34,0.74)",
    borderRadius: 6,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    top: spacing.md
  },
  previewStatusText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  centerGuide: {
    backgroundColor: "rgba(255,255,255,0.32)",
    height: "88%",
    left: "50%",
    position: "absolute",
    top: "6%",
    width: 1
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
    color: ACCENT,
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
    color: ACCENT,
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
