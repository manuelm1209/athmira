import { analyzeFrontKneeTracking } from "@athmira/fit-engine";
import { createAnalysisSummary, createFitSession, createFrontKneeMeasurement, createRecommendations, getBike } from "@athmira/supabase";
import type { DeviceType, FrontKneeTrackingResult, PoseFrameResult } from "@athmira/types";
import { Body, Button, Card, Heading, Inline, colors, spacing } from "@athmira/ui";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

import { parseBikeFitDiscipline, parseBikeFitGoal, parseBikeFitPainAreas } from "./analysisOptions";
import { FrontKneeCamera } from "./FrontKneeCamera";
import type { FrontKneeCameraHandle } from "./FrontKneeCamera.types";

function getDeviceType(): DeviceType {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return "web";
}

export function FrontKneeAnalysisScreen() {
  const cameraRef = useRef<FrontKneeCameraHandle | null>(null);
  const params = useLocalSearchParams<{ bikeId?: string; discipline?: string; goal?: string; painAreas?: string }>();
  const bikeId = params.bikeId;
  const { profile, user } = useAuth();
  const { language, t } = useLanguage();
  const [cameraReady, setCameraReady] = useState(false);
  const [liveResult, setLiveResult] = useState<PoseFrameResult | null>(null);
  const [result, setResult] = useState<FrontKneeTrackingResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const cameraLabels = {
    analyzing: t("analyzing"),
    cameraAnalysisUnavailable: t("cameraAnalysisUnavailable"),
    cameraDenied: t("cameraDenied"),
    cameraEnable: t("cameraEnable"),
    cameraPermissionLoading: t("cameraPermissionLoading"),
    cameraPermissionRequesting: t("cameraPermissionRequesting"),
    cameraUnsupported: t("cameraUnsupported"),
    frontKneeComplete: t("frontKneeComplete"),
    frontKneeGetReady: t("frontKneeGetReady"),
    frontKneeNativeNotice: t("frontKneeNativeNotice"),
    frontKneePositionGuide: t("frontKneePositionGuide"),
    frontKneePositionTitle: t("frontKneePositionTitle"),
    frontKneeRecording: t("frontKneeRecording"),
    insufficientPoseSamples: t("insufficientPoseSamples"),
    poseDetectionActive: t("poseDetectionActive"),
    poseDetectionFailed: t("poseDetectionFailed"),
    poseDetectorLoading: t("poseDetectorLoading"),
    poseNotReady: t("poseNotReady")
  };

  async function beginFrontKneeAnalysis() {
    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setResult(null);
    setWorking(true);

    try {
      const samples = await cameraRef.current?.startTracking({
        countdownMs: 10000,
        durationMs: 10000
      });

      if (!samples?.length) {
        throw new Error(t("poseNotReady"));
      }

      const bike = bikeId ? await getBike(user.id, bikeId) : null;
      const goal = parseBikeFitGoal(params.goal);
      const discipline = parseBikeFitDiscipline(params.discipline, bike?.bike_type);
      const painAreas = parseBikeFitPainAreas(params.painAreas);
      const nextResult = analyzeFrontKneeTracking(samples, {
        bikeProfile: bike,
        discipline,
        durationMs: 10000,
        goal,
        language,
        painAreas,
        userProfile: profile
      });
      const session = await createFitSession({
        userId: user.id,
        bikeId: bikeId || null,
        cameraAngle: "front",
        deviceType: getDeviceType(),
        sessionType: "bike_fit",
        status: "completed"
      });

      await Promise.all([
        createFrontKneeMeasurement({
          result: nextResult,
          sessionId: session.id,
          userId: user.id
        }),
        createRecommendations({
          sessionId: session.id,
          recommendations: nextResult.recommendations
        }),
        createAnalysisSummary({
          analysisType: "front_knee_tracking",
          confidenceScore: nextResult.confidenceScore,
          durationMs: nextResult.durationMs,
          metrics: {
            estimatedMmPerPixel: nextResult.estimatedMmPerPixel,
            leftHorizontalTravelMm: nextResult.left.horizontalTravelMm,
            leftKneeDriftMm: nextResult.left.kneeDriftMm,
            leftStabilityScore: nextResult.left.stabilityScore,
            leftVerticalTravelMm: nextResult.left.verticalTravelMm,
            bikeFitDiscipline: discipline,
            bikeFitGoal: goal,
            painAreas,
            primaryRecommendationId: nextResult.recommendations.find((recommendation) => recommendation.isPrimary)?.id ?? null,
            rightHorizontalTravelMm: nextResult.right.horizontalTravelMm,
            rightKneeDriftMm: nextResult.right.kneeDriftMm,
            rightStabilityScore: nextResult.right.stabilityScore,
            rightVerticalTravelMm: nextResult.right.verticalTravelMm
          },
          overallScore: nextResult.overallScore,
          sampleCount: nextResult.sampleCount,
          sessionId: session.id,
          title: t("frontKneeTitle"),
          userId: user.id
        })
      ]);

      setResult(nextResult);
      setSessionId(session.id);
      setMessage(t("frontKneeSaved"));
    } catch (analysisError) {
      setError(getErrorMessage(analysisError));
    } finally {
      setWorking(false);
    }
  }

  async function captureSnapshot() {
    setError(null);
    setMessage(null);

    try {
      const snapshotUri = await cameraRef.current?.captureSnapshot();

      if (!snapshotUri) {
        throw new Error(t("poseNotReady"));
      }

      setMessage(t("snapshotCaptured"));
    } catch (snapshotError) {
      setError(getErrorMessage(snapshotError));
    }
  }

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("frontKneeTitle")}</Heading>
          <Body>{t("frontKneeIntro")}</Body>
        </View>

        <Card style={styles.instructionsCard}>
          <Text style={styles.sectionLabel}>{t("cameraInstructions")}</Text>
          <Text style={styles.instruction}>{t("frontKneeInstructionCamera")}</Text>
          <Text style={styles.instruction}>{t("frontKneeInstructionVisible")}</Text>
          <Text style={styles.instruction}>{t("frontKneeInstructionCountdown")}</Text>
        </Card>

        <FrontKneeCamera
          labels={cameraLabels}
          onLiveResult={setLiveResult}
          onReadyChange={setCameraReady}
          ref={cameraRef}
        />

        <View style={styles.liveGrid}>
          <Metric label={t("confidenceScore")} value={`${Math.round((liveResult?.confidenceScore ?? 0) * 100)}%`} />
          <Metric label={t("frontKneeCountdownMetric")} value="10s" />
          <Metric label={t("frontKneeRecordingMetric")} value="10s" />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Inline style={styles.actions}>
          <Button disabled={!cameraReady} loading={working} onPress={beginFrontKneeAnalysis} style={styles.actionButton}>
            {t("frontKneeStart")}
          </Button>
          <Button disabled={!cameraReady} onPress={captureSnapshot} style={styles.actionButton} variant="secondary">
            {t("captureSnapshot")}
          </Button>
        </Inline>

        {result ? <FrontKneeResultPanel result={result} sessionId={sessionId} /> : null}

        <Inline>
          <LinkButton href="/analysis" variant="secondary">
            {t("startBikeFit")}
          </LinkButton>
          <LinkButton href="/dashboard" variant="ghost">
            {t("dashboard")}
          </LinkButton>
        </Inline>
      </View>
    </Screen>
  );
}

