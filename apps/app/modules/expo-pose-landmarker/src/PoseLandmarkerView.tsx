import { createPoseFrameResult } from "@athmira/pose-engine";
import type { PoseFrameResult } from "@athmira/types";
import { requireNativeViewManager } from "expo-modules-core";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { mapMediaPipePoseToCoco17 } from "./landmarkMapping";
import type { RawPoseLandmark } from "./PoseFrameResult";

type NativeOnPoseEvent = {
  nativeEvent: {
    landmarks: RawPoseLandmark[];
    timestampMs: number;
    delegate?: "gpu" | "cpu";
  };
};

type NativeOnReadyEvent = { nativeEvent: Record<string, never> };
type NativeOnMountErrorEvent = { nativeEvent: { message: string } };

// The native view exposes `takePicture` as an AsyncFunction declared inside
// the View(...) block in the iOS Swift / Android Kotlin module. Expo
// Modules surfaces these as methods on the native view's ref.
type NativeViewMethods = {
  takePicture: () => Promise<string | null>;
};

type NativeProps = {
  facing?: "front" | "back";
  mirror?: boolean;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPose?: (event: NativeOnPoseEvent) => void;
  onReady?: (event: NativeOnReadyEvent) => void;
  onMountError?: (event: NativeOnMountErrorEvent) => void;
};

const NativeView = requireNativeViewManager<NativeProps>("ExpoPoseLandmarkerModule");

export type PoseLandmarkerViewProps = {
  facing?: "front" | "back";
  mirror?: boolean;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPose?: (pose: PoseFrameResult | null) => void;
  onReady?: () => void;
  onMountError?: (message: string) => void;
};

export type PoseLandmarkerViewRef = {
  takePicture: () => Promise<string | null>;
};

// Live-stream pose detection view backed by AVCaptureSession on iOS and
// CameraX on Android. Drop-in replacement for `<CameraView />` from
// expo-camera, with pose detection always running while `enabled`.
//
// Frames stay native — they never round-trip through JS. Each detection
// result is wrapped into a `PoseFrameResult` (matching the shape the rest
// of athmira's pose pipeline expects) before being handed to `onPose`.
export const PoseLandmarkerView = forwardRef<PoseLandmarkerViewRef, PoseLandmarkerViewProps>(
  function PoseLandmarkerView(
    { facing = "front", mirror = true, enabled = true, onPose, onReady, onMountError, style },
    ref
  ) {
    const nativeRef = useRef<NativeViewMethods | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        takePicture: async () => {
          const native = nativeRef.current;
          if (!native?.takePicture) {
            return null;
          }
          try {
            return await native.takePicture();
          } catch {
            return null;
          }
        }
      }),
      []
    );

    const handleNativePose = useCallback(
      (event: NativeOnPoseEvent) => {
        if (!onPose) {
          return;
        }
        const landmarks = event.nativeEvent.landmarks ?? [];
        if (landmarks.length === 0) {
          onPose(null);
          return;
        }
        const keypoints = mapMediaPipePoseToCoco17(landmarks);
        if (keypoints.length === 0) {
          onPose(null);
          return;
        }
        const pose = createPoseFrameResult(keypoints, {
          // Native side normalizes coords to [0, 1] view-space, so we feed
          // a unit square as the source frame — keeps the existing overlay
          // math, which already scales by 1000, intact.
          width: 1,
          height: 1,
          timestampMs: event.nativeEvent.timestampMs
        });
        onPose(pose);
      },
      [onPose]
    );

    const handleNativeReady = useCallback(() => {
      onReady?.();
    }, [onReady]);

    const handleNativeMountError = useCallback(
      (event: NativeOnMountErrorEvent) => {
        onMountError?.(event.nativeEvent.message);
      },
      [onMountError]
    );

    return (
      <NativeView
        enabled={enabled}
        facing={facing}
        mirror={mirror}
        onMountError={handleNativeMountError}
        onPose={handleNativePose}
        onReady={handleNativeReady}
        ref={nativeRef as never}
        style={style}
      />
    );
  }
);
