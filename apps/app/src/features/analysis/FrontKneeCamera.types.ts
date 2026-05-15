import type { PoseFrameResult } from "@athmira/types";

export type FrontKneeCameraLabels = {
  analyzing: string;
  cameraAnalysisUnavailable: string;
  cameraDenied: string;
  cameraEnable: string;
  cameraPermissionLoading: string;
  cameraPermissionRequesting: string;
  cameraUnsupported: string;
  frontKneeComplete: string;
  frontKneeGetReady: string;
  frontKneeNativeNotice: string;
  frontKneeRecording: string;
  insufficientPoseSamples: string;
  poseDetectionActive: string;
  poseDetectionFailed: string;
  poseDetectorLoading: string;
  poseNotReady: string;
};

export type FrontKneeCameraHandle = {
  captureSnapshot: () => Promise<string | null>;
  startTracking: (options?: { countdownMs?: number; durationMs?: number }) => Promise<PoseFrameResult[]>;
};

export type FrontKneeCameraProps = {
  labels: FrontKneeCameraLabels;
  onLiveResult?: (result: PoseFrameResult | null) => void;
  onReadyChange?: (isReady: boolean) => void;
};
