/// <reference types="expo/types" />

declare namespace NodeJS {
  type ProcessEnv = {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_SITE_URL?: string;
    EXPO_PUBLIC_AUTH_REDIRECT_URL?: string;
    EXPO_PUBLIC_TURNSTILE_SITE_KEY?: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string;
  };
}
