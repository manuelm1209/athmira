import type {
  AdminAuthUser,
  AdminProfileUpdate,
  AdminUserDetail,
  AdminUserOverview,
  AnalysisSummary,
  Bike,
  FitSession,
  UserProfile
} from "@athmira/types";
import type { User } from "@supabase/supabase-js";

import {
  type ApiRequest,
  type ApiResponse,
  ApiError,
  getJsonBody,
  getQueryString,
  normalizeDate,
  normalizeEmail,
  normalizeGender,
  normalizeLanguage,
  normalizeOptionalNumber,
  normalizeOptionalString,
  normalizePassword,
  parseInteger,
  requireAdmin,
  sendError,
  setNoStore
} from "../_utils/admin";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setNoStore(res);

  try {
    const { supabase, user: adminUser } = await requireAdmin(req);

    if (req.method === "GET") {
      const userId = getQueryString(req, "userId");

      if (userId) {
        res.status(200).json({ user: await getUserDetail(supabase, userId) });
        return;
      }

      const page = parseInteger(getQueryString(req, "page"), 1, 1, 5000);
      const perPage = parseInteger(getQueryString(req, "perPage"), 50, 1, 100);
      res.status(200).json({ users: await listUsers(supabase, page, perPage) });
      return;
    }

    if (req.method === "POST") {
      const body = getJsonBody(req);

      if (body.action === "setTemporaryPassword") {
        await setTemporaryPassword(supabase, adminUser.id, body);
        res.status(200).json({ ok: true });
        return;
      }

      if (body.action === "setAdminRole") {
        const user = await setAdminRole(supabase, adminUser.id, body);
        res.status(200).json({ user });
        return;
      }

      const user = await createUser(supabase, adminUser.id, body);
      res.status(201).json({ user });
      return;
    }

    if (req.method === "PATCH") {
      const body = getJsonBody(req);
      const userId = getQueryString(req, "userId") ?? getBodyString(body, "userId");

      if (!userId) {
        throw new ApiError(400, "User id is required.");
      }

      const user = await updateUserProfile(supabase, adminUser.id, userId, body);
      res.status(200).json({ user });
      return;
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    sendError(res, error);
  }
}

async function listUsers(supabase: SupabaseAdminClient, page: number, perPage: number): Promise<AdminUserOverview[]> {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

  if (error) {
    throw new ApiError(500, "Unable to list users.");
  }

  const users = data.users ?? [];
  const userIds = users.map((user) => user.id);

  if (!userIds.length) {
    return [];
  }

  const [profilesResult, bikesResult, sessionsResult, summariesResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").in("id", userIds),
    supabase.from("bikes").select("id,user_id").in("user_id", userIds),
    supabase.from("fit_sessions").select("id,user_id").in("user_id", userIds),
    supabase.from("analysis_summaries").select("user_id,created_at").in("user_id", userIds),
    supabase.from("admin_roles").select("user_id,role").in("user_id", userIds)
  ]);

  assertNoQueryError(profilesResult.error, "Unable to load profiles.");
  assertNoQueryError(bikesResult.error, "Unable to load bikes.");
  assertNoQueryError(sessionsResult.error, "Unable to load sessions.");
  assertNoQueryError(summariesResult.error, "Unable to load analysis summaries.");
  assertNoQueryError(rolesResult.error, "Unable to load admin roles.");

  return users.map((user) =>
    toOverview(user, {
      analyses: summariesResult.data ?? [],
      bikes: bikesResult.data ?? [],
      isAdmin: Boolean((rolesResult.data ?? []).find((role) => role.user_id === user.id)),
      profile: ((profilesResult.data ?? []) as UserProfile[]).find((profile) => profile.id === user.id) ?? null,
      sessions: sessionsResult.data ?? []
    })
  );
}

async function getUserDetail(supabase: SupabaseAdminClient, userId: string): Promise<AdminUserDetail> {
  const { data: authResult, error: authError } = await supabase.auth.admin.getUserById(userId);

  if (authError || !authResult.user) {
    throw new ApiError(404, "User not found.");
  }

  const [profileResult, bikesResult, sessionsResult, summariesResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("bikes").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
    supabase.from("fit_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("analysis_summaries").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("admin_roles").select("role").eq("user_id", userId).maybeSingle()
  ]);

  assertNoQueryError(profileResult.error, "Unable to load profile.");
  assertNoQueryError(bikesResult.error, "Unable to load bikes.");
  assertNoQueryError(sessionsResult.error, "Unable to load sessions.");
  assertNoQueryError(summariesResult.error, "Unable to load analysis summaries.");
  assertNoQueryError(rolesResult.error, "Unable to load admin role.");

  const sessions = (sessionsResult.data ?? []) as FitSession[];
  const sessionIds = sessions.map((session) => session.id);
  const related = await getSessionRelatedRows(supabase, sessionIds);

  return {
    ...toOverview(authResult.user, {
      analyses: summariesResult.data ?? [],
      bikes: bikesResult.data ?? [],
      isAdmin: rolesResult.data?.role === "admin",
      profile: (profileResult.data as UserProfile | null) ?? null,
      sessions
    }),
    aeroScores: related.aeroScores,
    bikes: (bikesResult.data ?? []) as Bike[],
    fitMeasurements: related.fitMeasurements,
    frontKneeMeasurements: related.frontKneeMeasurements,
    recommendations: related.recommendations,
    sessions,
    summaries: (summariesResult.data ?? []) as AnalysisSummary[]
  };
}

