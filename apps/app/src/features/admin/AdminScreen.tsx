import {
  createAdminManagedUser,
  getAdminUserDetail,
  listAdminUsers,
  setAdminManagedUserTemporaryPassword,
  updateAdminManagedUserProfile
} from "@athmira/supabase";
import type { AdminUserDetail, AdminUserOverview, LanguageCode } from "@athmira/types";
import { Body, Button, Card, DateField, Field, Heading, Inline, Screen, SelectField, colors, spacing } from "@athmira/ui";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage, numberToInput, parseOptionalNumber } from "@/utils/form";

type ProfileDraft = {
  dateOfBirth: string;
  email: string;
  gender: string;
  heightCm: string;
  name: string;
  preferredLanguage: LanguageCode;
  weightKg: string;
};

type CreateUserDraft = {
  email: string;
  name: string;
  password: string;
  preferredLanguage: LanguageCode;
};

const emptyProfileDraft: ProfileDraft = {
  dateOfBirth: "",
  email: "",
  gender: "",
  heightCm: "",
  name: "",
  preferredLanguage: "en",
  weightKg: ""
};

export function AdminScreen() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [createDraft, setCreateDraft] = useState<CreateUserDraft>({
    email: "",
    name: "",
    password: "",
    preferredLanguage: "en"
  });
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      analyses: users.reduce((total, user) => total + user.analysesCount, 0),
      bikes: users.reduce((total, user) => total + user.bikesCount, 0),
      users: users.length
    }),
    [users]
  );

  useEffect(() => {
    loadUsers();
  // Load once when the protected admin route mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers(selectUserId?: string) {
    setLoadingUsers(true);
    setError(null);

    try {
      const nextUsers = await listAdminUsers();
      setUsers(nextUsers);
      const nextSelectedId = selectUserId ?? selectedUserId ?? nextUsers[0]?.authUser.id ?? null;

      if (nextSelectedId) {
        await selectUser(nextSelectedId);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingUsers(false);
    }
  }

  async function selectUser(userId: string) {
    setSelectedUserId(userId);
    setLoadingDetail(true);
    setError(null);
    setMessage(null);

    try {
      const detail = await getAdminUserDetail(userId);
      setSelectedUser(detail);
      setProfileDraft(toProfileDraft(detail));
      setTemporaryPassword("");
    } catch (detailError) {
      setError(getErrorMessage(detailError));
    } finally {
      setLoadingDetail(false);
    }
  }

  async function createUser() {
    setCreatingUser(true);
    setError(null);
    setMessage(null);

    try {
      const created = await createAdminManagedUser(createDraft);
      setCreateDraft({ email: "", name: "", password: "", preferredLanguage: "en" });
      setMessage(t("adminUserCreated"));
      await loadUsers(created.authUser.id);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setCreatingUser(false);
    }
  }

  async function saveProfile() {
    if (!selectedUser) {
      return;
    }

    setSavingProfile(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateAdminManagedUserProfile(selectedUser.authUser.id, {
        date_of_birth: profileDraft.dateOfBirth.trim() || null,
        email: profileDraft.email.trim(),
        gender: profileDraft.gender || null,
        height_cm: parseOptionalNumber(profileDraft.heightCm),
        name: profileDraft.name.trim() || null,
        preferred_language: profileDraft.preferredLanguage,
        weight_kg: parseOptionalNumber(profileDraft.weightKg)
      });
      setSelectedUser(updated);
      setProfileDraft(toProfileDraft(updated));
      setMessage(t("adminUserUpdated"));
      await loadUsers(updated.authUser.id);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingProfile(false);
    }
  }

  async function resetPassword() {
    if (!selectedUser) {
      return;
    }

    setResettingPassword(true);
    setError(null);
    setMessage(null);

    try {
      await setAdminManagedUserTemporaryPassword(selectedUser.authUser.id, temporaryPassword);
      setTemporaryPassword("");
      setMessage(t("adminPasswordUpdated"));
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <Screen maxWidth={1240}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Heading>{t("admin")}</Heading>
          <Body>{t("adminIntro")}</Body>
        </View>

        <Inline>
          <Metric label={t("adminUsers")} value={stats.users} />
          <Metric label={t("adminBikes")} value={stats.bikes} />
          <Metric label={t("adminAnalyses")} value={stats.analyses} />
        </Inline>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.grid}>
          <View style={styles.sidebar}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{t("adminCreateUser")}</Text>
              <Field
                autoCapitalize="none"
                inputMode="email"
                label={t("authEmail")}
                onChangeText={(email) => setCreateDraft((draft) => ({ ...draft, email }))}
                value={createDraft.email}
              />
              <Field
                label={t("authName")}
                onChangeText={(name) => setCreateDraft((draft) => ({ ...draft, name }))}
                value={createDraft.name}
              />
              <Field
                helper={t("adminTemporaryPasswordHelp")}
                label={t("adminTemporaryPassword")}
                onChangeText={(password) => setCreateDraft((draft) => ({ ...draft, password }))}
                secureTextEntry
                value={createDraft.password}
              />
              <SelectField
                label={t("language")}
                onValueChange={(preferredLanguage) =>
                  setCreateDraft((draft) => ({ ...draft, preferredLanguage: toLanguageCode(preferredLanguage) }))
                }
                options={[
                  { label: "English", value: "en" },
                  { label: "Español", value: "es" }
                ]}
                value={createDraft.preferredLanguage}
              />
              <Button loading={creatingUser} onPress={createUser}>
                {t("adminCreateUser")}
              </Button>
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{t("adminUsers")}</Text>
              {loadingUsers ? <Body>Loading...</Body> : null}
              {users.map((user) => (
                <Pressable
                  accessibilityRole="button"
                  key={user.authUser.id}
                  onPress={() => selectUser(user.authUser.id)}
                  style={[styles.userRow, selectedUserId === user.authUser.id && styles.userRowSelected]}
                >
                  <Text style={styles.userName}>{getUserDisplayName(user)}</Text>
                  <Text style={styles.userMeta}>{user.authUser.email ?? t("adminNoEmail")}</Text>
                  <Text style={styles.userMeta}>
                    {user.bikesCount} {t("adminBikes").toLowerCase()} · {user.analysesCount}{" "}
                    {t("adminAnalyses").toLowerCase()}
                  </Text>
                  {user.isAdmin ? <Text style={styles.adminBadge}>{t("adminRoleAdmin")}</Text> : null}
                </Pressable>
              ))}
            </Card>
          </View>

          <View style={styles.detail}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{t("adminUserDetail")}</Text>
              {loadingDetail ? <Body>Loading...</Body> : null}
              {selectedUser ? (
                <View style={styles.detailStack}>
                  <Inline>
                    <Meta label={t("adminUserId")} value={selectedUser.authUser.id} />
                    <Meta label={t("adminRole")} value={selectedUser.isAdmin ? t("adminRoleAdmin") : t("adminRoleAthlete")} />
                    <Meta label={t("adminLastSignIn")} value={formatDateTime(selectedUser.authUser.last_sign_in_at)} />
                  </Inline>

                  <View style={styles.formGrid}>
                    <Field
                      autoCapitalize="none"
                      inputMode="email"
                      label={t("authEmail")}
                      onChangeText={(email) => setProfileDraft((draft) => ({ ...draft, email }))}
                      value={profileDraft.email}
                    />
                    <Field
                      label={t("authName")}
                      onChangeText={(name) => setProfileDraft((draft) => ({ ...draft, name }))}
                      value={profileDraft.name}
                    />
                    <SelectField
                      label={t("gender")}
                      onValueChange={(gender) => setProfileDraft((draft) => ({ ...draft, gender }))}
                      options={[
                        { label: t("genderFemale"), value: "female" },
                        { label: t("genderMale"), value: "male" },
                        { label: t("genderNonBinary"), value: "non_binary" },
                        { label: t("genderPreferNotToSay"), value: "prefer_not_to_say" }
                      ]}
                      placeholder={t("genderSelectPlaceholder")}
                      value={profileDraft.gender}
                    />
                    <SelectField
                      label={t("language")}
                      onValueChange={(preferredLanguage) =>
                        setProfileDraft((draft) => ({ ...draft, preferredLanguage: toLanguageCode(preferredLanguage) }))
                      }
                      options={[
                        { label: "English", value: "en" },
                        { label: "Español", value: "es" }
                      ]}
                      value={profileDraft.preferredLanguage}
                    />
                    <Field
                      inputMode="numeric"
                      label={t("height")}
                      onChangeText={(heightCm) => setProfileDraft((draft) => ({ ...draft, heightCm }))}
                      value={profileDraft.heightCm}
                    />
                    <Field
                      inputMode="numeric"
                      label={t("weight")}
                      onChangeText={(weightKg) => setProfileDraft((draft) => ({ ...draft, weightKg }))}
                      value={profileDraft.weightKg}
                    />
                    <DateField
                      helper={t("dateOfBirthHelp")}
                      label={t("dateOfBirth")}
                      max={new Date().toISOString().slice(0, 10)}
                      min="1900-01-01"
                      onValueChange={(dateOfBirth) => setProfileDraft((draft) => ({ ...draft, dateOfBirth }))}
                      value={profileDraft.dateOfBirth}
                    />
                  </View>

                  <Inline>
                    <Button loading={savingProfile} onPress={saveProfile}>
                      {t("adminSaveUser")}
                    </Button>
                  </Inline>

                  <View style={styles.passwordPanel}>
                    <Field
                      helper={t("adminTemporaryPasswordHelp")}
                      label={t("adminTemporaryPassword")}
                      onChangeText={setTemporaryPassword}
                      secureTextEntry
                      value={temporaryPassword}
                    />
                    <Button loading={resettingPassword} onPress={resetPassword} variant="secondary">
                      {t("adminSetPassword")}
                    </Button>
                  </View>

                  <Section title={t("adminUserBikes")}>
                    {selectedUser.bikes.length ? (
                      selectedUser.bikes.map((bike) => (
                        <View key={bike.id} style={styles.dataRow}>
                          <Text style={styles.dataTitle}>{bike.name}</Text>
                          <Text style={styles.dataText}>
                            {[bike.bike_type, bike.brand, bike.model, bike.size].filter(Boolean).join(" · ")}
                          </Text>
                          <Text style={styles.dataText}>
                            {t("saddleHeight")}: {formatMetric(bike.saddle_height_mm, "mm")} · {t("stemLength")}:{" "}
                            {formatMetric(bike.stem_length_mm, "mm")}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Body>{t("adminNoBikes")}</Body>
                    )}
                  </Section>

                  <Section title={t("adminCameraTests")}>
                    {selectedUser.sessions.length ? (
                      selectedUser.sessions.map((session) => (
                        <CameraTestRow key={session.id} selectedUser={selectedUser} sessionId={session.id} />
                      ))
                    ) : (
                      <Body>{t("adminNoCameraTests")}</Body>
                    )}
                  </Section>
                </View>
              ) : (
                <Body>{t("adminSelectUser")}</Body>
              )}
            </Card>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function CameraTestRow({ selectedUser, sessionId }: { selectedUser: AdminUserDetail; sessionId: string }) {
  const { t } = useLanguage();
  const session = selectedUser.sessions.find((candidate) => candidate.id === sessionId);
  const summary = selectedUser.summaries.find((candidate) => candidate.session_id === sessionId);
  const fit = selectedUser.fitMeasurements.find((candidate) => candidate.session_id === sessionId);
  const front = selectedUser.frontKneeMeasurements.find((candidate) => candidate.session_id === sessionId);
  const aero = selectedUser.aeroScores.find((candidate) => candidate.session_id === sessionId);

  if (!session) {
    return null;
  }

  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataTitle}>{summary?.title ?? session.session_type}</Text>
      <Text style={styles.dataText}>
        {session.camera_angle} · {session.status} · {formatDateTime(session.created_at)}
      </Text>
      <Text style={styles.dataText}>
        {t("confidenceScore")}: {formatScore(summary?.confidence_score ?? fit?.confidence_score ?? front?.confidence_score)}
        {" · "}
        {t("aeroScore")}: {formatScore(summary?.aero_score ?? aero?.final_aero_score)}
      </Text>
      {fit ? (
        <Text style={styles.dataText}>
          {t("kneeAngle")}: {formatMetric(fit.knee_angle_min, "°")}-{formatMetric(fit.knee_angle_max, "°")} ·{" "}
          {t("hipAngle")}: {formatMetric(fit.hip_angle_avg, "°")} · {t("torsoAngle")}:{" "}
          {formatMetric(fit.torso_angle_avg, "°")}
        </Text>
      ) : null}
      {front ? (
        <Text style={styles.dataText}>
          {t("frontKneeLeft")}: {formatMetric(front.left_horizontal_travel_mm, "mm")} H /{" "}
          {formatMetric(front.left_vertical_travel_mm, "mm")} V · {t("frontKneeRight")}:{" "}
          {formatMetric(front.right_horizontal_travel_mm, "mm")} H / {formatMetric(front.right_vertical_travel_mm, "mm")} V
        </Text>
      ) : null}
    </View>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.subsectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function toProfileDraft(user: AdminUserDetail): ProfileDraft {
  return {
    dateOfBirth: user.profile?.date_of_birth ?? "",
    email: user.profile?.email ?? user.authUser.email ?? "",
    gender: user.profile?.gender ?? "",
    heightCm: numberToInput(user.profile?.height_cm),
    name: user.profile?.name ?? "",
    preferredLanguage: user.profile?.preferred_language ?? "en",
    weightKg: numberToInput(user.profile?.weight_kg)
  };
}

function getUserDisplayName(user: AdminUserOverview) {
  return user.profile?.name || user.authUser.email || user.authUser.id;
}

function toLanguageCode(value: string): LanguageCode {
  return value === "es" ? "es" : "en";
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function formatMetric(value: number | null | undefined, suffix: string) {
  return typeof value === "number" ? `${value.toFixed(1)}${suffix}` : "—";
}

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return value <= 1 ? `${Math.round(value * 100)}%` : value.toFixed(0);
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  grid: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  sidebar: {
    flexBasis: 340,
    flexGrow: 1,
    gap: spacing.lg
  },
  detail: {
    flexBasis: 620,
    flexGrow: 2
  },
  card: {
    gap: spacing.lg
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  subsectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
    padding: spacing.md
  },
  metricValue: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  userRow: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md
  },
  userRowSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  userName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  userMeta: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  adminBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: 6,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  detailStack: {
    gap: spacing.lg
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  passwordPanel: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  section: {
    gap: spacing.sm
  },
  dataRow: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md
  },
  dataTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  dataText: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  meta: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexBasis: 180,
    flexGrow: 1,
    gap: 2,
    padding: spacing.md
  },
  metaLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  metaValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  },
  message: {
    color: colors.primary,
    fontWeight: "800"
  }
});
