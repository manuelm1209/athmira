import { createPoseFrameResult } from "@athmira/pose-engine";
import type { PoseFrameResult } from "@athmira/types";
import { requireNativeModule } from "expo-modules-core";

import { mapMediaPipePoseToCoco17 } from "./landmarkMapping";
import type { RawPoseDetection } from "./PoseFrameResult";

type ExpoPoseLandmarkerNativeModule = {
  detectPoseFromUri: (uri: string) => Promise<RawPoseDetection | null>;
  warmUp: () => Promise<void>;
  getActiveDelegate: () => "gpu" | "cpu";
};

const NativeModule = requireNativeModule<ExpoPoseLandmarkerNativeModule>("ExpoPoseLandmarkerModule");

export type DetectPoseResult = {
  pose: PoseFrameResult | null;
  inferenceMs: number;
  delegate: "gpu" | "cpu";
};

// Run pose detection against a still-frame file URI (e.g. the URI returned by
// CameraView.takePictureAsync). Resolves to null if MediaPipe didn't detect
// anyone in the frame.
//
// Native side:
// - iOS: loads the image, runs MediaPipe PoseLandmarker with Metal GPU delegate
// - Android: same but with the GPU delegate
//
// Output landmarks are in normalized [0, 1] coordinates relative to the source
// image, named per COCO-17 (see landmarkMapping.ts).
export async function detectPoseFromUri(uri: string): Promise<DetectPoseResult> {
  const raw = await NativeModule.detectPoseFromUri(uri);
  if (!raw) {
    return { pose: null, inferenceMs: 0, delegate: NativeModule.getActiveDelegate() };
  }

  const keypoints = mapMediaPipePoseToCoco17(raw.landmarks);
  if (keypoints.length === 0) {
    return { pose: null, inferenceMs: raw.inferenceMs, delegate: raw.delegate };
  }

  const pose = createPoseFrameResult(keypoints, {
    width: raw.imageWidth,
    height: raw.imageHeight,
    timestampMs: Date.now()
  });

  return { pose, inferenceMs: raw.inferenceMs, delegate: raw.delegate };
}

// Run one dummy inference on a small black image to warm the GPU delegate
// pipeline (~200-400 ms first-run cost). Call once at startup behind the
// existing "Pose detector loading..." splash.
export async function warmUp(): Promise<void> {
  await NativeModule.warmUp();
}

export function getActiveDelegate(): "gpu" | "cpu" {
  return NativeModule.getActiveDelegate();
}

export type { RawPoseDetection, RawPoseLandmark } from "./PoseFrameResult";
export { COCO17_KEYPOINT_NAMES, mapMediaPipePoseToCoco17 } from "./landmarkMapping";
export { PoseLandmarkerView } from "./PoseLandmarkerView";
export type { PoseLandmarkerViewProps, PoseLandmarkerViewRef } from "./PoseLandmarkerView";
