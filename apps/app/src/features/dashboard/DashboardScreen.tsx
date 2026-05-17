import { getLatestBike } from "@athmira/supabase";
import type { Bike } from "@athmira/types";
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
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { visualAssets } from "@/lib/visual-assets";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

const moduleKeys = ["bikeFit", "aeroAnalysis", "nutrition", "trainingPlan", "wearables"] as const;

export function DashboardScreen() {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const [latestBike, setLatestBike] = useState<Bike | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadLatestBike() {
      try {
        const bike = await getLatestBike(currentUser.id);

        if (!cancelled) {
          setLatestBike(bike);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      }
    }

    loadLatestBike();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const athleteName = profile?.name ? `, ${profile.name}` : "";
  const bikeMeta =
    latestBike && ([latestBike.brand, latestBike.model, latestBike.size].filter(Boolean).join(" / ") || latestBike.bike_type);

  return (
    <Screen maxWidth={1240}>
      <View style={styles.stack}>
        <FadeInView style={[styles.heroPanel, compact && styles.heroPanelCompact]}>
          <View style={styles.heroCopy}>
            <Heading style={styles.heroTitle}>{`${t("greeting")}${athleteName}`}</Heading>
            <Body style={styles.heroBody}>{t("analysisIntro")}</Body>
            <Inline>
              <LinkButton href="/analysis">{t("startBikeFit")}</LinkButton>
              <LinkButton href="/bikes/new" variant="secondary">
                {t("addBike")}
              </LinkButton>
            </Inline>
          </View>
          <View style={styles.heroImagePanel}>
            <Image
              accessibilityLabel="Cyclist training on track"
              resizeMode="cover"
              source={{ uri: visualAssets.aeroTrack }}
              style={styles.heroImage}
            />
            <View style={styles.imageMetric}>
              <Text style={styles.imageMetricLabel}>{t("dashboardFitReadiness")}</Text>
              <Text style={styles.imageMetricValue}>82</Text>
            </View>
          </View>
        </FadeInView>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FadeInView delayMs={100} style={styles.metricsGrid}>
          <PerformanceMetric label={t("dashboardFitReadiness")} tone="primary" value="82" />
          <PerformanceMetric label={t("aeroScore")} tone="accent" value="76" />
          <PerformanceMetric label={t("confidenceScore")} tone="blue" value="91%" />
          <PerformanceMetric label={t("dashboardPressurePlan")} tone="amber" value="82" />
        </FadeInView>

        <View style={[styles.contentGrid, compact && styles.contentGridCompact]}>
          <FadeInView delayMs={160} style={styles.leftColumn}>
            <Card style={styles.latestCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>{t("latestBike")}</Text>
                  <Text style={styles.cardTitle}>{latestBike?.name ?? t("noBikes")}</Text>
                </View>
                <View style={styles.bikeIcon}>
                  <Text style={styles.bikeIconText}>A</Text>
                </View>
              </View>
              {latestBike ? <Text style={styles.cardMeta}>{bikeMeta}</Text> : <Body>{t("bikeProfile")}</Body>}
              <View style={styles.readinessBlock}>
                <View style={styles.readinessHeader}>
                  <Text style={styles.readinessTitle}>{t("dashboardProgressSnapshot")}</Text>
                  <Text style={styles.readinessValue}>82%</Text>
                </View>
                <ProgressBar progress={82} />
              </View>
            </Card>

            <Card style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>{t("dashboardWeeklyLoad")}</Text>
                  <Text style={styles.cardTitle}>{t("analysisHistory")}</Text>
                </View>
                <Text style={styles.deltaText}>+12</Text>
              </View>
              <View style={styles.chart}>
                {[42, 64, 58, 74, 69, 88, 78].map((height, index) => (
                  <View key={`${height}-${index}`} style={styles.chartColumn}>
                    <View style={[styles.chartBar, { height }]} />
                  </View>
                ))}
              </View>
            </Card>
          </FadeInView>

          <FadeInView delayMs={220} style={styles.rightColumn}>
            <Card style={styles.actionCard}>
              <Text style={styles.cardLabel}>{t("dashboardNextBestAction")}</Text>
              <Text style={styles.actionTitle}>{t("sideFitAnalysis")}</Text>
              <Text style={styles.actionBody}>{t("educationalNote")}</Text>
              <Inline>
                <LinkButton href="/analysis">{t("dashboardQuickStart")}</LinkButton>
                <LinkButton href="/tire-pressure" variant="ghost">
                  {t("tirePressureNav")}
                </LinkButton>
              </Inline>
            </Card>

            <View style={styles.moduleGrid}>
              {moduleKeys.map((key, index) => (
                <ModuleTile key={key} label={t(key)} progress={index === 0 ? 72 : 36 + index * 9} />
              ))}
            </View>
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

function ModuleTile({ label, progress }: { label: string; progress: number }) {
  return (
    <View style={styles.moduleTile}>
      <Text style={styles.moduleTitle}>{label}</Text>
      <ProgressBar progress={progress} small />
    </View>
  );
}

function ProgressBar({ progress, small }: { progress: number; small?: boolean }) {
  return (
    <View style={[styles.progressTrack, small && styles.progressTrackSmall]}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
    </View>
  );
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

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl
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
  heroCopy: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: "center"
  },
  heroTitle: {
    color: colors.white,
    maxWidth: 680
  },
  heroBody: {
    color: "#d4e5e4",
    maxWidth: 640
  },
  heroImagePanel: {
    backgroundColor: colors.graphite,
    borderRadius: radii.lg,
    flex: 0.9,
    minHeight: 280,
    minWidth: 280,
    overflow: "hidden",
    position: "relative"
  },
  heroImage: {
    height: "100%",
    opacity: 0.94,
    width: "100%"
  },
  imageMetric: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.lg,
    bottom: spacing.lg,
    left: spacing.lg,
    padding: spacing.md,
    position: "absolute"
  },
  imageMetricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  imageMetricValue: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 34,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  error: {
    color: colors.danger,
    fontFamily,
    fontWeight: typography.weights.bold
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
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
  metricTone: {
    borderRadius: radii.round,
    height: 8,
    width: 44
  },
  tonePrimary: {
    backgroundColor: colors.primary
  },
  toneAccent: {
    backgroundColor: colors.accent
  },
  toneBlue: {
    backgroundColor: colors.blue
  },
  toneAmber: {
    backgroundColor: colors.amber
  },
  metricValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  metricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  contentGrid: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg
  },
  contentGridCompact: {
    flexDirection: "column"
  },
  leftColumn: {
    flex: 1.1,
    gap: spacing.lg,
    width: "100%"
  },
  rightColumn: {
    flex: 0.9,
    gap: spacing.lg,
    width: "100%"
  },
  latestCard: {
    gap: spacing.lg
  },
  chartCard: {
    gap: spacing.lg
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  cardLabel: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  cardTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  cardMeta: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold
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
  readinessBlock: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    gap: spacing.md,
    padding: spacing.lg
  },
  readinessHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  readinessTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  readinessValue: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  progressTrack: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.round,
    height: 10,
    overflow: "hidden"
  },
  progressTrackSmall: {
    height: 7
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    height: "100%"
  },
  deltaText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  chart: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing.md,
    height: 180,
    justifyContent: "space-between",
    padding: spacing.lg
  },
  chartColumn: {
    flex: 1,
    justifyContent: "flex-end"
  },
  chartBar: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    minHeight: 24
  },
  actionCard: {
    backgroundColor: colors.graphite,
    borderColor: "#24343d",
    gap: spacing.md
  },
  actionTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 26,
    fontWeight: typography.weights.black,
    lineHeight: 32
  },
  actionBody: {
    color: "#cbd9dc",
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  moduleTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 170,
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.soft
  },
  moduleTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black
  }
});
