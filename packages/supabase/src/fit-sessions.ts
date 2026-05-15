import type {
  AeroScore,
  AnalysisHistoryItem,
  AnalysisSummary,
  AnalysisType,
  CalculatedAeroScore,
  CameraAngle,
  DeviceType,
  FitMeasurement,
  FitRecommendation,
  FitSession,
  FitSessionStatus,
  FitSessionType,
  FrontKneeMeasurement,
  FrontKneeTrackingResult,
  JointAngles,
  MediaAsset,
  MediaAssetType
} from "@athmira/types";

import type { Json } from "./database";
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

export async function createAnalysisSummary(input: {
  aeroScore?: number | null;
  analysisType: AnalysisType;
  comfortScore?: number | null;
  confidenceScore?: number | null;
  durationMs?: number | null;
  metrics?: Json;
  overallScore?: number | null;
  sampleCount?: number | null;
  sessionId: string;
  title: string;
  userId: string;
}): Promise<AnalysisSummary> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("analysis_summaries")
    .upsert(
      {
        session_id: input.sessionId,
        user_id: input.userId,
        analysis_type: input.analysisType,
        title: input.title,
        overall_score: input.overallScore ?? null,
        comfort_score: input.comfortScore ?? null,
        aero_score: input.aeroScore ?? null,
        confidence_score: input.confidenceScore ?? null,
        duration_ms: input.durationMs ?? null,
        sample_count: input.sampleCount ?? null,
        metrics: input.metrics ?? {}
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AnalysisSummary;
}

export async function createFrontKneeMeasurement(input: {
  result: FrontKneeTrackingResult;
  sessionId: string;
  userId: string;
}): Promise<FrontKneeMeasurement> {
  assertSupabaseConfigured();

  const { result } = input;
  const { data, error } = await supabase
    .from("front_knee_measurements")
    .upsert(
      {
        session_id: input.sessionId,
        user_id: input.userId,
        duration_ms: result.durationMs,
        sample_count: result.sampleCount,
        estimated_mm_per_pixel: result.estimatedMmPerPixel,
        overall_score: result.overallScore,
        confidence_score: result.confidenceScore,
        left_horizontal_travel_mm: result.left.horizontalTravelMm,
        left_horizontal_travel_px: result.left.horizontalTravelPx,
        left_vertical_travel_mm: result.left.verticalTravelMm,
        left_vertical_travel_px: result.left.verticalTravelPx,
        left_knee_drift_mm: result.left.kneeDriftMm,
        left_knee_drift_px: result.left.kneeDriftPx,
        left_stability_score: result.left.stabilityScore,
        left_confidence_score: result.left.confidenceScore,
        left_sample_count: result.left.sampleCount,
        right_horizontal_travel_mm: result.right.horizontalTravelMm,
        right_horizontal_travel_px: result.right.horizontalTravelPx,
        right_vertical_travel_mm: result.right.verticalTravelMm,
        right_vertical_travel_px: result.right.verticalTravelPx,
        right_knee_drift_mm: result.right.kneeDriftMm,
        right_knee_drift_px: result.right.kneeDriftPx,
        right_stability_score: result.right.stabilityScore,
        right_confidence_score: result.right.confidenceScore,
        right_sample_count: result.right.sampleCount
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getFitAnalysisResults(sessionId: string) {
  assertSupabaseConfigured();

  const [sessionResult, summaryResult, measurementResult, frontKneeResult, aeroResult, recommendationsResult] = await Promise.all([
    supabase.from("fit_sessions").select("*").eq("id", sessionId).maybeSingle(),
    supabase.from("analysis_summaries").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("fit_measurements").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
    supabase.from("front_knee_measurements").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("aero_scores").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(1),
    supabase.from("recommendations").select("*").eq("session_id", sessionId).order("created_at", { ascending: true })
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (summaryResult.error) {
    throw summaryResult.error;
  }

  if (measurementResult.error) {
    throw measurementResult.error;
  }

  if (frontKneeResult.error) {
    throw frontKneeResult.error;
  }

  if (aeroResult.error) {
    throw aeroResult.error;
  }

  if (recommendationsResult.error) {
    throw recommendationsResult.error;
  }

  return {
    frontKneeMeasurement: frontKneeResult.data,
    measurement: measurementResult.data[0] ?? null,
    aeroScore: aeroResult.data[0] ?? null,
    recommendations: recommendationsResult.data,
    session: sessionResult.data,
    summary: summaryResult.data as AnalysisSummary | null
  };
}

export async function listAnalysisHistory(input: {
  bikeId?: string | null;
  limit?: number;
  userId: string;
}): Promise<AnalysisHistoryItem[]> {
  assertSupabaseConfigured();

  let query = supabase
    .from("fit_sessions")
    .select("*")
    .eq("user_id", input.userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 12);

  if (input.bikeId) {
    query = query.eq("bike_id", input.bikeId);
  }

  const { data: sessions, error } = await query;

  if (error) {
    throw error;
  }

  if (!sessions.length) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);
  const [summariesResult, fitMeasurementsResult, frontKneeMeasurementsResult, aeroScoresResult, recommendationsResult] = await Promise.all([
    supabase.from("analysis_summaries").select("*").in("session_id", sessionIds),
    supabase.from("fit_measurements").select("*").in("session_id", sessionIds),
    supabase.from("front_knee_measurements").select("*").in("session_id", sessionIds),
    supabase.from("aero_scores").select("*").in("session_id", sessionIds),
    supabase.from("recommendations").select("*").in("session_id", sessionIds)
  ]);

  if (summariesResult.error) {
    throw summariesResult.error;
  }

  if (fitMeasurementsResult.error) {
    throw fitMeasurementsResult.error;
  }

  if (frontKneeMeasurementsResult.error) {
    throw frontKneeMeasurementsResult.error;
  }

  if (aeroScoresResult.error) {
    throw aeroScoresResult.error;
  }

  if (recommendationsResult.error) {
    throw recommendationsResult.error;
  }

  return sessions.map((session) => ({
    aeroScore: findLatestBySessionId(aeroScoresResult.data, session.id),
    fitMeasurement: findLatestBySessionId(fitMeasurementsResult.data, session.id),
    frontKneeMeasurement: findLatestBySessionId(frontKneeMeasurementsResult.data, session.id),
    recommendations: recommendationsResult.data.filter((recommendation) => recommendation.session_id === session.id),
    session,
    summary: findLatestBySessionId(summariesResult.data, session.id) as AnalysisSummary | null
  }));
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

function findLatestBySessionId<T extends { created_at: string; session_id: string }>(
  rows: T[],
  sessionId: string
): T | null {
  const [latest] = rows
    .filter((row) => row.session_id === sessionId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return latest ?? null;
}