function FrontKneeResultPanel({ result, sessionId }: { result: FrontKneeTrackingResult; sessionId: string | null }) {
  const { language, t } = useLanguage();

  return (
    <View style={styles.stack}>
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionLabel}>{t("frontKneeResults")}</Text>
        <Body>{t("frontKneeDisclaimer")}</Body>
        <Body>
          {language === "es"
            ? "athmira ofrece orientación educativa basada en visión por computador. No reemplaza una evaluación médica, fisioterapéutica ni un bike fit profesional. Si tienes dolor persistente, lesión o molestias importantes, consulta con un profesional."
            : "athmira provides educational guidance based on computer vision. It does not replace a medical, physical therapy, or professional bike-fit evaluation. If you have persistent pain, injury, or important discomfort, consult a professional."}
        </Body>
        {sessionId ? <Text style={styles.sessionId}>Session {sessionId}</Text> : null}
        <View style={styles.metricsGrid}>
          <Metric label={t("frontKneeOverallScore")} value={`${result.overallScore}`} />
          <Metric label={t("confidenceScore")} value={`${Math.round(result.confidenceScore * 100)}%`} />
          <Metric label={t("frontKneeScale")} value={result.estimatedMmPerPixel ? `${result.estimatedMmPerPixel} mm/px` : "--"} />
        </View>
      </Card>

      <View style={styles.metricsGrid}>
        <SideCard label={t("frontKneeLeft")} side={result.left} />
        <SideCard label={t("frontKneeRight")} side={result.right} />
      </View>

      <Card style={styles.summaryCard}>
        <Text style={styles.sectionLabel}>{t("recommendations")}</Text>
        {result.recommendations.map((recommendation) => (
          <View
            key={`${recommendation.category}-${recommendation.message}`}
            style={[styles.recommendation, recommendation.isPrimary && styles.primaryRecommendation]}
          >
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
        ))}
      </Card>
    </View>
  );
}

function SideCard({ label, side }: { label: string; side: FrontKneeTrackingResult["left"] }) {
  const { t } = useLanguage();

  return (
    <Card style={styles.sideCard}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Metric label={t("frontKneeHorizontalTravel")} value={formatDistance(side.horizontalTravelMm, side.horizontalTravelPx)} />
      <Metric label={t("frontKneeVerticalTravel")} value={formatDistance(side.verticalTravelMm, side.verticalTravelPx)} />
      <Metric label={t("frontKneeMaxDrift")} value={formatDistance(side.kneeDriftMm, side.kneeDriftPx)} />
      <Metric label={t("frontKneeStability")} value={`${side.stabilityScore}`} />
      <Metric label={t("frontKneeSamples")} value={String(side.sampleCount)} />
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.liveMetric}>
      <Text style={styles.liveMetricLabel}>{label}</Text>
      <Text style={styles.liveMetricValue}>{value}</Text>
    </View>
  );
}

function formatDistance(mm: number | null, px: number) {
  return mm === null ? `${px}px` : `${mm} mm`;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg
  },
  header: {
    gap: spacing.md
  },
  actions: {
    alignItems: "stretch"
  },
  actionButton: {
    flexBasis: 180,
    flexGrow: 1
  },
  instructionsCard: {
    gap: spacing.sm
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  instruction: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21
  },
  liveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  liveMetric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: 128,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  liveMetricLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  liveMetricValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  message: {
    color: colors.primary,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  },
  summaryCard: {
    gap: spacing.md
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
  sideCard: {
    flexBasis: 280,
    flexGrow: 1,
    gap: spacing.md
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
