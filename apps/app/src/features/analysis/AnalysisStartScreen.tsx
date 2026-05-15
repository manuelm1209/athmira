import { listAnalysisHistory, listBikes } from "@athmira/supabase";
import type { AnalysisHistoryItem, Bike } from "@athmira/types";
import { Body, Button, Card, Heading, Inline, Screen, colors, radii, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import type { TranslationKey } from "@/i18n";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

export function AnalysisStartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadBikes() {
      try {
        const [nextBikes, nextHistory] = await Promise.all([
          listBikes(currentUser.id),
          listAnalysisHistory({ limit: 8, userId: currentUser.id })
        ]);

        if (!cancelled) {
          setBikes(nextBikes);
          setHistory(nextHistory);
          setSelectedBikeId(nextBikes[0]?.id ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      }
    }

    loadBikes();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function openCamera() {
    if (selectedBikeId) {
      router.push({
        pathname: "/analysis/camera",
        params: { bikeId: selectedBikeId }
      });
      return;
    }

    router.push("/analysis/camera");
  }

  function openFrontKneeCamera() {
    if (selectedBikeId) {
      router.push({
        pathname: "/analysis/front-knee",
        params: { bikeId: selectedBikeId }
      });
      return;
    }

    router.push("/analysis/front-knee");
  }

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("startBikeFit")}</Heading>
          <Body>{t("analysisIntro")}</Body>
        </View>
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{t("cameraInstructions")}</Text>
          <View style={styles.instructions}>
            <Text style={styles.instruction}>{t("placeCamera")}</Text>
            <Text style={styles.instruction}>{t("showEntireBike")}</Text>
            <Text style={styles.instruction}>{t("steadyPedaling")}</Text>
          </View>
          <Text style={styles.sectionLabel}>{t("chooseBike")}</Text>
          {bikes.length === 0 ? (
            <View style={styles.empty}>
              <Body>{t("noBikes")}</Body>
              <LinkButton href="/bikes/new">{t("addBike")}</LinkButton>
            </View>
          ) : (
            <View style={styles.bikeList}>
              {bikes.map((bike) => (
                <Pressable
                  accessibilityRole="button"
                  key={bike.id}
                  onPress={() => setSelectedBikeId(bike.id)}
                  style={[styles.bikeOption, selectedBikeId === bike.id && styles.selectedBike]}
                >
                  <Text style={[styles.bikeName, selectedBikeId === bike.id && styles.selectedBikeText]}>
                    {bike.name}
                  </Text>
                  <Text style={[styles.bikeMeta, selectedBikeId === bike.id && styles.selectedBikeText]}>
                    {[bike.brand, bike.model].filter(Boolean).join(" / ") || bike.bike_type}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Inline>
            <Button disabled={bikes.length === 0} onPress={openCamera}>
              {t("sideFitAnalysis")}
            </Button>
            <Button disabled={bikes.length === 0} onPress={openFrontKneeCamera} variant="secondary">
              {t("frontKneeTitle")}
            </Button>
          </Inline>
        </Card>
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{t("analysisHistory")}</Text>
          {history.length ? (
            <View style={styles.historyList}>
              {history.map((item, index) => (
                <HistoryCard
                  item={item}
                  key={item.session.id}
                  previous={history.slice(index + 1).find((candidate) => getHistoryType(candidate) === getHistoryType(item))}
                />
              ))}
            </View>
          ) : (
            <Body>{t("noAnalysisHistory")}</Body>
          )}
        </Card>
      </View>
    </Screen>
  );
}

function HistoryCard({ item, previous }: { item: AnalysisHistoryItem; previous?: AnalysisHistoryItem }) {
  const { t } = useLanguage();
  const isFront = getHistoryType(item) === "front_knee_tracking";
  const score = getPrimaryScore(item);
  const previousScore = previous ? getPrimaryScore(previous) : null;
  const delta = typeof score === "number" && typeof previousScore === "number" ? score - previousScore : null;

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>{item.summary?.title ?? (isFront ? t("frontKneeTitle") : t("sideFitAnalysis"))}</Text>
        <Text style={styles.historyDate}>{new Date(item.session.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.historyMetrics}>
        <HistoryMetric label={isFront ? t("frontKneeOverallScore") : t("comfortScore")} value={formatScore(score)} />
        <HistoryMetric label={t("confidenceScore")} value={formatPercent(item.summary?.confidence_score)} />
        <HistoryMetric label={t("previousComparison")} value={formatDelta(delta)} />
      </View>
      <Text style={styles.historyMeta}>{formatHistoryDetails(item, t)}</Text>
      <LinkButton
        href={{
          pathname: "/analysis/results",
          params: { sessionId: item.session.id }
        }}
        variant="ghost"
      >
        {t("savedMeasurements")}
      </LinkButton>
    </View>
  );
}

function getHistoryType(item: AnalysisHistoryItem) {
  return item.summary?.analysis_type ?? (item.session.camera_angle === "front" ? "front_knee_tracking" : "side_bike_fit");
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.historyMetric}>
      <Text style={styles.historyMetricLabel}>{label}</Text>
      <Text style={styles.historyMetricValue}>{value}</Text>
    </View>
  );
}

function getPrimaryScore(item: AnalysisHistoryItem) {
  return item.summary?.overall_score ?? item.frontKneeMeasurement?.overall_score ?? item.aeroScore?.final_aero_score ?? null;
}

function formatScore(value: number | null) {
  return typeof value === "number" ? String(Math.round(value)) : "--";
}

function formatPercent(value?: number | null) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "--";
}

function formatDelta(value: number | null) {
  if (typeof value !== "number") {
    return "--";
  }

  if (value === 0) {
    return "0";
  }

  return `${value > 0 ? "+" : ""}${Math.round(value)}`;
}

function formatHistoryDetails(item: AnalysisHistoryItem, t: (key: TranslationKey) => string) {
  if (item.frontKneeMeasurement) {
    return `${t("frontKneeMaxDrift")}: L ${formatDistance(
      item.frontKneeMeasurement.left_knee_drift_mm,
      item.frontKneeMeasurement.left_knee_drift_px
    )} / R ${formatDistance(item.frontKneeMeasurement.right_knee_drift_mm, item.frontKneeMeasurement.right_knee_drift_px)}`;
  }

  if (item.fitMeasurement) {
    return `${t("kneeAngle")}: ${formatAngleRange(
      item.fitMeasurement.knee_angle_min,
      item.fitMeasurement.knee_angle_max
    )} · ${t("torsoAngle")}: ${formatAngle(item.fitMeasurement.torso_angle_avg)}`;
  }

  return t("savedMeasurements");
}

function formatDistance(mm?: number | null, px?: number | null) {
  if (typeof mm === "number") {
    return `${Math.round(mm)} mm`;
  }

  return typeof px === "number" ? `${Math.round(px)} px` : "--";
}

function formatAngle(value?: number | null) {
  return typeof value === "number" ? `${Math.round(value)}°` : "--";
}

function formatAngleRange(min?: number | null, max?: number | null) {
  if (typeof min === "number" && typeof max === "number") {
    return `${Math.round(min)}-${Math.round(max)}°`;
  }

  return formatAngle(max ?? min);
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl
  },
  header: {
    gap: spacing.md
  },
  card: {
    gap: spacing.lg
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  instructions: {
    gap: spacing.sm
  },
  instruction: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22
  },
  empty: {
    alignItems: "flex-start",
    gap: spacing.md
  },
  bikeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  bikeOption: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  selectedBike: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  bikeName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  bikeMeta: {
    color: colors.inkMuted,
    fontSize: 13
  },
  selectedBikeText: {
    color: "#ffffff"
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  },
  historyList: {
    gap: spacing.md
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  historyHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  historyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  historyDate: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  historyMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  historyMetric: {
    minWidth: 110
  },
  historyMetricLabel: {
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  historyMetricValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  historyMeta: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20
  }
});
