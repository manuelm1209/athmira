import { analyzePoseFrame } from "@athmira/pose-engine";
import { Body, Button, Card, colors, spacing } from "@athmira/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ElementRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { FrontKneeCameraHandle, FrontKneeCameraProps } from "./FrontKneeCamera.types";

type TrackingPhase = "idle" | "countdown" | "recording" | "complete";

const ACCENT = "#b7e64a";

export const FrontKneeCamera = forwardRef<FrontKneeCameraHandle, FrontKneeCameraProps>(function FrontKneeCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const cameraRef = useRef<ElementRef<typeof CameraView> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [previewReady, setPreviewReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [phase, setPhase] = useState<TrackingPhase>("idle");
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [recordingProgress, setRecordingProgress] = useState<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const { width } = useWindowDimensions();
  const compact = width < 520;
  const hasPermission = Boolean(permission?.granted);
  const isReady = hasPermission && previewReady && !mountError;

  useKeepAwake("athmira-front-knee-camera");

  useEffect(() => {
    onReadyChange?.(isReady);

    if (isReady) {
      onLiveResult?.(analyzePoseFrame({ height: 720, timestampMs: Date.now(), width: 1280 }));
    } else {
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
      clearTimers();
    };
  }, []);

  function clearTimers() {
    timersRef.current.forEach((handle) => clearTimeout(handle));
    intervalsRef.current.forEach((handle) => clearInterval(handle));
    timersRef.current = [];
    intervalsRef.current = [];
  }

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      if (!isReady) {
        return null;
      }

      const snapshot = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true
      });

      return snapshot?.uri ?? null;
    },
    async startTracking({ countdownMs = 10000, durationMs = 10000 } = {}) {
      if (!isReady) {
        throw new Error(labels.poseNotReady);
      }

      clearTimers();
      setPhase(countdownMs > 0 ? "countdown" : "recording");
      setCountdownSeconds(countdownMs > 0 ? Math.ceil(countdownMs / 1000) : null);
      setRecordingProgress(countdownMs > 0 ? null : 0);

      return new Promise<ReturnType<typeof analyzePoseFrame>[]>((resolve) => {
        if (countdownMs > 0) {
          const totalSeconds = Math.ceil(countdownMs / 1000);
          const tick = setInterval(() => {
            setCountdownSeconds((current) => {
              const next = (current ?? totalSeconds) - 1;
              if (next <= 0) {
                clearInterval(tick);
                return 0;
              }
              return next;
            });
          }, 1000);
          intervalsRef.current.push(tick);
        }

        const startRecordingHandle = setTimeout(() => {
          setPhase("recording");
          setCountdownSeconds(null);
          setRecordingProgress(0);

          const recordingStartedAt = Date.now();
          const progressTick = setInterval(() => {
            const elapsed = Date.now() - recordingStartedAt;
            setRecordingProgress(Math.min(1, elapsed / durationMs));
          }, 100);
          intervalsRef.current.push(progressTick);

          const completeHandle = setTimeout(() => {
            clearTimers();
            setPhase("complete");
            setRecordingProgress(null);
            resolve(
              Array.from({ length: 30 }, (_, index) =>
                analyzePoseFrame({
                  height: 720,
                  timestampMs: Date.now() + index * 333,
                  width: 1280
                })
              )
            );
          }, durationMs);
          timersRef.current.push(completeHandle);
        }, countdownMs);
        timersRef.current.push(startRecordingHandle);
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

  const overlay = getPhaseOverlay({
    countdownSeconds,
    labels,
    phase,
    progress: recordingProgress
  });

  return (
    <View style={[styles.cameraFrame, compact && styles.cameraFrameCompact]}>
      <CameraView
        active={hasPermission}
        animateShutter={false}
        facing="front"
        mirror
        mode="picture"
        onCameraReady={() => setPreviewReady(true)}
        onMountError={(event) => {
          setMountError(event.message);
          setPreviewReady(false);
        }}
        ratio="4:3"
        ref={cameraRef}
        responsiveOrientationWhenOrientationLocked
        style={styles.camera}
      />
      <View style={[styles.overlay, styles.noPointerEvents]}>
        {!previewReady ? (
          <View style={styles.previewStatus}>
            <Text style={styles.previewStatusText}>{labels.cameraPermissionRequesting}</Text>
          </View>
        ) : null}
        <View style={styles.centerGuide} pointerEvents="none" />
      </View>
      {overlay ? (
        <View style={[styles.phaseOverlay, styles.noPointerEvents]}>
          {overlay.heading ? <Text style={styles.phaseHeading}>{overlay.heading}</Text> : null}
          {overlay.bigNumber ? <Text style={styles.phaseBigNumber}>{overlay.bigNumber}</Text> : null}
        </View>
      ) : null}
      {phase === "idle" && previewReady ? (
        <View style={[styles.positionGuide, styles.noPointerEvents]}>
          <Text style={styles.positionGuideTitle}>{labels.frontKneePositionTitle}</Text>
          <Text style={styles.positionGuideBody}>{labels.frontKneePositionGuide}</Text>
        </View>
      ) : null}
    </View>
  );
});

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
