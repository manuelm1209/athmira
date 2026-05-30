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

  // Portrait + idle: show only the rotate-phone prompt as a full-width card.
  // We don't mount PoseLandmarkerView here — the bike fit flow is designed
  // for landscape only, and the camera would just be a cropped sliver
  // behind the prompt. Once the user rotates the device, the camera frame
  // takes over below.
  if (isPortrait && phase === "idle") {
    return (
      <Card style={styles.rotateCard}>
        <View style={styles.rotateIconWrapper}>
          <RotatePhoneIcon />
        </View>
        <Text style={styles.rotateTitle}>{labels.bikeFitRotatePromptTitle}</Text>
        <Text style={styles.rotateBody}>{labels.bikeFitRotatePromptBody}</Text>
      </Card>
    );
  }

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
    </View>
  );
});

// "Spin" icon — two arrows curving in a circular motion, signalling the
// rotate-your-phone action. ViewBox 0 0 52 52; both arcs in the brand
// lime so the rotation reads as one continuous gesture.
function RotatePhoneIcon() {
  return (
    <Svg viewBox="0 0 52 52" height={80} width={80}>
      <Path
        d="M43.82,8.181C39.509,3.869,33.778,1.5,27.67,1.5c-0.039,0-0.079,0-0.118,0C22.189,1.526,17.101,3.375,13,6.745V1c0-0.553-0.448-1-1-1s-1,0.447-1,1v8c0,0.13,0.027,0.26,0.077,0.382c0.101,0.245,0.296,0.439,0.541,0.541C11.74,9.973,11.87,10,12,10h9c0.552,0,1-0.447,1-1s-0.448-1-1-1h-6.34c3.679-2.884,8.168-4.476,12.901-4.5c0.036,0,0.072,0,0.107,0c5.574,0,10.804,2.162,14.737,6.095c7.768,7.768,8.14,20.363,0.846,28.676c-0.364,0.415-0.323,1.047,0.092,1.411c0.19,0.166,0.425,0.248,0.659,0.248c0.278,0,0.555-0.115,0.752-0.341C52.742,30.487,52.331,16.691,43.82,8.181z"
        fill="#b7e64a"
      />
      <Path
        d="M40.382,42.077C40.26,42.026,40.13,42,40,42h-9c-0.552,0-1,0.447-1,1s0.448,1,1,1h6.34c-3.679,2.884-8.168,4.476-12.901,4.5c-5.623,0.04-10.886-2.137-14.844-6.095c-7.771-7.771-8.141-20.37-0.84-28.682c0.364-0.415,0.323-1.047-0.092-1.411c-0.414-0.364-1.047-0.323-1.411,0.091c-7.994,9.103-7.586,22.901,0.929,31.416c4.311,4.312,10.042,6.681,16.15,6.681c0.039,0,0.079,0,0.118,0c5.363-0.026,10.45-1.875,14.551-5.245V51c0,0.553,0.448,1,1,1s1-0.447,1-1v-8c0-0.13-0.027-0.26-0.077-0.382C40.822,42.373,40.627,42.178,40.382,42.077z"
        fill="#b7e64a"
      />
    </Svg>
  );
}

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
  rotateCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl
  },
  rotateIconWrapper: {
    alignItems: "center",
    height: 80,
    justifyContent: "center",
    marginBottom: spacing.md,
    width: 80
  },
  rotateTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  rotateBody: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    maxWidth: 360,
    textAlign: "center"
  }
});
