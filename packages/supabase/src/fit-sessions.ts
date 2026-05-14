import type {
  AeroScore,
  CalculatedAeroScore,
  CameraAngle,
  DeviceType,
  FitMeasurement,
  FitRecommendation,
  FitSession,
  FitSessionStatus,
  FitSessionType,
  JointAngles,
  MediaAsset,
  MediaAssetType
} from "@athmira/types";

import { assertSupabaseConfigured, supabase } from "./client";

export async function createFitSession(input: {
  userId: string;
  bikeId?: string | null;
  sessionType?: FitSessionType;
  deviceType: DeviceType;
  cameraAngle?: CameraAngle;
  status?: FitSessionStatus;
}): Promise<FitSession> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("fit_sessions")
    .insert({
      user_id: input.userId,
      bike_id: input.bikeId ?? null,
      session_type: input.sessionType ?? "bike_fit",
      device_type: input.deviceType,
      camera_angle: input.cameraAngle ?? "side",
      status: input.status ?? "completed"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createFitMeasurement(input: {
  sessionId: string;
  angles: JointAngles;
  confidenceScore: number;
  kneeAngleMin?: number | null;
  kneeAngleMax?: number | null;
}): Promise<FitMeasurement> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("fit_measurements")
    .insert({
      session_id: input.sessionId,
      knee_angle_min: input.kneeAngleMin ?? input.angles.kneeAngle ?? null,
      knee_angle_max: input.kneeAngleMax ?? input.angles.kneeAngle ?? null,
      hip_angle_avg: input.angles.hipAngle ?? null,
      torso_angle_avg: input.angles.torsoAngle ?? null,
      elbow_angle_avg: input.angles.elbowAngle ?? null,
      shoulder_angle_avg: input.angles.shoulderAngle ?? null,
      confidence_score: input.confidenceScore
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createAeroScore(input: {
  sessionId: string;
  aeroScore: CalculatedAeroScore;
}): Promise<AeroScore> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("aero_scores")
    .insert({
      session_id: input.sessionId,
      estimated_frontal_area: input.aeroScore.estimatedFrontalArea,
      torso_position_score: input.aeroScore.torsoPositionScore,
      head_position_score: input.aeroScore.headPositionScore,
      arm_compactness_score: input.aeroScore.armCompactnessScore,
      stability_score: input.aeroScore.stabilityScore,
      final_aero_score: input.aeroScore.finalAeroScore
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createRecommendations(input: {
  sessionId: string;
  recommendations: FitRecommendation[];
}) {
  assertSupabaseConfigured();

  if (!input.recommendations.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("recommendations")
    .insert(
      input.recommendations.map((recommendation) => ({
        session_id: input.sessionId,
        priority: recommendation.priority,
        category: recommendation.category,
        message: recommendation.message,
        adjustment_mm: recommendation.adjustmentMm ?? null,
        confidence_score: recommendation.confidenceScore
      }))
    )
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}

export async function getFitAnalysisResults(sessionId: string) {
  assertSupabaseConfigured();

  const [measurementResult, aeroResult, recommendationsResult] = await Promise.all([
    supabase.from("fit_measurements").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
    supabase.from("aero_scores").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
    supabase.from("recommendations").select("*").eq("session_id", sessionId).order("created_at", { ascending: true })
  ]);

  if (measurementResult.error) {
    throw measurementResult.error;
  }

  if (aeroResult.error) {
    throw aeroResult.error;
  }

  if (recommendationsResult.error) {
    throw recommendationsResult.error;
  }

  return {
    measurement: measurementResult.data[0] ?? null,
    aeroScore: aeroResult.data[0] ?? null,
    recommendations: recommendationsResult.data
  };
}

export async function createMediaAsset(input: {
  sessionId: string;
  userId: string;
  type: MediaAssetType;
  storagePath: string;
}): Promise<MediaAsset> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      session_id: input.sessionId,
      user_id: input.userId,
      type: input.type,
      storage_path: input.storagePath
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createSignedMediaUrl(storagePath: string, expiresInSeconds = 300): Promise<string> {
  assertSupabaseConfigured();

  const { data, error } = await supabase.storage.from("fit-media").createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
