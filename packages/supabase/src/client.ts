import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

import type { Database } from "./database";

declare const process: {
  env?: Record<string, string | undefined>;
  versions?: {
    node?: string;
  };
};

type AppExtra = {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

const extra = Constants.expoConfig?.extra as AppExtra | undefined;

const supabaseUrl =
  process.env?.EXPO_PUBLIC_SUPABASE_URL ??
  process.env?.NEXT_PUBLIC_SUPABASE_URL ??
  extra?.supabaseUrl ??
  "";

const supabaseAnonKey =
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  extra?.supabaseAnonKey ??
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

class StaticRenderWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor() {
    throw new Error("Supabase Realtime is unavailable during static rendering.");
  }
}

export const supabase = createClient<Database>(
  isSupabaseConfigured ? supabaseUrl : "https://example.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "public-anon-key",
  {
    auth: {
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
      persistSession: true
    },
    ...getRealtimeOptions()
  }
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

function getRealtimeOptions() {
  const transport = getRealtimeTransport();

  if (!transport) {
    return {};
  }

  return {
    realtime: {
      transport
    }
  };
}

function getRealtimeTransport(): typeof WebSocket | undefined {
  if (typeof WebSocket !== "undefined") {
    return WebSocket;
  }

  if (!process.versions?.node) {
    return undefined;
  }

  return StaticRenderWebSocket as unknown as typeof WebSocket;
}
