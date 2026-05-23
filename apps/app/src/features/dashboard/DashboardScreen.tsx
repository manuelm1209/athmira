import { listAnalysisHistory, listBikes } from "@athmira/supabase";
import type { AnalysisHistoryItem, Bike } from "@athmira/types";
import { AppScreen as Screen } from "@/components/AppScreen";
import { Body, Card, FadeInView, Heading, Inline, colors, radii, shadows, spacing, typography } from "@athmira/ui";
import type { Href } from "expo-router";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import type { TranslationKey } from "@/i18n";
import { getBikeImage } from "@/lib/bike-images";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

type DashboardData = {
  bikes: Bike[];
  history: AnalysisHistoryItem[];
};

type DashboardModule = {
  code: string;
  detail: TranslationKey;
  href: Href;
  label: TranslationKey;
  metric: string;
  tone: "accent" | "amber" | "blue" | "primary";
};

type PathStepData = {
  complete: boolean;
  href: Href;
  label: string;
  meta: string;
};

export function DashboardScreen() {
  const { profile, user } = useAuth();
  const { t, language } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 980;
  const narrow = width < 640;
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
  const primaryAction = getPrimaryAction({ hasAnalysis: data.history.length > 0, hasBike: data.bikes.length > 0 });
  const latestResultsHref = latestAnalysis
    ? ({ pathname: "/analysis/results", params: { sessionId: latestAnalysis.session.id } } as Href)
    : ("/analysis" as Href);
  const latestBikeHref = latestBike ? (`/bikes/${latestBike.id}` as Href) : ("/bikes/new" as Href);

  const modules = useMemo<DashboardModule[]>(
    () => [
      {
        code: "FIT",
        detail: "dashboardBikeFitDetail",
        href: "/analysis",
        label: "bikeFit",
        metric: latestScore === null ? t("dashboardReady") : `${latestScore}/100`,
        tone: "primary"
      },
      {
        code: "KNEE",
        detail: "dashboardFrontKneeDetail",
        href: "/analysis/front-knee",
        label: "frontKneeTitle",
        metric: latestAnalysis?.frontKneeMeasurement?.overall_score
          ? `${Math.round(latestAnalysis.frontKneeMeasurement.overall_score)}/100`
          : t("dashboardReady"),
        tone: "blue"
      },
      {
        code: "FUEL",
        detail: "dashboardNutritionDetail",
        href: "/nutrition",
        label: "nutrition",
        metric: profile?.weight_kg ? `${profile.weight_kg} kg` : t("dashboardProfileNeeded"),
        tone: "accent"
      },
      {
        code: "PSI",
        detail: "dashboardPressureDetail",
        href: "/tire-pressure",
        label: "tirePressureNav",
        metric: latestBike ? t(latestBike.bike_type) : t("dashboardBikeNeeded"),
        tone: "amber"
      }
    ],
    [latestAnalysis, latestBike, latestScore, profile?.weight_kg, t]
  );

  const pathSteps: PathStepData[] = [
    {
      complete: profileProgress >= 80,
      href: "/profile",
      label: t("dashboardStepProfile"),
      meta: `${profileProgress}%`
    },
    {
      complete: data.bikes.length > 0,
      href: data.bikes.length ? "/bikes" : "/bikes/new",
      label: t("dashboardStepBike"),
      meta: data.bikes.length ? `${data.bikes.length}/1` : t("dashboardPending")
    },
    {
      complete: data.history.length > 0,
      href: latestResultsHref,
      label: t("dashboardStepCamera"),
      meta: data.history.length ? `${data.history.length}` : t("dashboardPending")
    },
    {
      complete: Boolean(profile?.weight_kg),
      href: "/nutrition",
      label: t("dashboardStepNutrition"),
      meta: profile?.weight_kg ? t("dashboardComplete") : t("dashboardPending")
    }
  ];
  const currentPathIndex = pathSteps.findIndex((step) => !step.complete);

  return (
    <Screen maxWidth={1180}>
      <View style={[styles.stack, narrow && styles.stackMobile]}>
        <FadeInView style={[styles.heroPanel, compact && styles.heroPanelCompact, narrow && styles.heroPanelMobile]}>
          <View style={styles.heroCopy}>
            <Heading style={[styles.heroTitle, narrow && styles.heroTitleMobile]}>{`${t("greeting")}${athleteName}`}</Heading>
            <Body style={[styles.heroBody, narrow && styles.heroBodyMobile]}>{t(primaryAction.body)}</Body>

            <View style={[styles.nextAction, narrow && styles.nextActionMobile]}>
              <View style={styles.nextActionCopy}>
                <Text style={styles.nextActionLabel}>{t("dashboardNextBestAction")}</Text>
                <Text style={styles.nextActionTitle}>{t(primaryAction.title)}</Text>
                <Text style={styles.nextActionDetail}>{t(primaryAction.detail)}</Text>
              </View>
              <Inline style={styles.heroActions}>
                <LinkButton href={primaryAction.href}>{t(primaryAction.label)}</LinkButton>
              </Inline>
            </View>
          </View>

          <Card style={[styles.snapshotCard, compact && styles.snapshotCardCompact]}>
            <View style={styles.snapshotHeader}>
              <Text style={styles.sectionTitle}>{t("dashboardQuickSummary")}</Text>
              <Text style={styles.syncText}>{loading ? t("dashboardLoading") : t("dashboardSynced")}</Text>
            </View>
            <View style={[styles.snapshotGrid, narrow && styles.snapshotGridMobile]}>
              <SnapshotMetric
                detail={profileProgress >= 80 ? t("dashboardComplete") : t("dashboardPending")}
                label={t("profile")}
                tone="primary"
                value={`${profileProgress}%`}
              />
              <SnapshotMetric
                detail={latestBike?.name ?? t("dashboardBikeNeeded")}
                label={t("bikes")}
                tone="blue"
                value={String(data.bikes.length)}
              />
              <SnapshotMetric
                detail={latestAnalysis ? formatDate(latestAnalysis.session.created_at, dateLocale) : t("dashboardNoData")}
                label={t("dashboardAnalysisShort")}
                tone="accent"
                value={String(data.history.length)}
              />
            </View>
            <View style={styles.setupLine}>
              <View style={styles.setupLineHeader}>
                <Text style={styles.setupLineLabel}>{t("dashboardSetupScore")}</Text>
                <Text style={styles.setupLineValue}>{setupProgress}%</Text>
              </View>
              <ProgressBar progress={setupProgress} />
            </View>
          </Card>
        </FadeInView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={[styles.contentGrid, compact && styles.contentGridCompact]}>
          <FadeInView delayMs={120} style={[styles.mainColumn, !compact && styles.mainColumnDesktop]}>
            <Card style={styles.featurePanel}>
              <View style={[styles.cardHeader, narrow && styles.cardHeaderStacked]}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.sectionTitle}>{t("dashboardFeatures")}</Text>
                  <Text style={styles.sectionHint}>{t("dashboardFeaturesHint")}</Text>
                </View>
                <LinkButton href="/analysis" variant="secondary">
                  {t("startBikeFit")}
                </LinkButton>
              </View>

              <View style={styles.moduleGrid}>
                {modules.map((module) => (
                  <ModuleTile compact={compact} key={module.label} module={module} narrow={narrow} />
                ))}
              </View>
            </Card>

            <PrimaryBikeCard bike={latestBike} narrow={narrow} />
          </FadeInView>

          <FadeInView delayMs={180} style={[styles.sideColumn, !compact && styles.sideColumnDesktop]}>
            <Card style={styles.recentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.sectionTitle}>{t("dashboardRecentActivity")}</Text>
                  <Text style={styles.sectionHint}>{t("dashboardBasedOnYourData")}</Text>
                </View>
              </View>

              <View style={styles.recentRows}>
                <RecentRow
                  code="BIKE"
                  detail={latestBike ? getBikeMeta(latestBike, t) : t("dashboardNoBikeBody")}
                  href={latestBikeHref}
                  label={t("latestBike")}
                  metric={data.bikes.length ? t("dashboardComplete") : t("dashboardPending")}
                  tone="primary"
                  title={latestBike?.name ?? t("dashboardNoBikeTitle")}
                />
                <RecentRow
                  code="FIT"
                  detail={
                    latestAnalysis
                      ? getRecommendationPreview(latestAnalysis, t)
                      : t("noAnalysisHistory")
                  }
                  href={latestResultsHref}
                  label={t("dashboardLatestAnalysis")}
                  metric={latestAnalysis ? `${formatScore(latestScore)}/100` : t("dashboardPending")}
                  tone="blue"
                  title={latestAnalysis?.summary?.title ?? t("dashboardNoAnalysisTitle")}
                />
              </View>

              <View style={styles.scoreRow}>
                <ScoreChip label={t("aeroAnalysis")} value={formatScore(latestAeroScore)} />
                <ScoreChip label={t("confidenceScore")} value={formatScore(confidenceScore)} />
              </View>
            </Card>

            <Card style={styles.pathCard}>
              <View style={styles.pathHeader}>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.sectionTitle}>{t("dashboardYourPath")}</Text>
                  <Text style={styles.sectionHint}>{t("dashboardBuildFoundation")}</Text>
                </View>
                <Text style={styles.pathProgress}>{setupProgress}%</Text>
              </View>

              <View style={styles.pathSteps}>
                {pathSteps.map((step, index) => (
                  <PathStep
                    complete={step.complete}
                    current={currentPathIndex === index}
                    href={step.href}
                    key={step.label}
                    label={step.label}
                    meta={step.meta}
                  />
                ))}
              </View>

              <View style={styles.safetyNote}>
                <Text style={styles.safetyNoteText}>{t("educationalNote")}</Text>
              </View>
            </Card>
          </FadeInView>
        </View>
      </View>
    </Screen>
  );
}

