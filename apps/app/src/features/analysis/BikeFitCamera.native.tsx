import { analyzePoseFrame } from "@athmira/pose-engine";
import { Body, Button, Card, colors, spacing } from "@athmira/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { forwardRef, useEffect, useImperativeHandle, useRef, type ElementRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { BikeFitCameraHandle, BikeFitCameraProps } from "./BikeFitCamera.types";

export const BikeFitCamera = forwardRef<BikeFitCameraHandle, BikeFitCameraProps>(function BikeFitCamera(
  { labels, onLiveResult, onReadyChange },
  ref
) {
  const cameraRef = useRef<ElementRef<typeof CameraView> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = Boolean(permission?.granted);

  useEffect(() => {
    onReadyChange?.(hasPermission);

    if (hasPermission) {
      onLiveResult?.(analyzePoseFrame({ height: 720, timestampMs: Date.now(), width: 1280 }));
    } else {
      onLiveResult?.(null);
    }
  }, [hasPermission, onLiveResult, onReadyChange]);

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      const snapshot = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true
      });

      return snapshot?.uri ?? null;
    },
    async startAnalysis(durationMs = 2500) {
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

  return (
    <View style={styles.cameraFrame}>
      <CameraView ref={cameraRef} facing="front" style={styles.camera} />
      <View style={[styles.overlay, styles.noPointerEvents]}>
        <View style={styles.verticalGuide} />
        <View style={styles.torsoGuide} />
        <View style={styles.kneeGuide} />
        <View style={styles.marker} />
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
    minHeight: 320,
    overflow: "hidden",
    position: "relative"
  },
  camera: {
    height: "100%",
    width: "100%"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  noPointerEvents: {
    pointerEvents: "none"
  },
  verticalGuide: {
    backgroundColor: "rgba(255,255,255,0.45)",
    height: "86%",
    left: "50%",
    position: "absolute",
    top: "7%",
    width: 2
  },
  torsoGuide: {
    backgroundColor: colors.accent,
    height: 3,
    left: "30%",
    position: "absolute",
    top: "38%",
    transform: [{ rotate: "-18deg" }],
    width: "34%"
  },
  kneeGuide: {
    backgroundColor: "#b6eadc",
    height: 3,
    left: "42%",
    position: "absolute",
    top: "64%",
    transform: [{ rotate: "28deg" }],
    width: "24%"
  },
  marker: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    left: "48%",
    position: "absolute",
    top: "58%",
    width: 20
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
    top: spacing.md
  }
});
