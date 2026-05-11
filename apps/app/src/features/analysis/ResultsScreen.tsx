import { calculateAeroScore } from "@athmira/aero-engine";
import { createCoachSummary } from "@athmira/ai-engine";
import { calculateFitScore, generateFitRecommendations } from "@athmira/fit-engine";
import { analyzePoseFrame } from "@athmira/pose-engine";
import { Body, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export function ResultsScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { profile } = useAuth();
  const { language, t } = useLanguage();

  const result = useMemo(() => {
    const pose = analyzePoseFrame({ width: 1280, height: 720 });
    const fitScore = calculateFitScore(pose.angles);
    const aeroScore = calculateAeroScore(pose, pose.angles);
    const recommendations = generateFitRecommendations(pose.angles, null, profile, language);
    const coachSummary = createCoachSummary({ recommendations, language });

    return {
      aeroScore,
      coachSummary,
      fitScore,
      pose,
      recommendations
    };
  }, [language, profile]);

  const metrics = [
    { label: t("kneeAngle"), value: `${result.pose.angles.kneeAngle ?? 0} deg` },
    { label: t("hipAngle"), value: `${result.pose.angles.hipAngle ?? 0} deg` },
    { label: t("elbowAngle"), value: `${result.pose.angles.elbowAngle ?? 0} deg` },
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
