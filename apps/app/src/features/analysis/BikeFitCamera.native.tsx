import { analyzePoseFrame } from "@athmira/pose-engine";
import { Body, Button, Card, colors, spacing } from "@athmira/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ElementRef } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { BikeFitCameraHandle, BikeFitCameraProps } from "./BikeFitCamera.types";
import { RiderSilhouetteOverlay } from "./RiderSilhouetteOverlay";

export const BikeFitCamera = forwardRef<BikeFitCameraHandle, BikeFitCameraProps>(function BikeFitCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const cameraRef = useRef<ElementRef<typeof CameraView> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [previewReady, setPreviewReady] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const compact = width < 520;
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
    async startAnalysis(durationMs = 8000) {
      if (!isReady) {
        throw new Error(labels.poseNotReady);
      }

      await new Promise((resolve) => setTimeout(resolve, durationMs));

      return Array.from({ length: 12 }, (_, index) =>
        analyzePoseFrame({
          height: 720,
          timestampMs: Date.now() + index * 120,
          width: 1280
        })
      );
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
        ) : (
          <RiderSilhouetteOverlay
            detected={false}
            detectedLabel={labels.riderPositionDetected}
            guide={labels.riderPositionGuide}
            title={labels.riderPositionTitle}
          />
        )}
        <Text style={styles.nativeNotice}>{labels.nativePoseNotice}</Text>
      </View>
    </View>
  );
});

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
  nativeNotice: {
    backgroundColor: "rgba(20,35,29,0.72)",
    borderRadius: 6,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    left: spacing.md,
    maxWidth: 320,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: "absolute",
    right: spacing.md,
    top: spacing.md
  }
});
