import { analyzePoseFrame } from "@athmira/pose-engine";
import { Body, Button, Card, colors, spacing } from "@athmira/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { forwardRef, useEffect, useImperativeHandle, useRef, type ElementRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { FrontKneeCameraHandle, FrontKneeCameraProps } from "./FrontKneeCamera.types";

export const FrontKneeCamera = forwardRef<FrontKneeCameraHandle, FrontKneeCameraProps>(function FrontKneeCamera(
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
    async startTracking({ countdownMs = 10000, durationMs = 10000 } = {}) {
      await new Promise((resolve) => setTimeout(resolve, countdownMs + durationMs));

      return Array.from({ length: 30 }, (_, index) =>
        analyzePoseFrame({
          height: 720,
          timestampMs: Date.now() + index * 333,
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
        <View style={styles.centerGuide} />
        <View style={styles.kneeZoneLeft} />
        <View style={styles.kneeZoneRight} />
        <Text style={styles.nativeNotice}>{labels.frontKneeNativeNotice}</Text>
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
    aspectRatio: 9 / 16,
    backgroundColor: colors.ink,
    borderRadius: 8,
    maxHeight: 720,
    minHeight: 420,
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
  centerGuide: {
    backgroundColor: "rgba(255,255,255,0.38)",
    height: "88%",
    left: "50%",
    position: "absolute",
    top: "6%",
    width: 2
  },
  kneeZoneLeft: {
    borderColor: "#21ff47",
    borderWidth: 2,
    height: "38%",
    left: "22%",
    position: "absolute",
    top: "30%",
    width: "18%"
  },
  kneeZoneRight: {
    borderColor: "#21ff47",
    borderWidth: 2,
    height: "38%",
    position: "absolute",
    right: "22%",
    top: "30%",
    width: "18%"
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
