import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

declare const process: {
  env: Record<string, string | undefined>;
};

export type ApiRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  end: (body?: string) => void;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
};

export type AdminContext = {
  supabase: SupabaseClient;
  user: User;
};

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function requireAdmin(req: ApiRequest): Promise<AdminContext> {
  const supabase = createAdminClient();
  const token = getBearerToken(req);

  if (!token) {
    throw new ApiError(401, "Missing authorization token.");
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userResult.user) {
    throw new ApiError(401, "Invalid or expired authorization token.");
  }

  const { data: role, error: roleError } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (roleError) {
    throw new ApiError(500, "Unable to verify admin access.");
  }

  if (role?.role !== "admin") {
    throw new ApiError(403, "Admin access required.");
  }

  return {
    supabase,
    user: userResult.user
  };
}

export function createAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError(500, "Admin API is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function getJsonBody(req: ApiRequest): Record<string, unknown> {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      return isRecord(parsed) ? parsed : {};
    } catch {
      throw new ApiError(400, "Invalid JSON body.");
    }
  }

  return isRecord(req.body) ? req.body : {};
}

export function getQueryString(req: ApiRequest, key: string): string | null {
  const value = req.query[key];

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" && value.trim() ? value : null;
}

export function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new ApiError(400, "Valid email is required.");
  }

  const email = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Valid email is required.");
  }

  return email;
}

export function normalizeOptionalString(value: unknown, maxLength = 160): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, "Invalid text value.");
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function normalizeOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));

  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, "Invalid numeric value.");
  }

  return parsed;
}

export function normalizeLanguage(value: unknown) {
  return value === "es" ? "es" : "en";
}

export function normalizeGender(value: unknown): string | null {
  const allowed = new Set(["female", "male", "non_binary", "prefer_not_to_say"]);

  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !allowed.has(value)) {
    throw new ApiError(400, "Invalid gender value.");
  }

  return value;
}

export function normalizeDate(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, "Invalid date value.");
  }

  return value;
}

export function normalizePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  if (value.length > 128) {
    throw new ApiError(400, "Password is too long.");
  }

  return value;
}

export function sendError(res: ApiResponse, error: unknown) {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : "Admin request failed.";

  setNoStore(res);
  res.status(statusCode).json({ error: message });
}

export function setNoStore(res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
}

function getBearerToken(req: ApiRequest): string | null {
  const header = req.headers.authorization ?? req.headers.Authorization;
  const value = Array.isArray(header) ? header[0] : header;

  if (!value?.startsWith("Bearer ")) {
    return null;
  }

  const token = value.slice("Bearer ".length).trim();
  return token || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
