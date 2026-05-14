import type { JointAngles, PoseFrame, PoseFrameResult, PoseKeypoint } from "@athmira/types";

const mockKeypoints: PoseKeypoint[] = [
  { name: "left_shoulder", x: 520, y: 205, confidence: 0.86 },
  { name: "left_elbow", x: 650, y: 315, confidence: 0.82 },
  { name: "left_wrist", x: 790, y: 405, confidence: 0.8 },
  { name: "left_hip", x: 425, y: 385, confidence: 0.88 },
  { name: "left_knee", x: 545, y: 520, confidence: 0.86 },
  { name: "left_ankle", x: 610, y: 665, confidence: 0.82 },
  { name: "nose", x: 690, y: 175, confidence: 0.74 }
];

const sideNames = ["left", "right"] as const;
type PoseSide = (typeof sideNames)[number];
type JointName = "shoulder" | "elbow" | "wrist" | "hip" | "knee" | "ankle";

export function analyzePoseFrame(frame?: PoseFrame): PoseFrameResult {
  const scaleX = frame?.width ? frame.width / 960 : 1;
  const scaleY = frame?.height ? frame.height / 720 : 1;
  const keypoints = mockKeypoints.map((keypoint) => ({
    ...keypoint,
    x: Math.round(keypoint.x * scaleX),
    y: Math.round(keypoint.y * scaleY)
  }));

  return createPoseFrameResult(keypoints, frame);
}

export function createPoseFrameResult(keypoints: PoseKeypoint[], frame?: PoseFrame): PoseFrameResult {
  return {
    keypoints,
    angles: calculateJointAngles(keypoints),
    confidenceScore: calculatePoseConfidence(keypoints),
    frame
  };
}

export function calculateJointAngles(pose: PoseKeypoint[]): JointAngles {
  const side = selectCyclingSide(pose);
  const shoulder = getJoint(pose, "shoulder", side);
  const elbow = getJoint(pose, "elbow", side);
  const wrist = getJoint(pose, "wrist", side);
  const hip = getJoint(pose, "hip", side);
  const knee = getJoint(pose, "knee", side);
  const ankle = getJoint(pose, "ankle", side);

  return {
    kneeAngle: angleAt(hip, knee, ankle),
    hipAngle: angleAt(shoulder, hip, knee),
    torsoAngle: lineAngleFromHorizontal(hip, shoulder),
    elbowAngle: angleAt(shoulder, elbow, wrist),
    shoulderAngle: angleAt(hip, shoulder, elbow)
  };
}

export function calculatePoseConfidence(keypoints: PoseKeypoint[]): number {
  const side = selectCyclingSide(keypoints);
  const coreKeypoints = [
    getJoint(keypoints, "shoulder", side),
    getJoint(keypoints, "elbow", side),
    getJoint(keypoints, "wrist", side),
    getJoint(keypoints, "hip", side),
    getJoint(keypoints, "knee", side),
    getJoint(keypoints, "ankle", side)
  ].filter(Boolean) as PoseKeypoint[];

  if (!coreKeypoints.length) {
    return 0;
  }

  const average = coreKeypoints.reduce((total, keypoint) => total + keypoint.confidence, 0) / coreKeypoints.length;
  return round(average, 2);
}

export function selectCyclingSide(keypoints: PoseKeypoint[]): PoseSide {
  const [leftScore = 0, rightScore = 0] = sideNames.map((side) => {
    const joints: JointName[] = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle"];
    return joints.reduce((total, joint) => total + (getJoint(keypoints, joint, side)?.confidence ?? 0), 0);
  });

  return leftScore >= rightScore ? "left" : "right";
}

function getJoint(keypoints: PoseKeypoint[], joint: JointName, side: PoseSide): PoseKeypoint | undefined {
  return getKeypoint(keypoints, `${side}_${joint}`) ?? getKeypoint(keypoints, joint);
}

function getKeypoint(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  return keypoints.find((keypoint) => keypoint.name === name && keypoint.confidence >= 0.25);
}

function angleAt(a?: PoseKeypoint, b?: PoseKeypoint, c?: PoseKeypoint): number | undefined {
  if (!a || !b || !c) {
    return undefined;
  }

  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const denominator = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);

  if (!denominator) {
    return undefined;
  }

  const cosine = clamp((ab.x * cb.x + ab.y * cb.y) / denominator, -1, 1);
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

function lineAngleFromHorizontal(a?: PoseKeypoint, b?: PoseKeypoint): number | undefined {
  if (!a || !b) {
    return undefined;
  }

  const raw = Math.abs((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
  const acute = raw > 90 ? 180 - raw : raw;
  return Math.round(acute);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision: number): number {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}
