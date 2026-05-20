import { calculateAeroScore } from "@athmira/aero-engine";
import { createCoachSummary } from "@athmira/ai-engine";
import { calculateFitScore, generateFitRecommendations } from "@athmira/fit-engine";
import { analyzePoseFrame } from "@athmira/pose-engine";
import { getFitAnalysisResults, listAnalysisHistory } from "@athmira/supabase";
import type { AnalysisHistoryItem, FitMeasurement, FitRecommendation, FrontKneeMeasurement, Recommendation } from "@athmira/types";
import { Body, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import type { TranslationKey } from "@/i18n";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export function ResultsScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const [savedResult, setSavedResult] = useState<Awaited<ReturnType<typeof getFitAnalysisResults>> | null>(null);
  const [previousResult, setPreviousResult] = useState<AnalysisHistoryItem | null>(null);
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
        const history =
          nextResult.session?.user_id && nextResult.session?.bike_id
            ? await listAnalysisHistory({ bikeId: nextResult.session.bike_id, limit: 10, userId: nextResult.session.user_id })
            : [];
        const currentType =
          nextResult.summary?.analysis_type ?? (nextResult.session?.camera_angle === "front" ? "front_knee_tracking" : "side_bike_fit");
        const previous = history.find((item) => item.session.id !== sessionId && getHistoryType(item) === currentType) ?? null;

        if (!cancelled) {
          setSavedResult(nextResult);
          setPreviousResult(previous);
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

  const frontKneeMeasurement = savedResult?.frontKneeMeasurement;
  const isFrontKneeResult = Boolean(frontKneeMeasurement);
  const metrics = frontKneeMeasurement
    ? getFrontKneeMetrics(frontKneeMeasurement, t)
    : [
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
          <Heading>{isFrontKneeResult ? t("frontKneeResults") : t("fitResults")}</Heading>
          <Body>{isFrontKneeResult ? t("frontKneeDisclaimer") : t("resultsDisclaimer")}</Body>
          <Body>{getBikeFitDisclaimer(language)}</Body>
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
        {previousResult ? (
          <Card style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>{t("previousComparison")}</Text>
            <View style={styles.metricsGrid}>
              <MetricCard
                label={isFrontKneeResult ? t("frontKneeOverallScore") : t("comfortScore")}
                value={formatScore(getCurrentScore(savedResult, isFrontKneeResult))}
              />
              <MetricCard label={language === "es" ? "Anterior" : "Previous"} value={formatScore(getPrimaryScore(previousResult))} />
              <MetricCard
                label={language === "es" ? "Cambio" : "Change"}
                value={formatDelta(getScoreDelta(getCurrentScore(savedResult, isFrontKneeResult), getPrimaryScore(previousResult)))}
              />
            </View>
          </Card>
        ) : null}
        {isFrontKneeResult ? null : (
          <Card style={styles.summaryCard}>
            <Text style={styles.sectionLabel}>{t("aiSummary")}</Text>
            <Body>{result.coachSummary}</Body>
            <Body>{t("windTunnelNote")}</Body>
            <Body>{t("educationalNote")}</Body>
          </Card>
        )}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>{t("recommendations")}</Text>
          {result.recommendations.map((recommendation) => (
            <RecommendationCard key={`${recommendation.category}-${recommendation.message}`} recommendation={recommendation} />
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </Card>
  );
}

function RecommendationCard({ recommendation }: { recommendation: FitRecommendation }) {
  return (
    <View style={[styles.recommendation, recommendation.isPrimary && styles.primaryRecommendation]}>
      <Text style={styles.recommendationMeta}>
        {recommendation.isPrimary ? "MAIN / " : ""}
        {recommendation.priority.toUpperCase()} / {(recommendation.confidence ?? "medium").toUpperCase()} /{" "}
        {recommendation.category.replace("_", " ")}
      </Text>
      <Text style={styles.recommendationTitle}>{recommendation.title ?? recommendation.category.replace("_", " ")}</Text>
      <Text style={styles.recommendationText}>{recommendation.explanation ?? recommendation.message}</Text>
      {recommendation.suggestedAction ? <Text style={styles.recommendationAction}>{recommendation.suggestedAction}</Text> : null}
      {recommendation.retestInstruction ? <Text style={styles.recommendationText}>{recommendation.retestInstruction}</Text> : null}
      {recommendation.medicalDisclaimer ? <Text style={styles.disclaimerText}>{recommendation.medicalDisclaimer}</Text> : null}
    </View>
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
    confidence: recommendation.confidence_label ?? undefined,
    confidenceScore: recommendation.confidence_score ?? 0,
    explanation: recommendation.explanation ?? undefined,
    id: recommendation.recommendation_id ?? undefined,
    isPrimary: recommendation.is_primary ?? false,
    message: recommendation.message,
    medicalDisclaimer: recommendation.medical_disclaimer ?? undefined,
    priority: recommendation.priority,
    retestInstruction: recommendation.retest_instruction ?? undefined,
    suggestedAction: recommendation.suggested_action ?? undefined,
    title: recommendation.title ?? undefined,
    zone: recommendation.zone ?? undefined
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

function getFrontKneeMetrics(measurement: FrontKneeMeasurement, t: (key: TranslationKey) => string) {
  return [
    { label: t("frontKneeOverallScore"), value: formatNumber(measurement.overall_score) },
    { label: t("confidenceScore"), value: formatPercent(measurement.confidence_score) },
    { label: `${t("frontKneeLeft")} ${t("frontKneeHorizontalTravel")}`, value: formatDistance(measurement.left_horizontal_travel_mm, measurement.left_horizontal_travel_px) },
    { label: `${t("frontKneeRight")} ${t("frontKneeHorizontalTravel")}`, value: formatDistance(measurement.right_horizontal_travel_mm, measurement.right_horizontal_travel_px) },
    { label: `${t("frontKneeLeft")} ${t("frontKneeMaxDrift")}`, value: formatDistance(measurement.left_knee_drift_mm, measurement.left_knee_drift_px) },
    { label: `${t("frontKneeRight")} ${t("frontKneeMaxDrift")}`, value: formatDistance(measurement.right_knee_drift_mm, measurement.right_knee_drift_px) },
    { label: `${t("frontKneeLeft")} ${t("frontKneeStability")}`, value: formatNumber(measurement.left_stability_score) },
    { label: `${t("frontKneeRight")} ${t("frontKneeStability")}`, value: formatNumber(measurement.right_stability_score) }
  ];
}

function formatDistance(mm?: number | null, px?: number | null) {
  if (typeof mm === "number") {
    return `${Math.round(mm)} mm`;
  }

  return typeof px === "number" ? `${Math.round(px)} px` : "--";
}

function formatNumber(value?: number | null) {
  return typeof value === "number" ? String(Math.round(value)) : "--";
}

function formatPercent(value?: number | null) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "--";
}

function getBikeFitDisclaimer(language: "en" | "es") {
  return language === "es"
    ? "Athmira ofrece orientacion educativa basada en vision por computador. No reemplaza una evaluacion medica, fisioterapeutica ni un bike fit profesional. Si tienes dolor persistente, lesion o molestias importantes, consulta con un profesional."
    : "Athmira provides educational guidance based on computer vision. It does not replace a medical, physical therapy, or professional bike-fit evaluation. If you have persistent pain, injury, or important discomfort, consult a professional.";
}

function getHistoryType(item: AnalysisHistoryItem) {
  return item.summary?.analysis_type ?? (item.session.camera_angle === "front" ? "front_knee_tracking" : "side_bike_fit");
}

function getPrimaryScore(item: AnalysisHistoryItem) {
  return item.summary?.overall_score ?? item.frontKneeMeasurement?.overall_score ?? item.aeroScore?.final_aero_score ?? null;
}

function getCurrentScore(
  result: Awaited<ReturnType<typeof getFitAnalysisResults>> | null,
  isFrontKneeResult: boolean
) {
  if (!result) {
    return null;
  }

  return result.summary?.overall_score ?? (isFrontKneeResult ? result.frontKneeMeasurement?.overall_score : result.aeroScore?.final_aero_score) ?? null;
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? String(Math.round(value)) : "--";
}

function getScoreDelta(current: number | null | undefined, previous: number | null | undefined) {
  return typeof current === "number" && typeof previous === "number" ? current - previous : null;
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
  primaryRecommendation: {
    backgroundColor: "#eefaf7",
    borderColor: colors.primary,
    borderRadius: 8,
    borderTopWidth: 0,
    padding: spacing.md
  },
  recommendationMeta: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  recommendationTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  recommendationText: {
    color: colors.inkMuted,
    fontSize: 15,
    lineHeight: 21
  },
  recommendationAction: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21
  },
  disclaimerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  }
});