async function createUser(
  supabase: SupabaseAdminClient,
  adminUserId: string,
  body: Record<string, unknown>
): Promise<AdminUserDetail> {
  const email = normalizeEmail(body.email);
  const password = normalizePassword(body.password);
  const name = normalizeOptionalString(body.name);
  const preferredLanguage = normalizeLanguage(body.preferredLanguage ?? body.preferred_language);
  const isAdmin = body.isAdmin === true;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      name,
      preferred_language: preferredLanguage
    }
  });

  if (error || !data.user) {
    throw new ApiError(400, error?.message ?? "Unable to create user.");
  }

  await upsertProfile(supabase, data.user.id, {
    email,
    name,
    preferred_language: preferredLanguage
  });
  await logAdminAction(supabase, adminUserId, data.user.id, "create_user", {
    email,
    is_admin: isAdmin,
    preferred_language: preferredLanguage
  });

  if (isAdmin) {
    await grantAdminRole(supabase, adminUserId, data.user.id);
  }

  return getUserDetail(supabase, data.user.id);
}

async function updateUserProfile(
  supabase: SupabaseAdminClient,
  adminUserId: string,
  userId: string,
  body: Record<string, unknown>
): Promise<AdminUserDetail> {
  const updates = normalizeProfileUpdate(body);

  if (!Object.keys(updates).length) {
    return getUserDetail(supabase, userId);
  }

  if (updates.email) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { email: updates.email });

    if (error) {
      throw new ApiError(400, error.message);
    }
  }

  await upsertProfile(supabase, userId, updates);
  await logAdminAction(supabase, adminUserId, userId, "update_user_profile", {
    fields: Object.keys(updates)
  });
  return getUserDetail(supabase, userId);
}

async function setTemporaryPassword(supabase: SupabaseAdminClient, adminUserId: string, body: Record<string, unknown>) {
  const userId = getBodyString(body, "userId");
  const password = normalizePassword(body.password);

  if (!userId) {
    throw new ApiError(400, "User id is required.");
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, { password });

  if (error) {
    throw new ApiError(400, error.message);
  }

  await logAdminAction(supabase, adminUserId, userId, "set_temporary_password");
}

async function setAdminRole(
  supabase: SupabaseAdminClient,
  adminUserId: string,
  body: Record<string, unknown>
): Promise<AdminUserDetail> {
  const userId = getBodyString(body, "userId");
  const isAdmin = body.isAdmin === true;

  if (!userId) {
    throw new ApiError(400, "User id is required.");
  }

  if (!isAdmin && userId === adminUserId) {
    throw new ApiError(400, "You cannot remove your own admin role.");
  }

  if (isAdmin) {
    await grantAdminRole(supabase, adminUserId, userId);
  } else {
    await revokeAdminRole(supabase, adminUserId, userId);
  }

  return getUserDetail(supabase, userId);
}

async function grantAdminRole(supabase: SupabaseAdminClient, adminUserId: string, targetUserId: string) {
  const { error } = await supabase.from("admin_roles").upsert({
    granted_by: adminUserId,
    role: "admin",
    user_id: targetUserId
  });

  assertNoQueryError(error, "Unable to grant admin role.");
  await logAdminAction(supabase, adminUserId, targetUserId, "grant_admin");
}

async function revokeAdminRole(supabase: SupabaseAdminClient, adminUserId: string, targetUserId: string) {
  const { error } = await supabase.from("admin_roles").delete().eq("user_id", targetUserId);

  assertNoQueryError(error, "Unable to revoke admin role.");
  await logAdminAction(supabase, adminUserId, targetUserId, "revoke_admin");
}

