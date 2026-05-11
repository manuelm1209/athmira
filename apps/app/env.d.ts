/// <reference types="expo/types" />

declare namespace NodeJS {
  type ProcessEnv = {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
}
