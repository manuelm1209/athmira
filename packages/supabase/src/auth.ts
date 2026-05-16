import type { LanguageCode, UserProfile } from "@athmira/types";

import { assertSupabaseConfigured, getAuthRedirectUrl, supabase } from "./client";

export async function signInWithEmail(email: string, password: string, captchaToken?: string | null) {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
    options: captchaToken ? { captchaToken } : undefined
  });

  if (error) {
    throw error;
  }

  if (data.user?.email) {
    await ensureProfile({
      id: data.user.id,
      email: data.user.email
    });
  }

  return data;
}

export async function signUpWithEmail(input: {
  captchaToken?: string | null;
  email: string;
  password: string;
  name?: string;
  preferredLanguage?: LanguageCode;
}) {
  assertSupabaseConfigured();

  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name?.trim() || null,
        preferred_language: input.preferredLanguage ?? "en"
      },
      emailRedirectTo: getAuthRedirectUrl(),
      captchaToken: input.captchaToken ?? undefined
    }
  });

  if (error) {
    throw error;
  }

  if (data.session && data.user) {
    await ensureProfile({
      id: data.user.id,
      email,
      name: input.name?.trim() || null,
      preferredLanguage: input.preferredLanguage
    });
  }

  return data;
}

export async function signOut() {
  assertSupabaseConfigured();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureProfile(input: {
  id: string;
  email: string;
  name?: string | null;
  preferredLanguage?: LanguageCode;
}): Promise<UserProfile> {
  assertSupabaseConfigured();

  const existing = await getProfile(input.id);

  if (existing) {
    if (existing.email !== input.email) {
      return updateProfile(input.id, { email: input.email });
    }

    return existing;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: input.id,
      email: input.email,
      name: input.name ?? null,
      preferred_language: input.preferredLanguage ?? "en"
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<
    Pick<UserProfile, "email" | "name" | "preferred_language" | "gender" | "height_cm" | "weight_kg" | "date_of_birth">
  >
): Promise<UserProfile> {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
