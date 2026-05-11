import type { CalculatedAeroScore, JointAngles, PoseFrameResult } from "@athmira/types";

export function calculateAeroScore(
  _pose?: PoseFrameResult | null,
  measurements?: JointAngles | null
): CalculatedAeroScore {
  const torsoAngle = measurements?.torsoAngle ?? 38;
  const elbowAngle = measurements?.elbowAngle ?? 97;
  const torsoPositionScore = Math.round(Math.max(50, Math.min(92, 100 - torsoAngle)));
  const armCompactnessScore = Math.round(Math.max(55, Math.min(90, 100 - Math.abs(elbowAngle - 92))));
  const headPositionScore = 74;
  const stabilityScore = 76;
  const finalAeroScore = Math.round(
    torsoPositionScore * 0.35 +
      headPositionScore * 0.25 +
      armCompactnessScore * 0.25 +
      stabilityScore * 0.15
  );

  return {
    estimatedFrontalArea: 0.43,
    torsoPositionScore,
    headPositionScore,
    armCompactnessScore,
    stabilityScore,
    finalAeroScore
  };
}
