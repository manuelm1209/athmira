import { calculateAeroScore } from "@athmira/aero-engine";
import { calculateFitScore, generateFitRecommendations } from "@athmira/fit-engine";
import type {
  CalculatedAeroScore,
  FitRecommendation,
  FitScore,
  JointAngles,
  LanguageCode,
  PoseFrameResult,
  UserProfile
} from "@athmira/types";

export type BikeFitAnalysisSummary = {
  aeroScore: CalculatedAeroScore;
  angles: JointAngles;
  confidenceScore: number;
  durationMs: number;
  fitScore: FitScore;
  kneeAngleMax: number | null;
  kneeAngleMin: number | null;
  pose: PoseFrameResult;
  recommendations: FitRecommendation[];
  sampleCount: number;
};

const angleKeys = ["kneeAngle", "hipAngle", "torsoAngle", "elbowAngle", "shoulderAngle"] as const;
type AngleKey = (typeof angleKeys)[number];

export function createBikeFitAnalysisSummary(input: {
  durationMs: number;
  language: LanguageCode;
  profile?: UserProfile | null;
  samples: PoseFrameResult[];
}): BikeFitAnalysisSummary {
  const usableSamples = input.samples.filter((sample) => sample.confidenceScore >= 0.35);
  const samples = usableSamples.length ? usableSamples : input.samples;
  const pose = findBestPose(samples);
  const angles = averageAngles(samples);
  const kneeAngles = collectAngles(samples, "kneeAngle");
  const kneeAngleMin = minOrNull(kneeAngles);
  const kneeAngleMax = maxOrNull(kneeAngles);
  const confidenceScore = round(
    samples.reduce((total, sample) => total + sample.confidenceScore, 0) / Math.max(samples.length, 1),
    2
  );
  const fitScore = calculateFitScore({
    knee_angle_min: kneeAngleMin,
    knee_angle_max: kneeAngleMax,
    hip_angle_avg: angles.hipAngle ?? null,
    torso_angle_avg: angles.torsoAngle ?? null,
    elbow_angle_avg: angles.elbowAngle ?? null,
    shoulder_angle_avg: angles.shoulderAngle ?? null,
    confidence_score: confidenceScore
  });
  const aeroScore = calculateAeroScore(pose, angles);
  const recommendations = generateFitRecommendations(
    { ...angles, kneeAngle: kneeAngleMax ?? angles.kneeAngle },
    null,
    input.profile,
    input.language
  );

  return {
    aeroScore,
    angles,
    confidenceScore,
    durationMs: input.durationMs,
    fitScore,
    kneeAngleMax,
    kneeAngleMin,
    pose,
    recommendations,
    sampleCount: samples.length
  };
}

function findBestPose(samples: PoseFrameResult[]): PoseFrameResult {
  const [best] = [...samples].sort((a, b) => b.confidenceScore - a.confidenceScore);

  if (!best) {
    throw new Error("No pose samples were captured. Keep the full rider visible and try again.");
  }

  return best;
}

function averageAngles(samples: PoseFrameResult[]): JointAngles {
  return angleKeys.reduce<JointAngles>((result, key) => {
    const values = collectAngles(samples, key);

    if (values.length) {
      result[key] = Math.round(values.reduce((total, value) => total + value, 0) / values.length);
    }

    return result;
  }, {});
}

function collectAngles(samples: PoseFrameResult[], key: AngleKey): number[] {
  return samples
    .map((sample) => sample.angles[key])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function minOrNull(values: number[]): number | null {
  return values.length ? Math.min(...values) : null;
}

function maxOrNull(values: number[]): number | null {
  return values.length ? Math.max(...values) : null;
}

function round(value: number, precision: number): number {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}
