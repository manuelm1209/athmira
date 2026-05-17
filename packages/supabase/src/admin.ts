import type { AdminProfileUpdate, AdminUserDetail, AdminUserOverview, LanguageCode } from "@athmira/types";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { supabase } from "./client";

declare const process: {
  env: Record<string, string | undefined>;
};

type AppExtra = {
  siteUrl?: string;
};

type AdminSession = {
  email: string | null;
  isAdmin: boolean;
  userId: string;
};

export async function getAdminSession(): Promise<AdminSession> {
  return adminRequest<AdminSession>("/api/admin/me");
}

export async function listAdminUsers(): Promise<AdminUserOverview[]> {
  const response = await adminRequest<{ users: AdminUserOverview[] }>("/api/admin/users");
  return response.users;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const response = await adminRequest<{ user: AdminUserDetail }>(`/api/admin/users?userId=${encodeURIComponent(userId)}`);
  return response.user;
}

export async function createAdminManagedUser(input: {
  email: string;
  isAdmin?: boolean;
  name?: string | null;
  password: string;
  preferredLanguage: LanguageCode;
}): Promise<AdminUserDetail> {
  const response = await adminRequest<{ user: AdminUserDetail }>("/api/admin/users", {
    body: JSON.stringify(input),
    method: "POST"
  });
  return response.user;
}

export async function setAdminManagedUserRole(userId: string, isAdmin: boolean): Promise<AdminUserDetail> {
  const response = await adminRequest<{ user: AdminUserDetail }>("/api/admin/users", {
    body: JSON.stringify({
      action: "setAdminRole",
      isAdmin,
      userId
    }),
    method: "POST"
  });
  return response.user;
}

export async function updateAdminManagedUserProfile(userId: string, updates: AdminProfileUpdate): Promise<AdminUserDetail> {
  const response = await adminRequest<{ user: AdminUserDetail }>(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
    body: JSON.stringify(updates),
    method: "PATCH"
  });
  return response.user;
}

export async function setAdminManagedUserTemporaryPassword(userId: string, password: string): Promise<void> {
  await adminRequest<{ ok: true }>("/api/admin/users", {
    body: JSON.stringify({
      action: "setTemporaryPassword",
      password,
      userId
    }),
    method: "POST"
  });
}

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.access_token) {
    throw new Error("You must be signed in as an admin.");
  }

  const response = await fetch(`${getAdminApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...init.headers
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Admin request failed.";
    throw new Error(message);
  }

  return payload as T;
}

function getAdminApiBaseUrl() {
  if (Platform.OS === "web") {
    return "";
  }

  const extra = Constants.expoConfig?.extra as AppExtra | undefined;
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? extra?.siteUrl ?? "";

  return siteUrl.trim().replace(/\/+$/, "");
}
