import { createAeroScore, createFitMeasurement, createFitSession, createRecommendations } from "@athmira/supabase";
import type { DeviceType, PoseFrameResult } from "@athmira/types";
import { Body, Button, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, type ElementRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

import { createBikeFitAnalysisSummary } from "./analysisSummary";
import { WebBikeFitCamera, type WebBikeFitCameraHandle } from "./WebBikeFitCamera";

function getDeviceType(): DeviceType {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return Platform.OS;
  }

  return "web";
}

export function CameraAnalysisScreen() {
  const cameraRef = useRef<ElementRef<typeof CameraView> | null>(null);
  const webCameraRef = useRef<WebBikeFitCameraHandle | null>(null);
  const router = useRouter();
  const { bikeId } = useLocalSearchParams<{ bikeId?: string }>();
  const { profile, user } = useAuth();
  const { language, t } = useLanguage();
  const [permission, requestPermission] = useCameraPermissions();
  const [liveResult, setLiveResult] = useState<PoseFrameResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function beginAnalysis() {
    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setWorking(true);

    try {
      if (Platform.OS === "web") {
        const samples = await webCameraRef.current?.startAnalysis();

        if (!samples?.length) {
          throw new Error(t("poseNotReady"));
        }

        const summary = createBikeFitAnalysisSummary({
          durationMs: 8000,
          language,
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
          })
        ]);

        router.replace({
          pathname: "/analysis/results",
          params: { sessionId: session.id }
        });
        return;
      }

      const session = await createFitSession({
        userId: user.id,
        bikeId: bikeId || null,
        cameraAngle: "side",
        deviceType: getDeviceType(),
        sessionType: "bike_fit",
        status: "completed"
      });

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
      if (Platform.OS === "web") {
        await webCameraRef.current?.captureSnapshot();
        setMessage(t("snapshotCaptured"));
        return;
      }

      await cameraRef.current?.takePictureAsync({
        quality: 0.6,
        skipProcessing: true
      });
      setMessage(t("snapshotCaptured"));
    } catch (snapshotError) {
      setError(getErrorMessage(snapshotError));
    }
  }

  const hasPermission = Platform.OS === "web" || permission?.granted;
  const liveAngles = liveResult?.angles;
  const canAnalyze = hasPermission && (Platform.OS !== "web" || Boolean(liveResult));

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
        </Card>

        {Platform.OS !== "web" && !permission ? (
          <Card>
            <Body>Loading camera permission...</Body>
          </Card>
        ) : null}

        {Platform.OS !== "web" && permission && !hasPermission ? (
          <Card style={styles.permissionCard}>
            <Body>{t("cameraDenied")}</Body>
            <Button onPress={requestPermission}>{t("cameraPermission")}</Button>
          </Card>
        ) : null}

        {Platform.OS === "web" ? (
          <WebBikeFitCamera ref={webCameraRef} onLiveResult={setLiveResult} />
        ) : null}

        {Platform.OS !== "web" && hasPermission ? (
          <View style={styles.cameraFrame}>
            <CameraView ref={cameraRef} facing="front" style={styles.camera} />
            <View style={[styles.overlay, styles.noPointerEvents]}>
              <View style={styles.verticalGuide} />
              <View style={styles.torsoGuide} />
              <View style={styles.kneeGuide} />
              <View style={styles.marker} />
            </View>
          </View>
        ) : null}

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

        <Inline>
          <Button disabled={!canAnalyze} loading={working} onPress={beginAnalysis}>
            {t("beginAnalysis")}
          </Button>
          <Button disabled={!hasPermission} onPress={captureSnapshot} variant="secondary">
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
  permissionCard: {
    alignItems: "flex-start",
    gap: spacing.md
  },
  cameraFrame: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    height: 460,
    overflow: "hidden",
    position: "relative"
  },
  camera: {
    height: "100%",
    width: "100%"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  noPointerEvents: {
    pointerEvents: "none"
  },
  verticalGuide: {
    backgroundColor: "rgba(255,255,255,0.45)",
    height: "86%",
    left: "50%",
    position: "absolute",
    top: "7%",
    width: 2
  },
  torsoGuide: {
    backgroundColor: colors.accent,
    height: 3,
    left: "30%",
    position: "absolute",
    top: "38%",
    transform: [{ rotate: "-18deg" }],
    width: "34%"
  },
  kneeGuide: {
    backgroundColor: "#b6eadc",
    height: 3,
    left: "42%",
    position: "absolute",
    top: "64%",
    transform: [{ rotate: "28deg" }],
    width: "24%"
  },
  marker: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    left: "48%",
    position: "absolute",
    top: "58%",
    width: 20
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
