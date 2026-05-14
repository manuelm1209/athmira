import { calculateAeroScore } from "@athmira/aero-engine";
import { createCoachSummary } from "@athmira/ai-engine";
import { calculateFitScore, generateFitRecommendations } from "@athmira/fit-engine";
import { analyzePoseFrame } from "@athmira/pose-engine";
import { getFitAnalysisResults } from "@athmira/supabase";
import type { FitMeasurement, Recommendation } from "@athmira/types";
import { Body, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export function ResultsScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const [savedResult, setSavedResult] = useState<Awaited<ReturnType<typeof getFitAnalysisResults>> | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadResults() {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextResult = await getFitAnalysisResults(sessionId);

        if (!cancelled) {
          setSavedResult(nextResult);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t("notFound"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [sessionId, t]);

  const result = useMemo(() => {
    const savedMeasurement = savedResult?.measurement;
    const savedAeroScore = savedResult?.aeroScore;
    const pose = analyzePoseFrame({ width: 1280, height: 720 });
    const angles = savedMeasurement ? anglesFromMeasurement(savedMeasurement) : pose.angles;
    const fitScore = calculateFitScore(savedMeasurement ?? angles);
    const aeroScore = savedAeroScore
      ? {
          estimatedFrontalArea: savedAeroScore.estimated_frontal_area ?? 0,
          torsoPositionScore: savedAeroScore.torso_position_score ?? 0,
          headPositionScore: savedAeroScore.head_position_score ?? 0,
          armCompactnessScore: savedAeroScore.arm_compactness_score ?? 0,
          stabilityScore: savedAeroScore.stability_score ?? 0,
          finalAeroScore: savedAeroScore.final_aero_score ?? 0
        }
      : calculateAeroScore(pose, angles);
    const recommendations = savedResult?.recommendations.length
      ? savedResult.recommendations.map(toFitRecommendation)
      : generateFitRecommendations(angles, null, profile, language);
    const coachSummary = createCoachSummary({ recommendations, language });

    return {
      aeroScore,
      angles,
      coachSummary,
      fitScore,
      measurement: savedMeasurement,
      pose,
      recommendations
    };
  }, [language, profile, savedResult]);

  const metrics = [
    { label: t("kneeAngle"), value: formatKneeMetric(result.measurement) },
    { label: t("hipAngle"), value: formatAngle(result.angles.hipAngle) },
    { label: t("torsoAngle"), value: formatAngle(result.angles.torsoAngle) },
    { label: t("elbowAngle"), value: formatAngle(result.angles.elbowAngle) },
    { label: t("aeroScore"), value: String(result.aeroScore.finalAeroScore) },
    { label: t("comfortScore"), value: String(result.fitScore.comfortScore) },
    { label: t("confidenceScore"), value: `${result.fitScore.confidenceScore}%` }
  ];

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("fitResults")}</Heading>
          <Body>{t("resultsDisclaimer")}</Body>
          {sessionId ? <Text style={styles.sessionId}>Session {sessionId}</Text> : null}
          {loading ? <Text style={styles.sessionId}>Loading saved analysis...</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <Card key={metric.label} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
            </Card>
          ))}
        </View>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>{t("aiSummary")}</Text>
          <Body>{result.coachSummary}</Body>
          <Body>{t("windTunnelNote")}</Body>
          <Body>{t("educationalNote")}</Body>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>{t("recommendations")}</Text>
          {result.recommendations.map((recommendation) => (
            <View key={`${recommendation.category}-${recommendation.message}`} style={styles.recommendation}>
              <Text style={styles.recommendationTitle}>
                {recommendation.priority.toUpperCase()} / {recommendation.category.replace("_", " ")}
              </Text>
              <Text style={styles.recommendationText}>{recommendation.message}</Text>
            </View>
          ))}
        </Card>
        <Inline>
          <LinkButton href="/analysis">{t("startBikeFit")}</LinkButton>
          <LinkButton href="/dashboard" variant="secondary">
            {t("dashboard")}
          </LinkButton>
        </Inline>
      </View>
    </Screen>
  );
}

function anglesFromMeasurement(measurement: FitMeasurement) {
  return {
    elbowAngle: measurement.elbow_angle_avg ?? undefined,
    hipAngle: measurement.hip_angle_avg ?? undefined,
    kneeAngle: measurement.knee_angle_max ?? measurement.knee_angle_min ?? undefined,
    shoulderAngle: measurement.shoulder_angle_avg ?? undefined,
    torsoAngle: measurement.torso_angle_avg ?? undefined
  };
}

function toFitRecommendation(recommendation: Recommendation) {
  return {
    adjustmentMm: recommendation.adjustment_mm ?? undefined,
    category: recommendation.category,
    confidenceScore: recommendation.confidence_score ?? 0,
    message: recommendation.message,
    priority: recommendation.priority
  };
}

function formatAngle(value?: number) {
  return typeof value === "number" ? `${Math.round(value)} deg` : "--";
}

function formatKneeMetric(measurement?: FitMeasurement | null) {
  if (measurement?.knee_angle_min && measurement.knee_angle_max) {
    return `${Math.round(measurement.knee_angle_min)}-${Math.round(measurement.knee_angle_max)} deg`;
  }

  return formatAngle(measurement?.knee_angle_max ?? measurement?.knee_angle_min ?? undefined);
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl
  },
  header: {
    gap: spacing.sm
  },
  sessionId: {
    color: colors.inkMuted,
    fontSize: 12
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800"
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  metricCard: {
    flexBasis: 160,
    flexGrow: 1,
    gap: spacing.sm
  },
  metricLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900"
  },
  summaryCard: {
    gap: spacing.md
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  recommendation: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md
  },
  recommendationTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  recommendationText: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 21
  }
});
