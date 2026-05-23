import {
  createAeroScore,
  createAnalysisSummary,
  createFitMeasurement,
  createFitSession,
  createRecommendations,
  getBike
} from "@athmira/supabase";
import type { DeviceType, PoseFrameResult } from "@athmira/types";
import { Body, Button, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

import { parseBikeFitDiscipline, parseBikeFitGoal, parseBikeFitPainAreas } from "./analysisOptions";
import { createBikeFitAnalysisSummary } from "./analysisSummary";
import { BikeFitCamera } from "./BikeFitCamera";
import type { BikeFitCameraHandle } from "./BikeFitCamera.types";

function getDeviceType(): DeviceType {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return "web";
}

export function CameraAnalysisScreen() {
  const cameraRef = useRef<BikeFitCameraHandle | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{ bikeId?: string; discipline?: string; goal?: string; painAreas?: string }>();
  const bikeId = params.bikeId;
  const { profile, user } = useAuth();
  const { language, t } = useLanguage();
  const [cameraReady, setCameraReady] = useState(false);
  const [liveResult, setLiveResult] = useState<PoseFrameResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const cameraLabels = {
    analyzing: t("analyzing"),
    bikeFitComplete: t("bikeFitComplete"),
    bikeFitGetReady: t("bikeFitGetReady"),
    bikeFitRecording: t("bikeFitRecording"),
    cameraAnalysisUnavailable: t("cameraAnalysisUnavailable"),
    cameraDenied: t("cameraDenied"),
    cameraEnable: t("cameraEnable"),
    cameraPermissionLoading: t("cameraPermissionLoading"),
    cameraPermissionRequesting: t("cameraPermissionRequesting"),
    cameraUnsupported: t("cameraUnsupported"),
    insufficientPoseSamples: t("insufficientPoseSamples"),
    nativePoseNotice: t("nativePoseNotice"),
    poseDetectionActive: t("poseDetectionActive"),
    poseDetectionFailed: t("poseDetectionFailed"),
    poseDetectorLoading: t("poseDetectorLoading"),
    poseNotReady: t("poseNotReady"),
    riderPositionTitle: t("riderPositionTitle"),
    riderPositionGuide: t("riderPositionGuide"),
    riderPositionDetected: t("riderPositionDetected")
  };

  async function beginAnalysis() {
    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setWorking(true);

    try {
      const samples = await cameraRef.current?.startAnalysis({ countdownMs: 10000, durationMs: 8000 });

      if (!samples?.length) {
        throw new Error(t("poseNotReady"));
      }

      const bike = bikeId ? await getBike(user.id, bikeId) : null;
      const goal = parseBikeFitGoal(params.goal);
      const discipline = parseBikeFitDiscipline(params.discipline, bike?.bike_type);
      const painAreas = parseBikeFitPainAreas(params.painAreas);
      const summary = createBikeFitAnalysisSummary({
        bike,
        discipline,
        durationMs: 8000,
        goal,
        language,
        painAreas,
        profile,
        samples
      });

      const session = await createFitSession({
        userId: user.id,
        bikeId: bikeId || null,
        cameraAngle: "side",
        deviceType: getDeviceType(),
        sessionType: "bike_fit",
        status: "completed"
      });

      await Promise.all([
        createFitMeasurement({
          sessionId: session.id,
          angles: summary.angles,
          confidenceScore: summary.confidenceScore,
          kneeAngleMax: summary.kneeAngleMax,
          kneeAngleMin: summary.kneeAngleMin
        }),
        createAeroScore({
          sessionId: session.id,
          aeroScore: summary.aeroScore
        }),
        createRecommendations({
          sessionId: session.id,
          recommendations: summary.recommendations
        }),
        createAnalysisSummary({
          analysisType: "side_bike_fit",
          aeroScore: summary.fitScore.aeroScore,
          comfortScore: summary.fitScore.comfortScore,
          confidenceScore: summary.confidenceScore,
          durationMs: summary.durationMs,
          metrics: {
            aeroFinalScore: summary.aeroScore.finalAeroScore,
            elbowAngleAvg: summary.angles.elbowAngle ?? null,
            hipAngleAvg: summary.angles.hipAngle ?? null,
            kneeAngleMax: summary.kneeAngleMax,
            kneeAngleMin: summary.kneeAngleMin,
            bikeFitDiscipline: discipline,
            bikeFitGoal: goal,
            painAreas,
            primaryRecommendationId: summary.recommendations.find((recommendation) => recommendation.isPrimary)?.id ?? null,
            shoulderAngleAvg: summary.angles.shoulderAngle ?? null,
            torsoAngleAvg: summary.angles.torsoAngle ?? null
          },
          overallScore: summary.compositeScore,
          sampleCount: summary.sampleCount,
          sessionId: session.id,
          title: t("sideFitAnalysis"),
          userId: user.id
        })
      ]);

      router.replace({
        pathname: "/analysis/results",
        params: { sessionId: session.id }
      });
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

  const liveAngles = liveResult?.angles;
  const canAnalyze = cameraReady && Boolean(liveResult);

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("camera")}</Heading>
          <Body>{t("cameraPermission")}</Body>
        </View>
        <Card style={styles.instructionsCard}>
          <Text style={styles.sectionLabel}>{t("cameraInstructions")}</Text>
          <Text style={styles.instruction}>{t("placeCamera")}</Text>
          <Text style={styles.instruction}>{t("showEntireBike")}</Text>
          <Text style={styles.instruction}>{t("steadyPedaling")}</Text>
          <Text style={styles.instruction}>{t("bikeFitInstructionCountdown")}</Text>
        </Card>

        <BikeFitCamera
          labels={cameraLabels}
          onLiveResult={setLiveResult}
          onReadyChange={setCameraReady}
          ref={cameraRef}
        />

        {liveAngles ? (
          <View style={styles.liveGrid}>
            <Metric label={t("kneeAngle")} value={formatAngle(liveAngles.kneeAngle)} />
            <Metric label={t("hipAngle")} value={formatAngle(liveAngles.hipAngle)} />
            <Metric label={t("torsoAngle")} value={formatAngle(liveAngles.torsoAngle)} />
            <Metric label={t("elbowAngle")} value={formatAngle(liveAngles.elbowAngle)} />
            <Metric label={t("confidenceScore")} value={`${Math.round((liveResult?.confidenceScore ?? 0) * 100)}%`} />
          </View>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Inline style={styles.actions}>
          <Button disabled={!canAnalyze} loading={working} onPress={beginAnalysis} style={styles.actionButton}>
            {t("beginAnalysis")}
          </Button>
          <Button disabled={!cameraReady} onPress={captureSnapshot} style={styles.actionButton} variant="secondary">
            {t("captureSnapshot")}
          </Button>
        </Inline>
      </View>
    </Screen>
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

function formatAngle(value?: number) {
  return typeof value === "number" ? `${value}°` : "--";
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
  }
});
