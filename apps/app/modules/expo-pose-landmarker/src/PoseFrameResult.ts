export type { PoseFrameResult, PoseKeypoint } from "@athmira/types";

export type RawPoseLandmark = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type RawPoseDetection = {
  landmarks: RawPoseLandmark[];
  imageWidth: number;
  imageHeight: number;
  inferenceMs: number;
  delegate: "gpu" | "cpu";
};
