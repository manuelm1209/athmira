import type { Bike, BikeInput } from "@athmira/types";

import { assertSupabaseConfigured, supabase } from "./client";

export async function listBikes(userId: string): Promise<Bike[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getLatestBike(userId: string): Promise<Bike | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getBike(userId: string, bikeId: string): Promise<Bike | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("bikes")
    .select("*")
    .eq("user_id", userId)
    .eq("id", bikeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createBike(userId: string, input: BikeInput): Promise<Bike> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("bikes")
    .insert({
      user_id: userId,
      name: input.name,
      bike_type: input.bike_type,
      brand: input.brand ?? null,
      model: input.model ?? null,
      size: input.size ?? null,
      saddle_height_mm: input.saddle_height_mm ?? null,
      saddle_setback_mm: input.saddle_setback_mm ?? null,
      stem_length_mm: input.stem_length_mm ?? null,
      crank_length_mm: input.crank_length_mm ?? null,
      handlebar_width_mm: input.handlebar_width_mm ?? null
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateBike(userId: string, bikeId: string, input: Partial<BikeInput>): Promise<Bike> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("bikes")
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq("id", bikeId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteBike(userId: string, bikeId: string): Promise<void> {
  assertSupabaseConfigured();

  const { error } = await supabase.from("bikes").delete().eq("id", bikeId).eq("user_id", userId);

  if (error) {
    throw error;
  }
}
