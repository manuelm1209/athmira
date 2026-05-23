import { calculateTirePressure } from "@athmira/nutrition-engine";
import { AppScreen as Screen } from "@/components/AppScreen";
import {
  getLatestTirePressureSetting, listBikes, saveTirePressureSetting
} from "@athmira/supabase";
import type { Bike, BikeType, TirePressureRecommendation, TireSetup, TireWidthUnit } from "@athmira/types";
import { Body, Button, Card, Field, Heading, Inline, SelectField, colors, spacing } from "@athmira/ui";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage, numberToInput, parseOptionalNumber } from "@/utils/form";

const defaultWidthsByBikeType: Record<BikeType, number> = {
  gravel: 40,
  hybrid: 38,
  mountain: 2.3,
  road: 28,
  triathlon: 28
};

export function TirePressureScreen() {
  const params = useLocalSearchParams<{ bikeId?: string }>();
  const { profile, updateProfile, user } = useAuth();
  const { t } = useLanguage();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState(params.bikeId ?? "");
  const [bikeType, setBikeType] = useState<BikeType>("road");
  const [tireSetup, setTireSetup] = useState<TireSetup>("standard_tube");
  const [tireWidthUnit, setTireWidthUnit] = useState<TireWidthUnit>("mm");
  const [tireWidth, setTireWidth] = useState("28");
  const [riderWeightKg, setRiderWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedBike = bikes.find((bike) => bike.id === selectedBikeId) ?? null;
  const parsedWeight = parseOptionalNumber(riderWeightKg);
  const parsedWidth = parseOptionalNumber(tireWidth);

  const recommendation = useMemo<TirePressureRecommendation | null>(() => {
    if (!parsedWeight || !parsedWidth) {
      return null;
    }

    return calculateTirePressure({
      bikeType: selectedBike?.bike_type ?? bikeType,
      riderWeightKg: parsedWeight,
      tireSetup,
      tireWidth: parsedWidth,
      tireWidthUnit
    });
  }, [bikeType, parsedWeight, parsedWidth, selectedBike?.bike_type, tireSetup, tireWidthUnit]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function load() {
      try {
        const nextBikes = await listBikes(currentUser.id);

        if (cancelled) {
          return;
        }

        setBikes(nextBikes);

        const routeBike = params.bikeId ? nextBikes.find((bike) => bike.id === params.bikeId) : null;
        const initialBike = routeBike ?? nextBikes[0] ?? null;

        if (routeBike) {
          setSelectedBikeId(routeBike.id);
          setBikeType(routeBike.bike_type);
        } else if (!selectedBikeId && initialBike) {
          setSelectedBikeId(initialBike.id);
          setBikeType(initialBike.bike_type);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  // Route params should seed the first load only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.bikeId, user]);

  useEffect(() => {
    if (profile?.weight_kg && !riderWeightKg) {
      setRiderWeightKg(numberToInput(profile.weight_kg));
    }
  }, [profile?.weight_kg, riderWeightKg]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadLatestSetting() {
      try {
        const setting = await getLatestTirePressureSetting({
          bikeId: selectedBikeId || null,
          userId: currentUser.id
        });

        if (cancelled) {
          return;
        }

        if (setting) {
          setBikeType(setting.bike_type);
          setRiderWeightKg(numberToInput(setting.rider_weight_kg));
          setTireSetup(normalizeTireSetup(setting.tire_setup));
          setTireWidth(numberToInput(getSavedTireWidthValue(setting)));
          setTireWidthUnit(setting.tire_width_unit);
          setNotes(setting.notes ?? "");
          return;
        }

        const nextBikeType = selectedBike?.bike_type ?? "road";
        setBikeType(nextBikeType);
        setTireSetup("standard_tube");
        setTireWidthUnit(getDefaultWidthUnit(nextBikeType));
        setTireWidth(String(defaultWidthsByBikeType[nextBikeType]));
        setNotes("");
      } catch {
        // Latest settings are optional; a failed lookup should not block calculator use.
      }
    }

    loadLatestSetting();

    return () => {
      cancelled = true;
    };
  }, [selectedBike?.bike_type, selectedBikeId, user]);

  function handleBikeChange(nextBikeId: string) {
    setSelectedBikeId(nextBikeId);

    const nextBike = bikes.find((bike) => bike.id === nextBikeId);

    if (nextBike) {
      setBikeType(nextBike.bike_type);
      setTireWidthUnit(getDefaultWidthUnit(nextBike.bike_type));
      setTireWidth(String(defaultWidthsByBikeType[nextBike.bike_type]));
      return;
    }

    setBikeType("road");
    setTireWidthUnit("mm");
    setTireWidth(String(defaultWidthsByBikeType.road));
  }

  function handleBikeTypeChange(nextBikeType: string) {
    const typedBikeType = toBikeType(nextBikeType);
    setBikeType(typedBikeType);

    if (typedBikeType === "mountain") {
      setTireWidthUnit("in");
      setTireWidth("2.3");
    } else if (tireWidthUnit === "in") {
      setTireWidthUnit("mm");
      setTireWidth(String(defaultWidthsByBikeType[typedBikeType]));
    }
  }

  async function saveCalculation() {
    if (!user || !recommendation || !parsedWeight || !parsedWidth) {
      setError(t("tirePressureMissingInputs"));
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!profile?.weight_kg || profile.weight_kg !== parsedWeight) {
        await updateProfile({ weight_kg: parsedWeight });
      }

      await saveTirePressureSetting(user.id, {
        bikeId: selectedBikeId || null,
        bikeType: selectedBike?.bike_type ?? bikeType,
        frontPressurePsi: recommendation.frontPsi,
        notes: notes.trim() || null,
        rearPressurePsi: recommendation.rearPsi,
        riderWeightKg: parsedWeight,
        surfaceRecommendations: recommendation.surfaceRecommendations,
        tireSetup,
        tireWidth: parsedWidth,
        tireWidthMm: recommendation.normalizedTireWidthMm,
        tireWidthUnit
      });

      setMessage(selectedBikeId ? t("tirePressureSaved") : t("tirePressureSavedWithoutBike"));
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen maxWidth={1120}>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("tirePressureTitle")}</Heading>
          <Body>{t("tirePressureIntro")}</Body>
          {!selectedBikeId ? <Body>{t("tirePressureNoBikeSuggestion")}</Body> : null}
          <Inline>
            <LinkButton href="/bikes" variant="secondary">
              {t("bikes")}
            </LinkButton>
            <LinkButton href="/bikes/new" variant="ghost">
              {t("addBike")}
            </LinkButton>
          </Inline>
        </View>

        <View style={styles.grid}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{t("tirePressureInputs")}</Text>
            <SelectField
              label={t("selectedBike")}
              onValueChange={handleBikeChange}
              options={bikes.map((bike) => ({ label: bike.name, value: bike.id }))}
              placeholder={t("tirePressureNoBikeOption")}
              value={selectedBikeId}
            />
            {!selectedBike ? (
              <SelectField
                label={t("bikeType")}
                onValueChange={handleBikeTypeChange}
                options={[
                  { label: t("road"), value: "road" },
                  { label: t("gravel"), value: "gravel" },
                  { label: t("triathlon"), value: "triathlon" },
                  { label: t("mountain"), value: "mountain" },
                  { label: t("hybrid"), value: "hybrid" }
                ]}
                value={bikeType}
              />
            ) : (
              <View style={styles.lockedType}>
                <Text style={styles.lockedLabel}>{t("bikeType")}</Text>
                <Text style={styles.lockedValue}>{t(selectedBike.bike_type)}</Text>
              </View>
            )}
            <Inline>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={t("tirePressureRiderWeight")}
                  onChangeText={setRiderWeightKg}
                  value={riderWeightKg}
                />
              </View>
              <View style={styles.splitField}>
                <Field
                  inputMode="numeric"
                  label={t("tireWidth")}
                  onChangeText={setTireWidth}
                  value={tireWidth}
                />
              </View>
              <View style={styles.unitField}>
                <SelectField
                  label={t("tireWidthUnit")}
                  onValueChange={(value) => setTireWidthUnit(value === "in" ? "in" : "mm")}
                  options={[
                    { label: "mm", value: "mm" },
                    { label: "in", value: "in" }
                  ]}
                  value={tireWidthUnit}
                />
              </View>
            </Inline>
            <SelectField
              label={t("tireSetup")}
              onValueChange={(value) => setTireSetup(toTireSetup(value))}
              options={[
                { label: t("tireSetupStandardTube"), value: "standard_tube" },
                { label: t("tireSetupTpuTube"), value: "tpu_tube" },
                { label: t("tireSetupTubeless"), value: "tubeless" }
              ]}
              value={tireSetup}
            />
            <Field
              helper={t("tirePressureNotesHelp")}
              label={t("tirePressureNotes")}
              onChangeText={setNotes}
              placeholder={t("tirePressureNotesPlaceholder")}
              value={notes}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Button disabled={!recommendation} loading={saving} onPress={saveCalculation}>
              {t("tirePressureSaveCalculation")}
            </Button>
          </Card>

          <View style={styles.resultsColumn}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{t("tirePressureRecommendation")}</Text>
              {recommendation ? (
                <>
                  <Inline>
                    <PressureMetric label={t("tirePressureFront")} value={recommendation.frontPsi} />
                    <PressureMetric label={t("tirePressureRear")} value={recommendation.rearPsi} />
                  </Inline>
                  <Text style={styles.helperText}>
                    {t("tirePressureRange")}: {recommendation.minPsi}-{recommendation.maxPsi} PSI ·{" "}
                    {recommendation.normalizedTireWidthMm.toFixed(1)} mm
                  </Text>
                </>
              ) : (
                <Body>{t("tirePressureMissingInputs")}</Body>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>{t("tirePressureSurfaces")}</Text>
              {recommendation ? (
                recommendation.surfaceRecommendations.map((surface) => (
                  <View key={surface.surface} style={styles.surfaceRow}>
                    <View style={styles.surfaceCopy}>
                      <Text style={styles.surfaceTitle}>{getSurfaceTitle(surface.surface, t)}</Text>
                      <Text style={styles.surfaceNote}>{getSurfaceNote(surface.surface, t)}</Text>
                    </View>
                    <Text style={styles.surfacePressure}>
                      {surface.frontPsi}/{surface.rearPsi} PSI
                    </Text>
                  </View>
                ))
              ) : (
                <Body>{t("tirePressureSurfacePlaceholder")}</Body>
              )}
            </Card>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function PressureMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pressureMetric}>
      <Text style={styles.pressureValue}>{value}</Text>
      <Text style={styles.pressureLabel}>{label}</Text>
    </View>
  );
}

function toBikeType(value: string): BikeType {
  if (value === "gravel" || value === "triathlon" || value === "mountain" || value === "hybrid") {
    return value;
  }

  return "road";
}

function toTireSetup(value: string): TireSetup {
  if (value === "tpu_tube" || value === "tubeless") {
    return value;
  }

  return "standard_tube";
}

function normalizeTireSetup(value: string | null | undefined): TireSetup {
  if (value === "inner_tube") {
    return "standard_tube";
  }

  return toTireSetup(value ?? "standard_tube");
}

function getDefaultWidthUnit(bikeType: BikeType): TireWidthUnit {
  return bikeType === "mountain" ? "in" : "mm";
}

function getSavedTireWidthValue(setting: { tire_width_mm: number; tire_width_unit: TireWidthUnit; tire_width_value?: number }) {
  if (typeof setting.tire_width_value === "number") {
    return setting.tire_width_value;
  }

  return setting.tire_width_unit === "in" ? setting.tire_width_mm / 25.4 : setting.tire_width_mm;
}

function getSurfaceTitle(surface: TirePressureRecommendation["surfaceRecommendations"][number]["surface"], t: ReturnType<typeof useLanguage>["t"]) {
  switch (surface) {
    case "smooth":
      return t("tireSurfaceSmooth");
    case "rough":
      return t("tireSurfaceRough");
    case "gravel":
      return t("tireSurfaceGravel");
    case "wet":
      return t("tireSurfaceWet");
    case "loose":
      return t("tireSurfaceLoose");
    default:
      return surface;
  }
}

function getSurfaceNote(surface: TirePressureRecommendation["surfaceRecommendations"][number]["surface"], t: ReturnType<typeof useLanguage>["t"]) {
  switch (surface) {
    case "smooth":
      return t("tireSurfaceSmoothNote");
    case "rough":
      return t("tireSurfaceRoughNote");
    case "gravel":
      return t("tireSurfaceGravelNote");
    case "wet":
      return t("tireSurfaceWetNote");
    case "loose":
      return t("tireSurfaceLooseNote");
    default:
      return "";
  }
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl
  },
  header: {
    gap: spacing.md
  },
  grid: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  card: {
    gap: spacing.lg
  },
  resultsColumn: {
    flexBasis: 360,
    flexGrow: 1,
    gap: spacing.lg
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  splitField: {
    flexBasis: 180,
    flexGrow: 1
  },
  unitField: {
    flexBasis: 120,
    flexGrow: 0
  },
  lockedType: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    gap: spacing.xs,
    padding: spacing.md
  },
  lockedLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  lockedValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  pressureMetric: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    minWidth: 140,
    padding: spacing.lg
  },
  pressureValue: {
    color: colors.primaryDark,
    fontSize: 38,
    fontWeight: "900"
  },
  pressureLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "900"
  },
  helperText: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  surfaceRow: {
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
  surfaceCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220
  },
  surfaceTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  surfaceNote: {
    color: colors.inkMuted,
    fontSize: 12,
    lineHeight: 17
  },
  surfacePressure: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900"
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
