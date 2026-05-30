import { selectCyclingSide } from "@athmira/pose-engine";
import type { PoseFrameResult } from "@athmira/types";
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
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import type { BikeFitCameraHandle, BikeFitCameraProps } from "./BikeFitCamera.types";
import { RiderSilhouetteOverlay } from "./RiderSilhouetteOverlay";
import {
  BIKE_FIT_JOINT_NAMES,
  BIKE_FIT_SEGMENTS,
  KEYPOINT_CONFIDENCE_THRESHOLD,
  LABEL_BG,
  LABEL_BORDER,
  POSE_CONFIDENCE_THRESHOLD,
  SKELETON_COLOR,
  bikeFitBadges,
  findKeypoint
} from "./native/poseOverlayMath";

type AnalysisPhase = "idle" | "countdown" | "recording" | "complete";

type RecordingState = {
  countdownMs: number;
  durationMs: number;
  recordingStartedAt?: number;
  reject: (error: Error) => void;
  resolve: (samples: PoseFrameResult[]) => void;
  samples: PoseFrameResult[];
  startedAt: number;
};

export const BikeFitCamera = forwardRef<BikeFitCameraHandle, BikeFitCameraProps>(function BikeFitCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const cameraRef = useRef<PoseLandmarkerViewRef | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [previewReady, setPreviewReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [recordingProgress, setRecordingProgress] = useState<number | null>(null);
  const [livePose, setLivePose] = useState<PoseFrameResult | null>(null);
  const recordingRef = useRef<RecordingState | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { height, width } = useWindowDimensions();
  const compact = width < 520;
  const isPortrait = height > width;
  const hasPermission = Boolean(permission?.granted);

  useKeepAwake("athmira-side-bike-fit-camera");

  const handlePose = useCallback(
    (result: PoseFrameResult | null) => {
      setLivePose(result);
      onLiveResult?.(result);

      const recording = recordingRef.current;
      if (!recording || !recording.recordingStartedAt) {
        return;
      }
      if (result && result.confidenceScore >= POSE_CONFIDENCE_THRESHOLD) {
        recording.samples.push(result);
      }
    },
    [onLiveResult]
  );

  const detectorEnabled = Boolean(hasPermission && previewReady && !mountError);
  // M2: pose detection now runs continuously inside PoseLandmarkerView (live
  // stream). The view emits poses directly via onPose. No more polling hook
  // or loading state — onReady fires once the camera session is up.
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
      recordingRef.current?.reject(new Error(labels.cameraAnalysisUnavailable));
      recordingRef.current = null;
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
    async startAnalysis({ countdownMs = 10000, durationMs = 8000 } = {}) {
      if (!isReady) {
        throw new Error(labels.poseNotReady);
      }

      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }

      return new Promise<PoseFrameResult[]>((resolve, reject) => {
        recordingRef.current = {
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
          const recording = recordingRef.current;
          if (!recording) {
            return;
          }
          const now = Date.now();
          if (!recording.recordingStartedAt) {
            const remainingMs = recording.countdownMs - (now - recording.startedAt);
            setCountdownSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
            if (remainingMs <= 0) {
              recording.recordingStartedAt = now;
              setCountdownSeconds(null);
              setPhase("recording");
              setRecordingProgress(0);
            }
            return;
          }
          const elapsedMs = now - recording.recordingStartedAt;
          setRecordingProgress(Math.min(1, elapsedMs / recording.durationMs));
          if (elapsedMs >= recording.durationMs) {
            const finished = recording;
            recordingRef.current = null;
            if (tickIntervalRef.current) {
              clearInterval(tickIntervalRef.current);
              tickIntervalRef.current = null;
            }
            setPhase("complete");
            setRecordingProgress(null);
            if (finished.samples.length < 6) {
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
        {livePose && poseDetected ? <BikeFitSkeleton pose={livePose} /> : null}
      </View>
      {!poseDetected && phase === "idle" && previewReady ? (
        <RiderSilhouetteOverlay
          detected={false}
          detectedLabel={labels.riderPositionDetected}
          guide={labels.riderPositionGuide}
          title={labels.riderPositionTitle}
        />
      ) : null}
      {overlay ? (
        <View style={[styles.phaseOverlay, styles.noPointerEvents]} pointerEvents="none">
          {overlay.heading ? <Text style={styles.phaseHeading}>{overlay.heading}</Text> : null}
          {overlay.bigNumber ? <Text style={styles.phaseBigNumber}>{overlay.bigNumber}</Text> : null}
        </View>
      ) : null}
      {isPortrait && phase === "idle" && previewReady ? (
        <View style={[styles.rotatePrompt, styles.noPointerEvents]} pointerEvents="none">
          <View style={styles.rotateIconWrapper}>
            <Svg viewBox="0 0 24 24" height={64} width={64}>
              <Path
                d="M16.48 2.52a1 1 0 0 1 1.41 0l4.59 4.59a1 1 0 0 1 0 1.41l-4.59 4.59a1 1 0 0 1-1.7-.71V10H10a4 4 0 0 0-4 4v6a1 1 0 1 1-2 0v-6a6 6 0 0 1 6-6h6.19V3.23a1 1 0 0 1 .29-.71z"
                fill="#b7e64a"
              />
              <Path
                d="M7.52 21.48a1 1 0 0 1-1.41 0L1.52 16.9a1 1 0 0 1 0-1.41l4.59-4.59a1 1 0 0 1 1.7.71V14H14a4 4 0 0 0 4-4V4a1 1 0 1 1 2 0v6a6 6 0 0 1-6 6H7.81v2.77a1 1 0 0 1-.29.71z"
                fill="#ffffff"
                fillOpacity={0.55}
              />
            </Svg>
          </View>
          <Text style={styles.rotateTitle}>{labels.bikeFitRotatePromptTitle}</Text>
          <Text style={styles.rotateBody}>{labels.bikeFitRotatePromptBody}</Text>
        </View>
      ) : null}
    </View>
  );
});

function BikeFitSkeleton({ pose }: { pose: PoseFrameResult }) {
  const side = useMemo(() => selectCyclingSide(pose.keypoints), [pose.keypoints]);
  const segments = useMemo(() => BIKE_FIT_SEGMENTS(side), [side]);
  const jointNames = useMemo(() => new Set(BIKE_FIT_JOINT_NAMES(side)), [side]);
  const badges = useMemo(() => bikeFitBadges(side, pose.angles), [side, pose.angles]);

  return (
    <Svg style={[StyleSheet.absoluteFillObject]} viewBox="0 0 1000 1000" preserveAspectRatio="none">
      {segments.map(([startName, endName]) => {
        const start = findKeypoint(pose.keypoints, startName);
        const end = findKeypoint(pose.keypoints, endName);
        if (!start || !end) {
          return null;
        }
        return (
          <Line
            key={`${startName}-${endName}`}
            stroke={SKELETON_COLOR}
            strokeLinecap="round"
            strokeWidth={6}
            x1={start.x * 1000}
            x2={end.x * 1000}
            y1={start.y * 1000}
            y2={end.y * 1000}
          />
        );
      })}
      {pose.keypoints.map((keypoint) => {
        if (keypoint.confidence < KEYPOINT_CONFIDENCE_THRESHOLD || !jointNames.has(keypoint.name)) {
          return null;
        }
        return (
          <Circle
            cx={keypoint.x * 1000}
            cy={keypoint.y * 1000}
            fill="rgba(13, 27, 34, 0.9)"
            key={keypoint.name}
            r={8}
            stroke={SKELETON_COLOR}
            strokeWidth={2.5}
          />
        );
      })}
      {badges.map((badge) => {
        const point = findKeypoint(pose.keypoints, badge.pointName);
        if (!point || typeof badge.value !== "number") {
          return null;
        }
        const px = point.x * 1000;
        const py = point.y * 1000;
        const badgeWidth = 95;
        const badgeHeight = 52;
        const offset = 36;
        let x = px;
        let y = py;
        if (badge.direction === "right") {
          x = px + offset;
          y = py - badgeHeight / 2;
        } else if (badge.direction === "left") {
          x = px - offset - badgeWidth;
          y = py - badgeHeight / 2;
        } else if (badge.direction === "up") {
          x = px - badgeWidth / 2;
          y = py - offset - badgeHeight;
        } else {
          x = px - badgeWidth / 2;
          y = py + offset;
        }
        return (
          <Fragment key={badge.label}>
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
            <SvgText
              fill={SKELETON_COLOR}
              fontSize={12}
              fontWeight="700"
              x={x + 12}
              y={y + 18}
            >
              {badge.label.toUpperCase()}
            </SvgText>
            <SvgText fill="#ffffff" fontSize={22} fontWeight="900" x={x + 12} y={y + 42}>
              {`${badge.value}°`}
            </SvgText>
          </Fragment>
        );
      })}
    </Svg>
  );
}

function getPhaseOverlay(input: {
  countdownSeconds: number | null;
  labels: BikeFitCameraProps["labels"];
  phase: AnalysisPhase;
  progress: number | null;
}) {
  if (input.phase === "countdown") {
    return {
      bigNumber: String(input.countdownSeconds ?? 0),
      heading: input.labels.bikeFitGetReady
    };
  }
  if (input.phase === "recording") {
    return {
      bigNumber: `${Math.round((input.progress ?? 0) * 100)}%`,
      heading: input.labels.bikeFitRecording
    };
  }
  if (input.phase === "complete") {
    return {
      bigNumber: null as string | null,
      heading: input.labels.bikeFitComplete
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
    aspectRatio: 16 / 9,
    backgroundColor: colors.ink,
    borderRadius: 8,
    minHeight: 280,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  cameraFrameCompact: {
    minHeight: 240
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
  rotatePrompt: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(13,27,34,0.92)",
    gap: spacing.sm,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg
  },
  rotateIconWrapper: {
    alignItems: "center",
    height: 64,
    justifyContent: "center",
    marginBottom: spacing.sm,
    width: 64
  },
  rotateTitle: {
    color: "#b7e64a",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  rotateBody: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    maxWidth: 360,
    textAlign: "center"
  }
});
