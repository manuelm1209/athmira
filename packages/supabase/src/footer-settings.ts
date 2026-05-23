import type { FooterSettings, FooterSettingsInput } from "@athmira/types";

import { assertSupabaseConfigured, supabase } from "./client";

const FOOTER_SETTINGS_ID = "primary";

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  id: FOOTER_SETTINGS_ID,
  instagram_url: null,
  strava_url: null,
  x_url: null,
  facebook_url: null,
  linkedin_url: null,
  youtube_url: null,
  tiktok_url: null,
  app_store_url: null,
  google_play_url: null,
  created_at: "",
  updated_at: ""
};

export async function getFooterSettings(): Promise<FooterSettings> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("footer_settings")
    .select("*")
    .eq("id", FOOTER_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? (data as FooterSettings) : DEFAULT_FOOTER_SETTINGS;
}

export async function updateFooterSettings(input: FooterSettingsInput): Promise<FooterSettings> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("footer_settings")
    .upsert(
      {
        ...normalizeFooterSettingsInput(input),
        id: FOOTER_SETTINGS_ID,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as FooterSettings;
}

function normalizeFooterSettingsInput(input: FooterSettingsInput): Required<FooterSettingsInput> {
  return {
    app_store_url: normalizeUrl(input.app_store_url),
    facebook_url: normalizeUrl(input.facebook_url),
    google_play_url: normalizeUrl(input.google_play_url),
    instagram_url: normalizeUrl(input.instagram_url),
    linkedin_url: normalizeUrl(input.linkedin_url),
    strava_url: normalizeUrl(input.strava_url),
    tiktok_url: normalizeUrl(input.tiktok_url),
    x_url: normalizeUrl(input.x_url),
    youtube_url: normalizeUrl(input.youtube_url)
  };
}

function normalizeUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}
