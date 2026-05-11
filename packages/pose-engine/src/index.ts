import type { JointAngles, PoseFrame, PoseFrameResult, PoseKeypoint } from "@athmira/types";

const mockKeypoints: PoseKeypoint[] = [
  { name: "shoulder", x: 0.42, y: 0.28, confidence: 0.82 },
  { name: "elbow", x: 0.56, y: 0.42, confidence: 0.78 },
  { name: "hip", x: 0.38, y: 0.52, confidence: 0.84 },
  { name: "knee", x: 0.5, y: 0.7, confidence: 0.8 },
  { name: "ankle", x: 0.58, y: 0.86, confidence: 0.76 }
];

export function analyzePoseFrame(_frame?: PoseFrame): PoseFrameResult {
  const angles = calculateJointAngles(mockKeypoints);

  return {
    keypoints: mockKeypoints,
    angles,
    confidenceScore: 0.78
  };
}

export function calculateJointAngles(_pose: PoseKeypoint[]): JointAngles {
  return {
    kneeAngle: 145,
    hipAngle: 51,
    torsoAngle: 38,
    elbowAngle: 97,
    shoulderAngle: 82
  };
}
