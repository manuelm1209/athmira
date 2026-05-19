import {
  createAdminManagedUser,
  getAdminUserDetail,
  listGlobalNutritionProducts,
  listAdminUsers,
  setAdminManagedUserRole,
  setAdminManagedUserTemporaryPassword,
  updateGlobalNutritionProduct,
  updateAdminManagedUserProfile
} from "@athmira/supabase";
import type { AdminUserDetail, AdminUserOverview, LanguageCode, NutritionProduct, NutritionProductInput } from "@athmira/types";
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
  isAdmin: boolean;
  name: string;
  password: string;
  preferredLanguage: LanguageCode;
};

type AdminDetailTab = "account" | "bikes" | "tests";
type RoleFilter = "all" | "admin" | "athlete";
type UserSort = "recent_analysis" | "name" | "created_at" | "analyses";

type NutritionProductDraft = {
  caloriesPerServing: string;
  carbsPerServing: string;
  defaultServingSize: string;
  defaultServingUnit: string;
  liquidVolumeMlPerServing: string;
  name: string;
  notes: string;
  sodiumMgPerServing: string;
  weightGPerServing: string;
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

const emptyNutritionProductDraft: NutritionProductDraft = {
  caloriesPerServing: "",
  carbsPerServing: "",
  defaultServingSize: "",
  defaultServingUnit: "",
  liquidVolumeMlPerServing: "",
  name: "",
  notes: "",
  sodiumMgPerServing: "",
  weightGPerServing: ""
};

const adminNutritionCopy = {
  en: {
    calories: "Calories",
    carbs: "Carbs",
    liquid: "Liquid ml",
    name: "Product name",
    nutritionProducts: "Nutrition products",
    nutritionProductsBody: "Edit the global foods used by Nutrition Planning. These values affect new additions to user plans.",
    notes: "Notes",
    productSaved: "Nutrition product updated.",
    saveProduct: "Save product",
    servingSize: "Serving size",
    servingUnit: "Serving unit",
    sodium: "Sodium mg",
    weight: "Weight g"
  },
  es: {
    calories: "Calorias",
    carbs: "Carbohidratos",
    liquid: "Liquido ml",
    name: "Nombre del producto",
    nutritionProducts: "Productos de nutricion",
    nutritionProductsBody: "Edita los alimentos globales usados en Plan de nutricion. Estos valores afectan nuevas adiciones en los planes.",
    notes: "Notas",
    productSaved: "Producto de nutricion actualizado.",
    saveProduct: "Guardar producto",
    servingSize: "Tamano de porcion",
    servingUnit: "Unidad de porcion",
    sodium: "Sodio mg",
    weight: "Peso g"
  }
};

export function AdminScreen() {
  const { language, t } = useLanguage();
  const nutritionCopy = adminNutritionCopy[language];
  const [users, setUsers] = useState<AdminUserOverview[]>([]);
  const [nutritionProducts, setNutritionProducts] = useState<NutritionProduct[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedNutritionProductId, setSelectedNutritionProductId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [nutritionProductDraft, setNutritionProductDraft] = useState<NutritionProductDraft>(emptyNutritionProductDraft);
  const [createDraft, setCreateDraft] = useState<CreateUserDraft>({
    email: "",
    isAdmin: false,
    name: "",
    password: "",
    preferredLanguage: "en"
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [userSort, setUserSort] = useState<UserSort>("recent_analysis");
  const [detailTab, setDetailTab] = useState<AdminDetailTab>("account");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNutritionProduct, setSavingNutritionProduct] = useState(false);
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

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        if (roleFilter === "admin" && !user.isAdmin) {
          return false;
        }

        if (roleFilter === "athlete" && user.isAdmin) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [user.profile?.name, user.authUser.email, user.authUser.id]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => compareUsers(a, b, userSort));
  }, [roleFilter, searchQuery, userSort, users]);

  const selectedNutritionProduct = useMemo(
    () => nutritionProducts.find((product) => product.id === selectedNutritionProductId) ?? nutritionProducts[0] ?? null,
    [nutritionProducts, selectedNutritionProductId]
  );

  useEffect(() => {
    loadUsers();
    loadNutritionProducts();
  // Load once when the protected admin route mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedNutritionProduct) {
      setNutritionProductDraft(emptyNutritionProductDraft);
      return;
    }

    setNutritionProductDraft(toNutritionProductDraft(selectedNutritionProduct));
    setSelectedNutritionProductId(selectedNutritionProduct.id);
  }, [selectedNutritionProduct]);

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

  async function loadNutritionProducts(selectProductId?: string) {
    try {
      const products = await listGlobalNutritionProducts();
      setNutritionProducts(products);
      setSelectedNutritionProductId(selectProductId ?? selectedNutritionProductId ?? products[0]?.id ?? "");
    } catch (loadError) {
      setError(getErrorMessage(loadError));
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
      setCreateDraft({ email: "", isAdmin: false, name: "", password: "", preferredLanguage: "en" });
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

  async function updateSelectedUserRole(nextIsAdmin: boolean) {
    if (!selectedUser || selectedUser.isAdmin === nextIsAdmin) {
      return;
    }

    setSavingProfile(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await setAdminManagedUserRole(selectedUser.authUser.id, nextIsAdmin);
      setSelectedUser(updated);
      setMessage(nextIsAdmin ? t("adminRoleGranted") : t("adminRoleRevoked"));
      await loadUsers(updated.authUser.id);
    } catch (roleError) {
      setError(getErrorMessage(roleError));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveNutritionProduct() {
    if (!selectedNutritionProduct) {
      return;
    }

    setSavingNutritionProduct(true);
    setError(null);
    setMessage(null);

    try {
      if (!nutritionProductDraft.name.trim()) {
        throw new Error(nutritionCopy.name);
      }

      const input: NutritionProductInput = {
        calories_per_serving: parseOptionalNumber(nutritionProductDraft.caloriesPerServing) ?? 0,
        carbs_per_serving: parseOptionalNumber(nutritionProductDraft.carbsPerServing) ?? 0,
        category: selectedNutritionProduct.category,
        default_serving_size: parseOptionalNumber(nutritionProductDraft.defaultServingSize),
        default_serving_unit: nutritionProductDraft.defaultServingUnit.trim() || null,
        icon_key: selectedNutritionProduct.icon_key,
        liquid_volume_ml_per_serving: parseOptionalNumber(nutritionProductDraft.liquidVolumeMlPerServing) ?? 0,
        name: nutritionProductDraft.name.trim(),
        notes: nutritionProductDraft.notes.trim() || null,
        sodium_mg_per_serving: parseOptionalNumber(nutritionProductDraft.sodiumMgPerServing) ?? 0,
        weight_g_per_serving: parseOptionalNumber(nutritionProductDraft.weightGPerServing) ?? 0
      };
      const updated = await updateGlobalNutritionProduct(selectedNutritionProduct.id, input);
      setMessage(nutritionCopy.productSaved);
      await loadNutritionProducts(updated.id);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingNutritionProduct(false);
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

        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.roleCopy}>
              <Text style={styles.sectionTitle}>{nutritionCopy.nutritionProducts}</Text>
              <Body>{nutritionCopy.nutritionProductsBody}</Body>
            </View>
            <View style={styles.productSelectField}>
              <SelectField
                label={nutritionCopy.nutritionProducts}
                onValueChange={setSelectedNutritionProductId}
                options={nutritionProducts.map((product) => ({ label: product.name, value: product.id }))}
                value={selectedNutritionProduct?.id ?? ""}
              />
            </View>
          </View>
          {selectedNutritionProduct ? (
            <View style={styles.formGrid}>
              <View style={styles.productWideField}>
                <Field
                  label={nutritionCopy.name}
                  onChangeText={(name) => setNutritionProductDraft((draft) => ({ ...draft, name }))}
                  value={nutritionProductDraft.name}
                />
              </View>
              <Field
                inputMode="numeric"
                label={nutritionCopy.servingSize}
                onChangeText={(defaultServingSize) => setNutritionProductDraft((draft) => ({ ...draft, defaultServingSize }))}
                value={nutritionProductDraft.defaultServingSize}
              />
              <Field
                label={nutritionCopy.servingUnit}
                onChangeText={(defaultServingUnit) => setNutritionProductDraft((draft) => ({ ...draft, defaultServingUnit }))}
                value={nutritionProductDraft.defaultServingUnit}
              />
              <Field
                inputMode="numeric"
                label={nutritionCopy.carbs}
                onChangeText={(carbsPerServing) => setNutritionProductDraft((draft) => ({ ...draft, carbsPerServing }))}
                value={nutritionProductDraft.carbsPerServing}
              />
              <Field
                inputMode="numeric"
                label={nutritionCopy.calories}
                onChangeText={(caloriesPerServing) => setNutritionProductDraft((draft) => ({ ...draft, caloriesPerServing }))}
                value={nutritionProductDraft.caloriesPerServing}
              />
              <Field
                inputMode="numeric"
                label={nutritionCopy.sodium}
                onChangeText={(sodiumMgPerServing) => setNutritionProductDraft((draft) => ({ ...draft, sodiumMgPerServing }))}
                value={nutritionProductDraft.sodiumMgPerServing}
              />
              <Field
                inputMode="numeric"
                label={nutritionCopy.liquid}
                onChangeText={(liquidVolumeMlPerServing) => setNutritionProductDraft((draft) => ({ ...draft, liquidVolumeMlPerServing }))}
                value={nutritionProductDraft.liquidVolumeMlPerServing}
              />
              <Field
                inputMode="numeric"
                label={nutritionCopy.weight}
                onChangeText={(weightGPerServing) => setNutritionProductDraft((draft) => ({ ...draft, weightGPerServing }))}
                value={nutritionProductDraft.weightGPerServing}
              />
              <View style={styles.productWideField}>
                <Field
                  label={nutritionCopy.notes}
                  onChangeText={(notes) => setNutritionProductDraft((draft) => ({ ...draft, notes }))}
                  value={nutritionProductDraft.notes}
                />
              </View>
            </View>
          ) : (
            <Body>Loading...</Body>
          )}
          <Inline>
            <Button loading={savingNutritionProduct} onPress={saveNutritionProduct}>
              {nutritionCopy.saveProduct}
            </Button>
          </Inline>
        </Card>

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
              <SelectField
                helper={t("adminRoleHelp")}
                label={t("adminRole")}
                onValueChange={(role) => setCreateDraft((draft) => ({ ...draft, isAdmin: role === "admin" }))}
                options={[
                  { label: t("adminRoleAthlete"), value: "athlete" },
                  { label: t("adminRoleAdmin"), value: "admin" }
                ]}
                value={createDraft.isAdmin ? "admin" : "athlete"}
              />
              <Button loading={creatingUser} onPress={createUser}>
                {t("adminCreateUser")}
              </Button>
            </Card>

            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t("adminUsers")}</Text>
                <Text style={styles.countBadge}>{filteredUsers.length}</Text>
              </View>
              <Field
                autoCapitalize="none"
                label={t("adminSearchUsers")}
                onChangeText={setSearchQuery}
                value={searchQuery}
              />
              <Inline>
                <View style={styles.filterField}>
                  <SelectField
                    label={t("adminRoleFilter")}
                    onValueChange={(value) => setRoleFilter(toRoleFilter(value))}
                    options={[
                      { label: t("adminFilterAll"), value: "all" },
                      { label: t("adminRoleAdmin"), value: "admin" },
                      { label: t("adminRoleAthlete"), value: "athlete" }
                    ]}
                    value={roleFilter}
                  />
                </View>
                <View style={styles.filterField}>
                  <SelectField
                    label={t("adminSortBy")}
                    onValueChange={(value) => setUserSort(toUserSort(value))}
                    options={[
                      { label: t("adminSortRecentAnalysis"), value: "recent_analysis" },
                      { label: t("adminSortName"), value: "name" },
                      { label: t("adminSortCreated"), value: "created_at" },
                      { label: t("adminSortAnalyses"), value: "analyses" }
                    ]}
                    value={userSort}
                  />
                </View>
              </Inline>
              {loadingUsers ? <Body>Loading...</Body> : null}
              {filteredUsers.map((user) => (
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
                  <Text style={styles.userMeta}>{t("adminLatestAnalysis")}: {formatDateTime(user.latestAnalysisAt)}</Text>
                  {user.isAdmin ? <Text style={styles.adminBadge}>{t("adminRoleAdmin")}</Text> : null}
                </Pressable>
              ))}
              {!loadingUsers && !filteredUsers.length ? <Body>{t("adminNoUsersMatch")}</Body> : null}
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

                  <Inline style={styles.tabs}>
                    <TabButton active={detailTab === "account"} label={t("adminAccountTab")} onPress={() => setDetailTab("account")} />
                    <TabButton active={detailTab === "bikes"} label={`${t("adminUserBikes")} (${selectedUser.bikes.length})`} onPress={() => setDetailTab("bikes")} />
                    <TabButton active={detailTab === "tests"} label={`${t("adminCameraTests")} (${selectedUser.sessions.length})`} onPress={() => setDetailTab("tests")} />
                  </Inline>

                  {detailTab === "account" ? (
                    <View style={styles.detailStack}>
                      <View style={styles.rolePanel}>
                        <View style={styles.roleCopy}>
                          <Text style={styles.subsectionTitle}>{t("adminRoleManagement")}</Text>
                          <Body>{t("adminRoleHelp")}</Body>
                        </View>
                        <Button
                          loading={savingProfile}
                          onPress={() => updateSelectedUserRole(!selectedUser.isAdmin)}
                          variant={selectedUser.isAdmin ? "danger" : "secondary"}
                        >
                          {selectedUser.isAdmin ? t("adminRevokeAdmin") : t("adminGrantAdmin")}
                        </Button>
                      </View>

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
                    </View>
                  ) : null}

                  {detailTab === "bikes" ? (
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
                  ) : null}

                  {detailTab === "tests" ? (
                    <Section title={t("adminCameraTests")}>
                      {selectedUser.sessions.length ? (
                        selectedUser.sessions.map((session) => (
                          <CameraTestRow key={session.id} selectedUser={selectedUser} sessionId={session.id} />
                        ))
                      ) : (
                        <Body>{t("adminNoCameraTests")}</Body>
                      )}
                    </Section>
                  ) : null}
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

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
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

function toNutritionProductDraft(product: NutritionProduct): NutritionProductDraft {
  return {
    caloriesPerServing: numberToInput(product.calories_per_serving),
    carbsPerServing: numberToInput(product.carbs_per_serving),
    defaultServingSize: numberToInput(product.default_serving_size),
    defaultServingUnit: product.default_serving_unit ?? "",
    liquidVolumeMlPerServing: numberToInput(product.liquid_volume_ml_per_serving),
    name: product.name,
    notes: product.notes ?? "",
    sodiumMgPerServing: numberToInput(product.sodium_mg_per_serving),
    weightGPerServing: numberToInput(product.weight_g_per_serving)
  };
}

function getUserDisplayName(user: AdminUserOverview) {
  return user.profile?.name || user.authUser.email || user.authUser.id;
}

function compareUsers(a: AdminUserOverview, b: AdminUserOverview, sort: UserSort) {
  switch (sort) {
    case "name":
      return getUserDisplayName(a).localeCompare(getUserDisplayName(b));
    case "created_at":
      return new Date(b.authUser.created_at).getTime() - new Date(a.authUser.created_at).getTime();
    case "analyses":
      return b.analysesCount - a.analysesCount;
    case "recent_analysis":
    default:
      return dateValue(b.latestAnalysisAt) - dateValue(a.latestAnalysisAt);
  }
}

function dateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function toRoleFilter(value: string): RoleFilter {
  if (value === "admin" || value === "athlete") {
    return value;
  }

  return "all";
}

function toUserSort(value: string): UserSort {
  if (value === "name" || value === "created_at" || value === "analyses") {
    return value;
  }

  return "recent_analysis";
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
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
  countBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "900",
    minWidth: 32,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "center"
  },
  filterField: {
    flexBasis: 150,
    flexGrow: 1
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
  tabs: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: spacing.xs
  },
  tabButton: {
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  tabButtonActive: {
    backgroundColor: colors.surface
  },
  tabButtonText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "900"
  },
  tabButtonTextActive: {
    color: colors.primaryDark
  },
  rolePanel: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  roleCopy: {
    flexBasis: 260,
    flexGrow: 1,
    gap: spacing.xs
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  productSelectField: {
    flexBasis: 280,
    flexGrow: 1
  },
  productWideField: {
    flexBasis: 300,
    flexGrow: 2
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
