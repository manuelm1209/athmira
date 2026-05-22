import { listAnalysisHistory, listBikes } from "@athmira/supabase";
import type { AnalysisHistoryItem, Bike } from "@athmira/types";
import {
  Body,
  Card,
  FadeInView,
  Heading,
  Inline,
  Screen,
  colors,
  radii,
  shadows,
  spacing,
  typography
} from "@athmira/ui";
import type { Href } from "expo-router";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import type { TranslationKey } from "@/i18n";
import { visualAssets } from "@/lib/visual-assets";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

type DashboardData = {
  bikes: Bike[];
  history: AnalysisHistoryItem[];
};

type DashboardModule = {
  detail: TranslationKey;
  href: Href;
  label: TranslationKey;
  metric: string;
  progress: number;
  tone: "accent" | "amber" | "blue" | "primary";
};

export function DashboardScreen() {
  const { profile, user } = useAuth();
  const { t, language } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 940;
  const narrow = width < 620;
  const [data, setData] = useState<DashboardData>({ bikes: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      try {
        const [bikes, history] = await Promise.all([
          listBikes(currentUser.id),
          listAnalysisHistory({ limit: 8, userId: currentUser.id })
        ]);

        if (!cancelled) {
          setData({ bikes, history });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const latestBike = data.bikes[0] ?? null;
  const latestAnalysis = data.history[0] ?? null;
  const profileProgress = getProfileProgress(profile);
  const setupProgress = getSetupProgress({
    analysisCount: data.history.length,
    bikeCount: data.bikes.length,
    profileProgress
  });
  const latestScore = getLatestScore(latestAnalysis);
  const latestAeroScore = getLatestAeroScore(latestAnalysis);
  const confidenceScore = getLatestConfidenceScore(latestAnalysis);
  const athleteName = profile?.name ? `, ${profile.name.split(" ")[0]}` : "";
  const dateLocale = language === "es" ? "es-CO" : "en-US";
  const recentPoints = getRecentChartPoints(data.history, dateLocale);
  const primaryAction = getPrimaryAction({ hasAnalysis: data.history.length > 0, hasBike: data.bikes.length > 0 });
  const latestResultsHref = latestAnalysis
    ? ({ pathname: "/analysis/results", params: { sessionId: latestAnalysis.session.id } } as Href)
    : ("/analysis" as Href);
  const modules = useMemo<DashboardModule[]>(
    () => [
      {
        detail: "dashboardBikeFitDetail",
        href: "/analysis",
        label: "bikeFit",
        metric: latestScore === null ? t("dashboardReady") : `${latestScore}/100`,
        progress: latestScore ?? setupProgress,
        tone: "primary"
      },
      {
        detail: "dashboardFrontKneeDetail",
        href: "/analysis/front-knee",
        label: "frontKneeTitle",
        metric: latestAnalysis?.frontKneeMeasurement?.overall_score
          ? `${Math.round(latestAnalysis.frontKneeMeasurement.overall_score)}/100`
          : t("dashboardReady"),
        progress: latestAnalysis?.frontKneeMeasurement?.overall_score ?? (data.bikes.length ? 54 : 20),
        tone: "blue"
      },
      {
        detail: "dashboardNutritionDetail",
        href: "/nutrition",
        label: "nutrition",
        metric: profile?.weight_kg ? `${profile.weight_kg} kg` : t("dashboardProfileNeeded"),
        progress: profile?.weight_kg ? 72 : 28,
        tone: "accent"
      },
      {
        detail: "dashboardPressureDetail",
        href: "/tire-pressure",
        label: "tirePressureNav",
        metric: latestBike ? t(latestBike.bike_type) : t("dashboardBikeNeeded"),
        progress: latestBike ? 68 : 24,
        tone: "amber"
      }
    ],
    [data.bikes.length, latestAnalysis, latestBike, latestScore, profile?.weight_kg, setupProgress, t]
  );

  return (
    <Screen maxWidth={1240}>
      <View style={styles.stack}>
        <FadeInView style={[styles.heroPanel, compact && styles.heroPanelCompact]}>
          <View style={styles.heroCopy}>
            <Heading style={styles.heroTitle}>{`${t("greeting")}${athleteName}`}</Heading>
            <Body style={styles.heroBody}>{t(primaryAction.body)}</Body>
            <Inline style={styles.heroActions}>
              <LinkButton href={primaryAction.href}>{t(primaryAction.label)}</LinkButton>
              <LinkButton href="/bikes/new" variant="secondary">
                {t("addBike")}
              </LinkButton>
              <LinkButton href="/nutrition" variant="ghost">
                {t("nutrition")}
              </LinkButton>
            </Inline>
          </View>

          <View style={styles.heroVisual}>
            <Image
              accessibilityLabel="Cyclist training on track"
              resizeMode="cover"
              source={visualAssets.aeroTrack}
              style={styles.heroImage}
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>{t("dashboardSetupScore")}</Text>
              <Text style={styles.heroMetricValue}>{setupProgress}%</Text>
              <Text style={styles.heroMetricHint}>{t("dashboardBasedOnYourData")}</Text>
            </View>
          </View>
        </FadeInView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FadeInView delayMs={100} style={styles.metricsGrid}>
          <PerformanceMetric label={t("dashboardBikesCount")} tone="primary" value={String(data.bikes.length)} />
          <PerformanceMetric label={t("dashboardAnalysesCount")} tone="blue" value={String(data.history.length)} />
          <PerformanceMetric label={t("dashboardLatestScore")} tone="accent" value={formatScore(latestScore)} />
          <PerformanceMetric label={t("dashboardProfileComplete")} tone="amber" value={`${profileProgress}%`} />
        </FadeInView>

        <View style={[styles.contentGrid, compact && styles.contentGridCompact]}>
          <FadeInView delayMs={160} style={styles.leftColumn}>
            <Card style={styles.overviewCard}>
              <View style={[styles.cardHeader, narrow && styles.cardHeaderStacked]}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardLabel}>{t("dashboardToday")}</Text>
                  <Text style={styles.cardTitle}>{t("dashboardCommandCenter")}</Text>
                </View>
                <Text style={styles.statusText}>{loading ? t("dashboardLoading") : t("dashboardSynced")}</Text>
              </View>

              <View style={styles.statusGrid}>
                <StatusItem
                  complete={profileProgress >= 80}
                  label={t("profile")}
                  value={`${profileProgress}%`}
                />
                <StatusItem
                  complete={data.bikes.length > 0}
                  label={t("bikes")}
                  value={data.bikes.length ? `${data.bikes.length}` : t("dashboardPending")}
                />
                <StatusItem
                  complete={Boolean(latestAnalysis)}
                  label={t("camera")}
                  value={latestAnalysis ? formatDate(latestAnalysis.session.created_at, dateLocale) : t("dashboardPending")}
                />
                <StatusItem
                  complete={Boolean(profile?.weight_kg)}
                  label={t("nutrition")}
                  value={profile?.weight_kg ? `${profile.weight_kg} kg` : t("dashboardPending")}
                />
              </View>
            </Card>

            <View style={[styles.dualGrid, narrow && styles.dualGridCompact]}>
              <Card style={styles.latestBikeCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderCopy}>
                    <Text style={styles.cardLabel}>{t("latestBike")}</Text>
                    <Text style={styles.cardTitle}>{latestBike?.name ?? t("dashboardNoBikeTitle")}</Text>
                  </View>
                  <View style={styles.bikeIcon}>
                    <Text style={styles.bikeIconText}>A</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{latestBike ? getBikeMeta(latestBike, t) : t("dashboardNoBikeBody")}</Text>
                <View style={styles.measureGrid}>
                  <MiniMeasure label={t("saddleHeight")} value={formatMillimeters(latestBike?.saddle_height_mm)} />
                  <MiniMeasure label={t("stemLength")} value={formatMillimeters(latestBike?.stem_length_mm)} />
                  <MiniMeasure label={t("crankLength")} value={formatMillimeters(latestBike?.crank_length_mm)} />
                </View>
                <LinkButton href={latestBike ? `/bikes/${latestBike.id}` : "/bikes/new"} variant="secondary">
                  {latestBike ? t("editBike") : t("addBike")}
                </LinkButton>
              </Card>

              <Card style={styles.analysisCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderCopy}>
                    <Text style={styles.cardLabel}>{t("dashboardLatestAnalysis")}</Text>
                    <Text style={styles.cardTitle}>{latestAnalysis?.summary?.title ?? t("dashboardNoAnalysisTitle")}</Text>
                  </View>
                  <Text style={styles.dateText}>
                    {latestAnalysis ? formatDate(latestAnalysis.session.created_at, dateLocale) : t("dashboardPending")}
                  </Text>
                </View>
                <View style={styles.scoreRow}>
                  <ScorePill label={t("dashboardLatestScore")} value={formatScore(latestScore)} />
                  <ScorePill label={t("aeroScore")} value={formatScore(latestAeroScore)} />
                  <ScorePill label={t("confidenceScore")} value={formatScore(confidenceScore)} />
                </View>
                <Text style={styles.cardMeta}>
                  {latestAnalysis ? getRecommendationPreview(latestAnalysis, t) : t("noAnalysisHistory")}
                </Text>
                <LinkButton href={latestResultsHref} variant="secondary">
                  {latestAnalysis ? t("fitResults") : t("startBikeFit")}
                </LinkButton>
              </Card>
            </View>

            <Card style={styles.historyCard}>
              <View style={[styles.cardHeader, narrow && styles.cardHeaderStacked]}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardLabel}>{t("dashboardWeeklyLoad")}</Text>
                  <Text style={styles.cardTitle}>{t("analysisHistory")}</Text>
                </View>
                <Text style={styles.deltaText}>
                  {data.history.length ? `${data.history.length} ${t("dashboardSaved")}` : t("dashboardNoData")}
                </Text>
              </View>
              <AnalysisHistoryChart points={recentPoints} />
            </Card>
          </FadeInView>

          <FadeInView delayMs={220} style={styles.rightColumn}>
            <Card style={styles.actionCard}>
              <Text style={styles.cardLabelOnDark}>{t("dashboardNextBestAction")}</Text>
              <Text style={styles.actionTitle}>{t(primaryAction.title)}</Text>
              <Text style={styles.actionBody}>{t(primaryAction.detail)}</Text>
              <Inline style={styles.actionButtons}>
                <LinkButton href={primaryAction.href}>{t(primaryAction.label)}</LinkButton>
                <LinkButton href="/analysis/front-knee" variant="secondary">
                  {t("frontKneeTitle")}
                </LinkButton>
              </Inline>
              <View style={styles.safetyNote}>
                <Text style={styles.safetyNoteText}>{t("educationalNote")}</Text>
              </View>
            </Card>

            <View style={styles.moduleGrid}>
              {modules.map((module) => (
                <ModuleTile key={module.label} module={module} />
              ))}
            </View>

            <Card style={styles.pathCard}>
              <Text style={styles.cardLabel}>{t("dashboardYourPath")}</Text>
              <Text style={styles.cardTitle}>{t("dashboardBuildFoundation")}</Text>
              <View style={styles.pathSteps}>
                <PathStep active complete={profileProgress >= 80} href="/profile" label={t("dashboardStepProfile")} />
                <PathStep
                  active={data.bikes.length > 0}
                  complete={data.bikes.length > 0}
                  href={data.bikes.length ? "/bikes" : "/bikes/new"}
                  label={t("dashboardStepBike")}
                />
                <PathStep
                  active={data.history.length > 0}
                  complete={data.history.length > 0}
                  href="/analysis"
                  label={t("dashboardStepCamera")}
                />
                <PathStep
                  active={Boolean(profile?.weight_kg)}
                  complete={Boolean(profile?.weight_kg)}
                  href="/nutrition"
                  label={t("dashboardStepNutrition")}
                />
              </View>
            </Card>
          </FadeInView>
        </View>
      </View>
    </Screen>
  );
}

function PerformanceMetric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "accent" | "amber" | "blue" | "primary";
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricTone, getToneStyle(tone)]} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatusItem({ complete, label, value }: { complete: boolean; label: string; value: string }) {
  return (
    <View style={[styles.statusItem, complete && styles.statusItemComplete]}>
      <View style={[styles.statusDot, complete && styles.statusDotComplete]} />
      <View style={styles.statusCopy}>
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusValue}>{value}</Text>
      </View>
    </View>
  );
}