async function logAdminAction(
  supabase: SupabaseAdminClient,
  adminUserId: string,
  targetUserId: string,
  action: "create_user" | "grant_admin" | "revoke_admin" | "set_temporary_password" | "update_user_profile",
  metadata: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("admin_audit_logs").insert({
    action,
    admin_user_id: adminUserId,
    metadata,
    target_user_id: targetUserId
  });

  assertNoQueryError(error, "Unable to write admin audit log.");
}

async function upsertProfile(supabase: SupabaseAdminClient, userId: string, updates: AdminProfileUpdate) {
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id,email")
    .eq("id", userId)
    .maybeSingle();

  assertNoQueryError(existingError, "Unable to load profile.");

  const timestamp = new Date().toISOString();
  const updatePayload = {
    ...updates,
    updated_at: timestamp
  };

  const { error } = existing
    ? await supabase.from("profiles").update(updatePayload).eq("id", userId)
    : await supabase.from("profiles").insert({
        email: updates.email ?? "",
        id: userId,
        name: updates.name ?? null,
        preferred_language: updates.preferred_language ?? "en",
        updated_at: timestamp,
        ...updates
      });

  assertNoQueryError(error, "Unable to save profile.");
}

async function getSessionRelatedRows(supabase: SupabaseAdminClient, sessionIds: string[]) {
  if (!sessionIds.length) {
    return {
      aeroScores: [],
      fitMeasurements: [],
      frontKneeMeasurements: [],
      recommendations: []
    };
  }

  const [fitMeasurementsResult, frontKneeResult, aeroScoresResult, recommendationsResult] = await Promise.all([
    supabase.from("fit_measurements").select("*").in("session_id", sessionIds),
    supabase.from("front_knee_measurements").select("*").in("session_id", sessionIds),
    supabase.from("aero_scores").select("*").in("session_id", sessionIds),
    supabase.from("recommendations").select("*").in("session_id", sessionIds)
  ]);

  assertNoQueryError(fitMeasurementsResult.error, "Unable to load fit measurements.");
  assertNoQueryError(frontKneeResult.error, "Unable to load front knee measurements.");
  assertNoQueryError(aeroScoresResult.error, "Unable to load aero scores.");
  assertNoQueryError(recommendationsResult.error, "Unable to load recommendations.");

  return {
    aeroScores: aeroScoresResult.data ?? [],
    fitMeasurements: fitMeasurementsResult.data ?? [],
    frontKneeMeasurements: frontKneeResult.data ?? [],
    recommendations: recommendationsResult.data ?? []
  };
}

function normalizeProfileUpdate(body: Record<string, unknown>): AdminProfileUpdate {
  const updates: AdminProfileUpdate = {};

  if ("email" in body) {
    updates.email = normalizeEmail(body.email);
  }

  if ("name" in body) {
    updates.name = normalizeOptionalString(body.name);
  }

  if ("preferred_language" in body || "preferredLanguage" in body) {
    updates.preferred_language = normalizeLanguage(body.preferred_language ?? body.preferredLanguage);
  }

  if ("gender" in body) {
    updates.gender = normalizeGender(body.gender);
  }

  if ("height_cm" in body) {
    updates.height_cm = normalizeOptionalNumber(body.height_cm);
  }

  if ("weight_kg" in body) {
    updates.weight_kg = normalizeOptionalNumber(body.weight_kg);
  }

  if ("date_of_birth" in body) {
    updates.date_of_birth = normalizeDate(body.date_of_birth);
  }

  return updates;
}

function toOverview(
  user: User,
  data: {
    analyses: Pick<AnalysisSummary, "created_at" | "user_id">[];
    bikes: { user_id: string }[];
    isAdmin: boolean;
    profile: UserProfile | null;
    sessions: { user_id: string }[];
  }
): AdminUserOverview {
  const userAnalyses = data.analyses.filter((analysis) => analysis.user_id === user.id);

  return {
    analysesCount: data.sessions.filter((session) => session.user_id === user.id).length,
    authUser: toAuthUser(user),
    bikesCount: data.bikes.filter((bike) => bike.user_id === user.id).length,
    isAdmin: data.isAdmin,
    latestAnalysisAt: getLatestAnalysisAt(userAnalyses),
    profile: data.profile
  };
}

function toAuthUser(user: User): AdminAuthUser {
  return {
    created_at: user.created_at,
    email: user.email ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    id: user.id,
    last_sign_in_at: user.last_sign_in_at ?? null
  };
}

function getLatestAnalysisAt(analyses: Pick<AnalysisSummary, "created_at">[]): string | null {
  const [latest] = [...analyses].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return latest?.created_at ?? null;
}

function getBodyString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function assertNoQueryError(error: unknown, message: string) {
  if (error) {
    throw new ApiError(500, message);
  }
}

type SupabaseAdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
