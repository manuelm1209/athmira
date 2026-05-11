import type {
  CameraAngle,
  DeviceType,
  FitSession,
  FitSessionStatus,
  FitSessionType,
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