function MiniMeasure({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniMeasure}>
      <Text style={styles.miniMeasureLabel}>{label}</Text>
      <Text style={styles.miniMeasureValue}>{value}</Text>
    </View>
  );
}

function ScorePill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scorePill}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

function ModuleTile({ module }: { module: DashboardModule }) {
  const { t } = useLanguage();

  return (
    <Link href={module.href} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => [styles.moduleTile, pressed && styles.pressedTile]}>
        <View style={[styles.moduleIcon, getModuleIconStyle(module.tone)]}>
          <Text style={styles.moduleIconText}>{t(module.label).slice(0, 1)}</Text>
        </View>
        <View style={styles.moduleCopy}>
          <Text style={styles.moduleTitle}>{t(module.label)}</Text>
          <Text style={styles.moduleDetail}>{t(module.detail)}</Text>
        </View>
        <Text style={styles.moduleMetric}>{module.metric}</Text>
        <ProgressBar progress={module.progress} />
      </Pressable>
    </Link>
  );
}

function AnalysisHistoryChart({ points }: { points: { label: string; score: number; value: string }[] }) {
  const { t } = useLanguage();
  const hasRealData = points.some((point) => point.score > 0);

  if (!hasRealData) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyTitle}>{t("dashboardNoAnalysisTitle")}</Text>
        <Text style={styles.chartEmptyText}>{t("noAnalysisHistory")}</Text>
        <LinkButton href="/analysis" variant="secondary">
          {t("startBikeFit")}
        </LinkButton>
      </View>
    );
  }

  return (
    <View style={styles.chartPanel}>
      <View style={styles.chartGridLines}>
        <View style={styles.chartGridLine} />
        <View style={styles.chartGridLine} />
        <View style={styles.chartGridLine} />
      </View>
      <View style={styles.chartAxisLabels}>
        <Text style={styles.chartAxisLabel}>100</Text>
        <Text style={styles.chartAxisLabel}>50</Text>
        <Text style={styles.chartAxisLabel}>0</Text>
      </View>
      <View style={styles.chartSeries}>
        {points.map((point, index) => (
          <View key={`${point.label}-${index}`} style={styles.chartColumn}>
            <Text style={styles.chartValue}>{point.value}</Text>
            <View style={styles.chartTrack}>
              <View style={[styles.chartBar, { height: `${Math.max(8, point.score)}%` }]} />
              <View style={[styles.chartDot, { bottom: `${Math.max(8, point.score)}%` }]} />
            </View>
            <Text style={styles.chartLabel}>{point.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PathStep({
  active,
  complete,
  href,
  label
}: {
  active: boolean;
  complete: boolean;
  href: Href;
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => [styles.pathStep, pressed && styles.pathStepPressed]}>
        <View style={styles.pathStepRow}>
          <View style={[styles.pathMarker, active && styles.pathMarkerActive, complete && styles.pathMarkerComplete]}>
            <Text style={[styles.pathMarkerText, active && styles.pathMarkerTextActive]}>{complete ? "OK" : ""}</Text>
          </View>
          <Text style={[styles.pathLabel, active && styles.pathLabelActive]}>{label}</Text>
          <Text style={styles.pathArrow}>{">"}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
    </View>
  );
}

function getProfileProgress(profile: ReturnType<typeof useAuth>["profile"]) {
  const fields = [profile?.name, profile?.email, profile?.height_cm, profile?.weight_kg, profile?.date_of_birth, profile?.gender];
  const completed = fields.filter((field) => field !== null && field !== undefined && field !== "").length;

  return Math.round((completed / fields.length) * 100);
}

function getSetupProgress({
  analysisCount,
  bikeCount,
  profileProgress
}: {
  analysisCount: number;
  bikeCount: number;
  profileProgress: number;
}) {
  return Math.min(100, Math.round(profileProgress * 0.45 + Math.min(bikeCount, 2) * 18 + Math.min(analysisCount, 3) * 7));
}

function getLatestScore(item: AnalysisHistoryItem | null) {
  return firstNumber(item?.summary?.overall_score, item?.frontKneeMeasurement?.overall_score, item?.summary?.comfort_score);
}

function getLatestAeroScore(item: AnalysisHistoryItem | null) {
  return firstNumber(item?.summary?.aero_score, item?.aeroScore?.final_aero_score);
}

function getLatestConfidenceScore(item: AnalysisHistoryItem | null) {
  return firstNumber(
    item?.summary?.confidence_score,
    item?.fitMeasurement?.confidence_score,
    item?.frontKneeMeasurement?.confidence_score
  );
}

function firstNumber(...values: (number | null | undefined)[]) {
  const value = values.find((candidate) => typeof candidate === "number" && Number.isFinite(candidate));

  return typeof value === "number" ? Math.round(value) : null;
}

function formatScore(score: number | null) {
  return score === null ? "--" : String(score);
}

function formatMillimeters(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value)} mm` : "--";
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(value));
}

function getBikeMeta(bike: Bike, t: (key: TranslationKey) => string) {
  const bikeType = t(bike.bike_type);
  const details = [bike.brand, bike.model, bike.size].filter(Boolean).join(" / ");

  return details ? `${bikeType} · ${details}` : bikeType;
}

function getRecommendationPreview(item: AnalysisHistoryItem, t: (key: TranslationKey) => string) {
  const primary = item.recommendations.find((recommendation) => recommendation.is_primary) ?? item.recommendations[0];

  return primary?.message ?? t("resultsDisclaimer");
}

function getRecentChartPoints(history: AnalysisHistoryItem[], locale: string) {
  const items = history.slice(0, 7).reverse();

  if (!items.length) {
    return Array.from({ length: 7 }, (_, index) => ({
      label: `${index + 1}`,
      score: 0,
      value: "--"
    }));
  }

  return items.map((item) => ({
    label: formatShortDate(item.session.created_at, locale),
    score: getLatestScore(item) ?? getLatestConfidenceScore(item) ?? 0,
    value: formatScore(getLatestScore(item) ?? getLatestConfidenceScore(item))
  }));
}

function formatShortDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(value));
}

function getPrimaryAction({ hasAnalysis, hasBike }: { hasAnalysis: boolean; hasBike: boolean }) {
  if (!hasBike) {
    return {
      body: "dashboardHeroAddBikeBody" as const,
      detail: "dashboardAddBikeDetail" as const,
      href: "/bikes/new" as Href,
      label: "addBike" as const,
      title: "dashboardAddBikeTitle" as const
    };
  }

  if (!hasAnalysis) {
    return {
      body: "dashboardHeroStartAnalysisBody" as const,
      detail: "dashboardStartAnalysisDetail" as const,
      href: "/analysis" as Href,
      label: "startBikeFit" as const,
      title: "sideFitAnalysis" as const
    };
  }

  return {
    body: "dashboardHeroContinueBody" as const,
    detail: "dashboardContinueDetail" as const,
    href: "/analysis/front-knee" as Href,
    label: "frontKneeStart" as const,
    title: "dashboardContinueTitle" as const
  };
}

function getToneStyle(tone: "accent" | "amber" | "blue" | "primary") {
  switch (tone) {
    case "accent":
      return styles.toneAccent;
    case "amber":
      return styles.toneAmber;
    case "blue":
      return styles.toneBlue;
    case "primary":
    default:
      return styles.tonePrimary;
  }
}

function getModuleIconStyle(tone: "accent" | "amber" | "blue" | "primary") {
  switch (tone) {
    case "accent":
      return styles.moduleIconAccent;
    case "amber":
      return styles.moduleIconAmber;
    case "blue":
      return styles.moduleIconBlue;
    case "primary":
    default:
      return styles.moduleIconPrimary;
  }
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  actionBody: {
    color: "#d5e3e7",
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  actionButtons: {
    flexWrap: "wrap"
  },
  actionCard: {
    backgroundColor: colors.graphite,
    borderColor: "#24343d",
    gap: spacing.md,
    overflow: "hidden"
  },
  actionTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 27,
    fontWeight: typography.weights.black,
    lineHeight: 32
  },
  analysisCard: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 280
  },
  bikeIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  bikeIconText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.black
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  cardHeaderCopy: {
    flex: 1,
    gap: spacing.xs
  },
  cardHeaderStacked: {
    flexDirection: "column"
  },
  cardLabel: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  cardLabelOnDark: {
    color: colors.aqua,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  cardMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.medium,
    lineHeight: 21
  },
  cardTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  chartBar: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: radii.round,
    borderTopRightRadius: radii.round,
    bottom: 0,
    left: "42%",
    minHeight: 8,
    position: "absolute",
    width: 10
  },
  chartColumn: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    height: "100%",
    justifyContent: "flex-end"
  },
  chartDot: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 3,
    height: 16,
    left: "50%",
    marginBottom: -8,
    marginLeft: -8,
    position: "absolute",
    width: 16
  },
  chartEmpty: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    gap: spacing.md,
    minHeight: 220,
    padding: spacing.xl
  },
  chartEmptyText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.medium,
    lineHeight: 21,
    maxWidth: 560
  },
  chartEmptyTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.black
  },
  chartGridLine: {
    backgroundColor: colors.border,
    height: 1,
    width: "100%"
  },
  chartGridLines: {
    bottom: 44,
    justifyContent: "space-between",
    left: 54,
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg
  },
  chartLabel: {
    color: colors.inkSubtle,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    minHeight: 16,
    textAlign: "center"
  },
  chartPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    minHeight: 250,
    overflow: "hidden",
    paddingBottom: spacing.md,
    paddingLeft: 54,
    paddingRight: spacing.lg,
    paddingTop: spacing.lg,
    position: "relative"
  },
  chartAxisLabel: {
    color: colors.inkSubtle,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  chartAxisLabels: {
    bottom: 44,
    justifyContent: "space-between",
    left: spacing.lg,
    position: "absolute",
    top: spacing.lg,
    width: 28
  },
  chartSeries: {
    flexDirection: "row",
    gap: spacing.md,
    height: 214,
    position: "relative"
  },
  chartTrack: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    position: "relative",
    width: "100%"
  },
  chartValue: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    minHeight: 16
  },
  contentGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  contentGridCompact: {
    flexDirection: "column"
  },
  dateText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  deltaText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  dualGrid: {
    flexDirection: "row",
    gap: spacing.lg
  },
  dualGridCompact: {
    flexDirection: "column"
  },
  error: {
    color: colors.danger,
    fontFamily,
    fontWeight: typography.weights.bold
  },
  heroActions: {
    flexWrap: "wrap"
  },
  heroBody: {
    color: "#d4e5e4",
    maxWidth: 650
  },
  heroCopy: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center"
  },
  heroImage: {
    height: "100%",
    width: "100%"
  },
  heroMetric: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radii.lg,
    bottom: spacing.lg,
    left: spacing.lg,
    padding: spacing.md,
    position: "absolute",
    width: 170
  },
  heroMetricHint: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    lineHeight: 15
  },
  heroMetricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  heroMetricValue: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 38,
    fontWeight: typography.weights.black,
    lineHeight: 42
  },
  heroOverlay: {
    backgroundColor: "rgba(6,63,61,0.18)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  heroPanel: {
    alignItems: "stretch",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing.xl,
    overflow: "hidden",
    padding: spacing.xxl,
    ...shadows.medium
  },
  heroPanelCompact: {
    flexDirection: "column"
  },
  heroTitle: {
    color: colors.white,
    fontSize: 36,
    lineHeight: 42,
    maxWidth: 700
  },
  heroVisual: {
    backgroundColor: colors.graphite,
    borderRadius: radii.lg,
    flex: 0.85,
    minHeight: 290,
    minWidth: 280,
    overflow: "hidden",
    position: "relative"
  },
  historyCard: {
    gap: spacing.lg
  },
  latestBikeCard: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 280
  },
  leftColumn: {
    flex: 1.15,
    gap: spacing.lg,
    width: "100%"
  },
  measureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 190,
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadows.soft
  },
  metricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  metricTone: {
    borderRadius: radii.round,
    height: 8,
    width: 44
  },
  metricValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  miniMeasure: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    flexBasis: 120,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  miniMeasureLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  miniMeasureValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black
  },
  moduleCopy: {
    flex: 1,
    gap: spacing.xs
  },
  moduleDetail: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 18
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  moduleIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  moduleIconAccent: {
    backgroundColor: colors.accentSoft
  },
  moduleIconAmber: {
    backgroundColor: colors.amberSoft
  },
  moduleIconBlue: {
    backgroundColor: "#e2edff"
  },
  moduleIconPrimary: {
    backgroundColor: colors.primarySoft
  },
  moduleIconText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black
  },
  moduleMetric: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  moduleTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 230,
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft
  },
  moduleTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.black
  },
  overviewCard: {
    gap: spacing.lg
  },
  pathCard: {
    gap: spacing.lg
  },
  pathArrow: {
    color: colors.primary,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black,
    marginLeft: "auto"
  },
  pathLabel: {
    color: colors.inkMuted,
    flex: 1,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold
  },
  pathLabelActive: {
    color: colors.ink
  },
  pathMarker: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.round,
    flexShrink: 0,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  pathMarkerActive: {
    backgroundColor: colors.primarySoft
  },
  pathMarkerComplete: {
    backgroundColor: colors.primary
  },
  pathMarkerText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  pathMarkerTextActive: {
    color: colors.white
  },
  pathStep: {
    alignSelf: "stretch",
    borderRadius: radii.md,
    marginHorizontal: -spacing.sm,
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: "100%"
  },
  pathStepPressed: {
    backgroundColor: colors.primaryMist
  },
  pathStepRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    width: "100%"
  },
  pathSteps: {
    gap: spacing.md
  },
  pressedTile: {
    opacity: 0.82,
    transform: [{ translateY: 1 }]
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    height: "100%"
  },
  progressTrack: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.round,
    height: 8,
    overflow: "hidden"
  },
  rightColumn: {
    flex: 0.85,
    gap: spacing.lg,
    width: "100%"
  },
  safetyNote: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  safetyNoteText: {
    color: "#cbd9dc",
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 19
  },
  scoreLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  scorePill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flexBasis: 100,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  scoreValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black
  },
  stack: {
    gap: spacing.xl
  },
  statusCopy: {
    flex: 1
  },
  statusDot: {
    backgroundColor: colors.borderStrong,
    borderRadius: radii.round,
    height: 10,
    marginTop: 4,
    width: 10
  },
  statusDotComplete: {
    backgroundColor: colors.primary
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  statusItem: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 180,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  statusItemComplete: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.primarySoft
  },
  statusLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  statusText: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  statusValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black
  },
  toneAccent: {
    backgroundColor: colors.accent
  },
  toneAmber: {
    backgroundColor: colors.amber
  },
  toneBlue: {
    backgroundColor: colors.blue
  },
  tonePrimary: {
    backgroundColor: colors.primary
  }
});
