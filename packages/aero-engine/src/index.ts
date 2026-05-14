import type { CalculatedAeroScore, JointAngles, PoseFrameResult } from "@athmira/types";

export function calculateAeroScore(
  pose?: PoseFrameResult | null,
  measurements?: JointAngles | null
): CalculatedAeroScore {
  const torsoAngle = measurements?.torsoAngle ?? 38;
  const elbowAngle = measurements?.elbowAngle ?? 97;
  const bodyBox = estimateBodyBoxRatio(pose);
  const torsoPositionScore = Math.round(clamp(100 - Math.abs(torsoAngle - 32) * 1.6, 48, 94));
  const armCompactnessScore = Math.round(clamp(100 - Math.abs(elbowAngle - 92) * 0.9, 52, 92));
  const headPositionScore = Math.round(clamp(calculateHeadScore(pose, torsoAngle), 50, 90));
  const stabilityScore = Math.round(clamp((pose?.confidenceScore ?? 0.76) * 100, 45, 92));
  const finalAeroScore = Math.round(
    torsoPositionScore * 0.35 +
      headPositionScore * 0.25 +
      armCompactnessScore * 0.25 +
      stabilityScore * 0.15
  );

  return {
    estimatedFrontalArea: round(clamp(0.28 + bodyBox * 0.9 + torsoAngle * 0.002, 0.3, 0.62), 2),
    torsoPositionScore,
    headPositionScore,
    armCompactnessScore,
    stabilityScore,
    finalAeroScore
  };
}

function estimateBodyBoxRatio(pose?: PoseFrameResult | null): number {
  const frame = pose?.frame;
  const keypoints = pose?.keypoints.filter((keypoint) => keypoint.confidence >= 0.25) ?? [];

  if (!frame || !keypoints.length) {
    return 0.12;
  }

  const xs = keypoints.map((keypoint) => keypoint.x);
  const ys = keypoints.map((keypoint) => keypoint.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const frameArea = frame.width * frame.height;

  if (!frameArea) {
    return 0.12;
  }

  return clamp((width * height) / frameArea, 0.06, 0.24);
}

function calculateHeadScore(pose: PoseFrameResult | null | undefined, torsoAngle: number): number {
  const nose = pose?.keypoints.find((keypoint) => keypoint.name === "nose" && keypoint.confidence >= 0.25);
  const shoulder = pose?.keypoints.find((keypoint) => keypoint.name.endsWith("_shoulder") && keypoint.confidence >= 0.25);

  if (!nose || !shoulder) {
    return 76 - Math.max(0, torsoAngle - 42) * 0.4;
  }

  const headDrop = shoulder.y - nose.y;
  return 78 + clamp(headDrop / 12, -12, 10) - Math.max(0, torsoAngle - 45) * 0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision: number): number {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}
