import type { PoseFrameResult } from "@athmira/types";

export type BikeFitCameraLabels = {
  analyzing: string;
  cameraAnalysisUnavailable: string;
  cameraDenied: string;
  cameraEnable: string;
  cameraPermissionLoading: string;
  cameraPermissionRequesting: string;
  cameraUnsupported: string;
  insufficientPoseSamples: string;
  nativePoseNotice: string;
  poseDetectionActive: string;
  poseDetectionFailed: string;
  poseDetectorLoading: string;
  poseNotReady: string;
  riderPositionTitle: string;
  riderPositionGuide: string;
  riderPositionDetected: string;
};

export type BikeFitCameraHandle = {
  captureSnapshot: () => Promise<string | null>;
  startAnalysis: (durationMs?: number) => Promise<PoseFrameResult[]>;
};

export type BikeFitCameraProps = {
  labels: BikeFitCameraLabels;
  onLiveResult?: (result: PoseFrameResult | null) => void;
  onReadyChange?: (isReady: boolean) => void;
};