function SnapshotMetric({
  detail,
  label,
  tone,
  value
}: {
  detail: string;
  label: string;
  tone: "accent" | "blue" | "primary";
  value: string;
}) {
  return (
    <View style={styles.snapshotMetric}>
      <View style={[styles.snapshotDot, getToneStyle(tone)]} />
      <Text style={styles.snapshotValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.snapshotLabel}>
        {label}
      </Text>
      <Text numberOfLines={1} style={styles.snapshotDetail}>
        {detail}
      </Text>
    </View>
  );
}

function ModuleTile({ compact, module, narrow }: { compact: boolean; module: DashboardModule; narrow: boolean }) {
  const { t } = useLanguage();

  return (
    <Link href={module.href} asChild>
      <Pressable
        accessibilityRole="link"
        style={StyleSheet.flatten([
          styles.moduleTile,
          compact && styles.moduleTileCompact,
          narrow && styles.moduleTileMobile
        ])}
      >
        <View style={[styles.moduleIcon, getModuleIconStyle(module.tone)]}>
          <Text style={styles.moduleIconText}>{module.code}</Text>
        </View>
        <View style={styles.moduleCopy}>
          <Text numberOfLines={2} style={styles.moduleTitle}>
            {t(module.label)}
          </Text>
          <Text numberOfLines={3} style={styles.moduleDetail}>
            {t(module.detail)}
          </Text>
        </View>
        <View style={styles.moduleFooter}>
          <Text numberOfLines={1} style={styles.moduleMetric}>
            {module.metric}
          </Text>
          <Text style={styles.moduleArrow}>{">"}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function PrimaryBikeCard({ bike, narrow }: { bike: Bike | null; narrow: boolean }) {
  const { t } = useLanguage();

  if (!bike) {
    return (
      <Card style={styles.bikeCard}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.sectionTitle}>{t("dashboardPrimaryBike")}</Text>
          <Text style={styles.sectionHint}>{t("dashboardNoBikeBody")}</Text>
        </View>
        <Inline>
          <LinkButton href="/bikes/new">{t("addBike")}</LinkButton>
        </Inline>
      </Card>
    );
  }

  const specs: { label: string; value: string }[] = [
    { label: t("brand"), value: bike.brand ?? "—" },
    { label: t("model"), value: bike.model ?? "—" },
    { label: t("size"), value: bike.size ?? "—" },
    { label: t("saddleHeight"), value: formatMm(bike.saddle_height_mm) },
    { label: t("saddleSetback"), value: formatMm(bike.saddle_setback_mm) },
    { label: t("stemLength"), value: formatMm(bike.stem_length_mm) },
    { label: t("crankLength"), value: formatMm(bike.crank_length_mm) },
    { label: t("handlebarWidth"), value: formatMm(bike.handlebar_width_mm) }
  ];

  return (
    <Card style={styles.bikeCard}>
      <View style={[styles.cardHeader, narrow && styles.cardHeaderStacked]}>
        <View style={styles.cardHeaderCopy}>
          <Text style={styles.sectionTitle}>{t("dashboardPrimaryBike")}</Text>
          <Text style={styles.sectionHint}>{t("dashboardPrimaryBikeHint")}</Text>
        </View>
        <LinkButton href={{ pathname: "/bikes/[id]", params: { id: bike.id } }} variant="secondary">
          {t("dashboardManageBike")}
        </LinkButton>
      </View>

      <View style={[styles.bikeBody, narrow && styles.bikeBodyMobile]}>
        <View style={[styles.bikeImageFrame, narrow && styles.bikeImageFrameMobile]}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={getBikeImage(bike.bike_type)}
            style={styles.bikeImage}
          />
        </View>
        <View style={styles.bikeInfo}>
          <Text style={styles.bikeType}>{t(bike.bike_type)}</Text>
          <Text style={styles.bikeName}>{bike.name}</Text>
          <View style={styles.specsGrid}>
            {specs.map((spec) => (
              <View key={spec.label} style={styles.specItem}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text numberOfLines={1} style={styles.specValue}>
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Card>
  );
}

function formatMm(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value} mm` : "—";
}

function RecentRow({
  code,
  detail,
  href,
  label,
  metric,
  title,
  tone
}: {
  code: string;
  detail: string;
  href: Href;
  label: string;
  metric: string;
  title: string;
  tone: "blue" | "primary";
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={styles.recentRow}>
        <View style={[styles.recentIcon, getModuleIconStyle(tone)]}>
          <Text style={styles.recentIconText}>{code}</Text>
        </View>
        <View style={styles.recentCopy}>
          <Text style={styles.recentLabel}>{label}</Text>
          <Text numberOfLines={1} style={styles.recentTitle}>
            {title}
          </Text>
          <Text numberOfLines={2} style={styles.recentDetail}>
            {detail}
          </Text>
        </View>
        <View style={styles.recentMeta}>
          <Text numberOfLines={1} style={styles.recentMetric}>
            {metric}
          </Text>
          <Text style={styles.rowArrow}>{">"}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function ScoreChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scoreChip}>
      <Text numberOfLines={1} style={styles.scoreChipLabel}>
        {label}
      </Text>
      <Text style={styles.scoreChipValue}>{value}</Text>
    </View>
  );
}

function PathStep({
  complete,
  current,
  href,
  label,
  meta
}: {
  complete: boolean;
  current: boolean;
  href: Href;
  label: string;
  meta: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        style={StyleSheet.flatten([
          styles.pathStep,
          current && styles.pathStepCurrent
        ])}
      >
        <View style={[styles.pathMarker, complete && styles.pathMarkerComplete, current && styles.pathMarkerCurrent]}>
          <Text style={[styles.pathMarkerText, complete && styles.pathMarkerTextComplete]}>{complete ? "✓" : ""}</Text>
        </View>
        <Text numberOfLines={1} style={[styles.pathLabel, complete && styles.pathLabelComplete]}>
          {label}
        </Text>
        <Text numberOfLines={1} style={styles.pathMeta}>
          {meta}
        </Text>
        <Text style={styles.rowArrow}>{">"}</Text>
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

function getToneStyle(tone: "accent" | "blue" | "primary") {
  switch (tone) {
    case "accent":
      return styles.toneAccent;
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
  bikeBody: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg
  },
  bikeBodyMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  bikeCard: {
    gap: spacing.lg,
    width: "100%"
  },
  bikeImage: {
    height: "100%",
    width: "100%"
  },
  bikeImageFrame: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 260,
    flexGrow: 0,
    flexShrink: 0,
    height: 170,
    justifyContent: "center",
    overflow: "hidden",
    padding: spacing.sm
  },
  bikeImageFrameMobile: {
    flexBasis: "auto",
    height: 200,
    width: "100%"
  },
  bikeInfo: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0
  },
  bikeName: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 26
  },
  bikeType: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  specItem: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    flexBasis: "30%",
    flexGrow: 1,
    gap: 2,
    minWidth: 110,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  specLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.black,
    letterSpacing: 0.2,
    textTransform: "uppercase"
  },
  specValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
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
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.lg
  },
  contentGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  contentGridCompact: {
    flexDirection: "column"
  },
  error: {
    color: colors.danger,
    fontFamily,
    fontWeight: typography.weights.bold
  },
  featurePanel: {
    gap: spacing.xl,
    width: "100%"
  },
  heroActions: {
    flexShrink: 0,
    flexWrap: "wrap"
  },
  heroBody: {
    color: colors.inkMuted,
    maxWidth: 680
  },
  heroBodyMobile: {
    fontSize: 15,
    lineHeight: 22
  },
  heroCopy: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center"
  },
  heroPanel: {
    alignItems: "stretch",
    backgroundColor: "#eef8f8",
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xl,
    overflow: "hidden",
    padding: spacing.xxl,
    ...shadows.soft
  },
  heroPanelCompact: {
    flexDirection: "column"
  },
  heroPanelMobile: {
    borderRadius: radii.lg,
    gap: spacing.lg,
    padding: spacing.lg
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 44,
    maxWidth: 720
  },
  heroTitleMobile: {
    fontSize: 30,
    lineHeight: 36
  },
  mainColumn: {
    width: "100%"
  },
  mainColumnDesktop: {
    flex: 1.35
  },
  moduleArrow: {
    color: colors.primary,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  moduleCopy: {
    flex: 1,
    gap: spacing.sm
  },
  moduleDetail: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 19
  },
  moduleFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  moduleIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  moduleIconAccent: {
    backgroundColor: colors.accentSoft
  },
  moduleIconAmber: {
    backgroundColor: colors.amberSoft
  },
  moduleIconBlue: {
    backgroundColor: "#e3efff"
  },
  moduleIconPrimary: {
    backgroundColor: colors.primarySoft
  },
  moduleIconText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  moduleMetric: {
    color: colors.primaryDark,
    flex: 1,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  moduleTile: {
    backgroundColor: "#fbfefe",
    borderColor: "#cfe2e3",
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: "46%",
    flexGrow: 1,
    gap: spacing.lg,
    justifyContent: "space-between",
    minHeight: 178,
    minWidth: 220,
    padding: spacing.lg,
    ...shadows.soft
  },
  moduleTileCompact: {
    flexBasis: "46%",
    minHeight: 178
  },
  moduleTileMobile: {
    flexBasis: "46%",
    gap: spacing.md,
    minHeight: 168,
    minWidth: 142,
    padding: spacing.md
  },
  moduleTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black,
    lineHeight: 23
  },
  nextAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
    maxWidth: 700,
    padding: spacing.lg
  },
  nextActionCopy: {
    flex: 1,
    gap: spacing.xs
  },
  nextActionDetail: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 19
  },
  nextActionLabel: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  nextActionMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  nextActionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 21,
    fontWeight: typography.weights.black,
    lineHeight: 27
  },
  pathCard: {
    gap: spacing.lg,
    width: "100%"
  },
  pathHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  pathLabel: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold
  },
  pathLabelComplete: {
    color: colors.ink
  },
  pathMarker: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.borderStrong,
    borderRadius: radii.round,
    borderWidth: 1,
    flexShrink: 0,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  pathMarkerComplete: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  pathMarkerCurrent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  pathMarkerText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black,
    lineHeight: 18
  },
  pathMarkerTextComplete: {
    color: colors.primaryDark
  },
  pathMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    maxWidth: 72,
    textAlign: "right"
  },
  pathProgress: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.black,
    lineHeight: 30
  },
  pathStep: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  pathStepCurrent: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.primarySoft
  },
  pathStepPressed: {
    opacity: 0.84,
    transform: [{ translateY: 1 }]
  },
  pathSteps: {
    gap: spacing.sm
  },
  pressedTile: {
    opacity: 0.84,
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
  recentCard: {
    gap: spacing.lg,
    width: "100%"
  },
  recentCopy: {
    flex: 1,
    gap: spacing.xs
  },
  recentDetail: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 18
  },
  recentIcon: {
    alignItems: "center",
    borderRadius: radii.md,
    flexShrink: 0,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  recentIconText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.black,
    letterSpacing: 0
  },
  recentLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  recentMeta: {
    alignItems: "flex-end",
    gap: spacing.xs,
    justifyContent: "center",
    maxWidth: 76
  },
  recentMetric: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  recentRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 96,
    padding: spacing.md
  },
  recentRowPressed: {
    backgroundColor: colors.primaryMist
  },
  recentRows: {
    gap: spacing.sm
  },
  recentTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black,
    lineHeight: 21
  },
  rowArrow: {
    color: colors.ink,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  safetyNote: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  safetyNoteText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.medium,
    lineHeight: 18
  },
  scoreChip: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.primarySoft,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 132,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  scoreChipLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  scoreChipValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 26
  },
  scoreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sectionHint: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.medium,
    lineHeight: 20
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  setupLine: {
    gap: spacing.sm
  },
  setupLineHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  setupLineLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  setupLineValue: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  sideColumn: {
    gap: spacing.lg,
    width: "100%"
  },
  sideColumnDesktop: {
    flex: 0.9
  },
  snapshotCard: {
    flex: 0.82,
    gap: spacing.lg,
    minWidth: 360,
    padding: spacing.xl
  },
  snapshotCardCompact: {
    flex: 1,
    minWidth: 0
  },
  snapshotDetail: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.medium,
    maxWidth: 104,
    textAlign: "center"
  },
  snapshotDot: {
    borderRadius: radii.round,
    height: 8,
    width: 42
  },
  snapshotGrid: {
    flexDirection: "row",
    gap: spacing.md
  },
  snapshotGridMobile: {
    flexWrap: "wrap"
  },
  snapshotHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  snapshotLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    textAlign: "center"
  },
  snapshotMetric: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    flex: 1,
    gap: spacing.xs,
    minWidth: 96,
    padding: spacing.md
  },
  snapshotValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.black,
    lineHeight: 32
  },
  stack: {
    gap: spacing.xl
  },
  stackMobile: {
    gap: spacing.lg
  },
  syncText: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  toneAccent: {
    backgroundColor: colors.accent
  },
  toneBlue: {
    backgroundColor: colors.blue
  },
  tonePrimary: {
    backgroundColor: colors.primary
  }
});
