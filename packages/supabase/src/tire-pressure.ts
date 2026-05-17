import type { BikeType, TirePressureRecommendation, TirePressureSetting, TireSetup, TireWidthUnit } from "@athmira/types";

import type { Json } from "./database";
import { assertSupabaseConfigured, supabase } from "./client";

export type TirePressureSettingInput = {
  bikeId?: string | null;
  bikeType: BikeType;
  frontPressurePsi: number;
  notes?: string | null;
  rearPressurePsi: number;
  riderWeightKg: number;
  surfaceRecommendations: TirePressureRecommendation["surfaceRecommendations"];
  tireSetup: TireSetup;
  tireWidth: number;
  tireWidthMm: number;
  tireWidthUnit: TireWidthUnit;
};

export async function listTirePressureSettings(userId: string): Promise<TirePressureSetting[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("tire_pressure_settings")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as TirePressureSetting[];
}

export async function getLatestTirePressureSetting(input: {
  bikeId?: string | null;
  userId: string;
}): Promise<TirePressureSetting | null> {
  assertSupabaseConfigured();

  let query = supabase
    .from("tire_pressure_settings")
    .select("*")
    .eq("user_id", input.userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  query = input.bikeId ? query.eq("bike_id", input.bikeId) : query.is("bike_id", null);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data as TirePressureSetting | null;
}

export async function saveTirePressureSetting(
  userId: string,
  input: TirePressureSettingInput
): Promise<TirePressureSetting> {
  assertSupabaseConfigured();

  const payload = {
    bike_id: input.bikeId ?? null,
    bike_type: input.bikeType,
    front_pressure_psi: input.frontPressurePsi,
    notes: input.notes ?? null,
    rear_pressure_psi: input.rearPressurePsi,
    rider_weight_kg: input.riderWeightKg,
    surface_recommendations: input.surfaceRecommendations as unknown as Json,
    tire_setup: input.tireSetup,
    tire_width_value: input.tireWidth,
    tire_width_mm: input.tireWidthMm,
    tire_width_unit: input.tireWidthUnit,
    user_id: userId
  };

  const { data, error } = await supabase.from("tire_pressure_settings").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return data as TirePressureSetting;
}
