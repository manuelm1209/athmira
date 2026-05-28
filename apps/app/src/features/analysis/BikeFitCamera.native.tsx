import { analyzePoseFrame } from "@athmira/pose-engine";
import { Body, Button, Card, colors, spacing } from "@athmira/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ElementRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

import type { BikeFitCameraHandle, BikeFitCameraProps } from "./BikeFitCamera.types";
import { RiderSilhouetteOverlay } from "./RiderSilhouetteOverlay";

type AnalysisPhase = "idle" | "countdown" | "recording" | "complete";

export const BikeFitCamera = forwardRef<BikeFitCameraHandle, BikeFitCameraProps>(function BikeFitCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const cameraRef = useRef<ElementRef<typeof CameraView> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [previewReady, setPreviewReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [recordingProgress, setRecordingProgress] = useState<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const { height, width } = useWindowDimensions();
  const compact = width < 520;
  const isPortrait = height > width;
  const hasPermission = Boolean(permission?.granted);
  const isReady = hasPermission && previewReady && !mountError;

  useKeepAwake("athmira-side-bike-fit-camera");

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
    async startAnalysis({ countdownMs = 10000, durationMs = 8000 } = {}) {
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
              Array.from({ length: 12 }, (_, index) =>
                analyzePoseFrame({
                  height: 720,
                  timestampMs: Date.now() + index * 120,
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
    bigNumberOverride: null,
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
        ratio="16:9"
        ref={cameraRef}
        responsiveOrientationWhenOrientationLocked
        style={styles.camera}
      />
      <View style={[styles.overlay, styles.noPointerEvents]}>
        {!previewReady ? (
          <View style={styles.previewStatus}>
            <Text style={styles.previewStatusText}>{labels.cameraPermissionRequesting}</Text>
          </View>
        ) : phase === "idle" ? (
          <RiderSilhouetteOverlay
            detected={false}
            detectedLabel={labels.riderPositionDetected}
            guide={labels.riderPositionGuide}
            title={labels.riderPositionTitle}
          />
        ) : null}
      </View>
      {overlay ? (
        <View style={[styles.phaseOverlay, styles.noPointerEvents]}>
          {overlay.heading ? <Text style={styles.phaseHeading}>{overlay.heading}</Text> : null}
          {overlay.bigNumber ? <Text style={styles.phaseBigNumber}>{overlay.bigNumber}</Text> : null}
        </View>
      ) : null}
      {isPortrait && previewReady && phase === "idle" ? (
        <View style={[styles.rotatePrompt, styles.noPointerEvents]}>
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

function getPhaseOverlay(input: {
  bigNumberOverride: string | null;
  countdownSeconds: number | null;
  labels: BikeFitCameraProps["labels"];
  phase: AnalysisPhase;
  progress: number | null;
}) {
  if (input.phase === "countdown") {
    return {
      bigNumber: input.bigNumberOverride ?? String(input.countdownSeconds ?? 0),
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
