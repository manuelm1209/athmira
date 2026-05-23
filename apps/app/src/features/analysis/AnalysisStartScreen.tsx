import { deleteFitSession, listAnalysisHistory, listBikes } from "@athmira/supabase";
import type { AnalysisHistoryItem, Bike, BikeFitDiscipline, BikeFitGoal, BikeFitPainArea } from "@athmira/types";
import { Body, Button, Card, Heading, Inline, SelectField, colors, radii, shadows, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { createElement } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LinkButton } from "@/components/LinkButton";
import type { TranslationKey } from "@/i18n";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

import {
  bikeFitDisciplines,
  bikeFitGoals,
  bikeFitPainAreas,
  getDefaultDiscipline,
  getDisciplineLabel,
  getGoalLabel,
  getPainAreaLabel,
  serializePainAreas,
  togglePainArea
} from "./analysisOptions";

export function AnalysisStartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [goal, setGoal] = useState<BikeFitGoal>("balanced");
  const [discipline, setDiscipline] = useState<BikeFitDiscipline>("road_endurance");
  const [painAreas, setPainAreas] = useState<BikeFitPainArea[]>(["none"]);
  const [painOpen, setPainOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pendingDeleteItem = pendingDeleteSessionId
    ? history.find((item) => item.session.id === pendingDeleteSessionId) ?? null
    : null;

  async function performDeleteHistory() {
    if (!user || !pendingDeleteSessionId) {
      return;
    }

    const sessionId = pendingDeleteSessionId;
    setDeleting(true);

    try {
      await deleteFitSession(user.id, sessionId);
      setHistory((current) => current.filter((item) => item.session.id !== sessionId));
      setPendingDeleteSessionId(null);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  function cancelDeleteHistory() {
    if (deleting) {
      return;
    }
    setPendingDeleteSessionId(null);
  }
  const selectedBike = bikes.find((bike) => bike.id === selectedBikeId) ?? null;
  const selectedPainLabel = painAreas.map((painArea) => getPainAreaLabel(painArea, language)).join(", ");

  function handleBikeChange(nextBikeId: string) {
    const nextBike = bikes.find((bike) => bike.id === nextBikeId);

    setSelectedBikeId(nextBike?.id ?? null);

    if (nextBike) {
      setDiscipline(getDefaultDiscipline(nextBike.bike_type));
    }
  }

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
          setDiscipline(getDefaultDiscipline(nextBikes[0]?.bike_type));
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
    const params = {
      bikeId: selectedBikeId ?? undefined,
      discipline,
      goal,
      painAreas: serializePainAreas(painAreas)
    };

    if (selectedBikeId) {
      router.push({
        pathname: "/analysis/camera",
        params
      });
      return;
    }

    router.push({
      pathname: "/analysis/camera",
      params
    });
  }

  function openFrontKneeCamera() {
    const params = {
      bikeId: selectedBikeId ?? undefined,
      discipline,
      goal,
      painAreas: serializePainAreas(painAreas)
    };

    if (selectedBikeId) {
      router.push({
        pathname: "/analysis/front-knee",
        params
      });
      return;
    }

    router.push({
      pathname: "/analysis/front-knee",
      params
    });
  }

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("startBikeFit")}</Heading>
          <Body>{t("analysisIntro")}</Body>
        </View>
        <Card style={styles.setupCard}>
          <View style={styles.setupHeader}>
            <View style={styles.setupHeaderCopy}>
              <Text style={styles.sectionLabel}>{language === "es" ? "Preparar análisis" : "Prepare analysis"}</Text>
              <Text style={styles.summaryText}>
                {selectedBike
                  ? `${selectedBike.name} / ${getGoalLabel(goal, language)} / ${getDisciplineLabel(discipline, language)}`
                  : language === "es"
                    ? "Agrega una bici para iniciar."
                    : "Add a bike to begin."}
              </Text>
            </View>
          </View>

          {bikes.length === 0 ? (
            <View style={styles.empty}>
              <Body>{t("noBikes")}</Body>
              <LinkButton href="/bikes/new">{t("addBike")}</LinkButton>
            </View>
          ) : (
            <View style={styles.selectGrid}>
              <View style={styles.selectColumn}>
                <SelectField
                  label={t("chooseBike")}
                  onValueChange={handleBikeChange}
                  options={bikes.map((bike) => ({
                    label: bike.name,
                    value: bike.id
                  }))}
                  value={selectedBikeId ?? ""}
                />
              </View>
              <View style={styles.selectColumn}>
                <SelectField
                  label={language === "es" ? "Objetivo" : "Goal"}
                  onValueChange={(nextGoal) => setGoal(nextGoal as BikeFitGoal)}
                  options={bikeFitGoals.map((nextGoal) => ({
                    label: getGoalLabel(nextGoal, language),
                    value: nextGoal
                  }))}
                  value={goal}
                />
              </View>
              <View style={styles.selectColumn}>
                <SelectField
                  label={language === "es" ? "Disciplina" : "Discipline"}
                  onValueChange={(nextDiscipline) => setDiscipline(nextDiscipline as BikeFitDiscipline)}
                  options={bikeFitDisciplines.map((nextDiscipline) => ({
                    label: getDisciplineLabel(nextDiscipline, language),
                    value: nextDiscipline
                  }))}
                  value={discipline}
                />
              </View>
            </View>
          )}

          <View style={styles.divider} />

          <Pressable
            accessibilityLabel={language === "es" ? "Mostrar molestias" : "Show discomfort"}
            accessibilityRole="button"
            accessibilityState={{ expanded: painOpen }}
            onPress={() => setPainOpen((current) => !current)}
            style={styles.compactDisclosure}
          >
            <View style={styles.compactDisclosureCopy}>
              <Text style={styles.compactDisclosureLabel}>{language === "es" ? "Molestias" : "Discomfort"}</Text>
              <Text style={styles.compactDisclosureValue}>{selectedPainLabel}</Text>
            </View>
            <PlusMinusIcon expanded={painOpen} />
          </Pressable>

          {painOpen ? (
            <View style={styles.optionGrid}>
              {bikeFitPainAreas.map((painArea) => (
                <OptionButton
                  key={painArea}
                  label={getPainAreaLabel(painArea, language)}
                  onPress={() => setPainAreas((current) => togglePainArea(current, painArea))}
                  selected={painAreas.includes(painArea)}
                />
              ))}
            </View>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Card>

        <View style={styles.analysisChoiceGrid}>
          <AnalysisChoice
            body={
              language === "es"
                ? "Para revisar postura lateral, ángulos clave, aero estimado y recomendaciones de fit."
                : "Review side posture, key angles, estimated aero guidance, and fit recommendations."
            }
            disabled={bikes.length === 0}
            instructions={[t("placeCamera"), t("showEntireBike"), t("steadyPedaling")]}
            onPress={openCamera}
            title={t("sideFitAnalysis")}
          />
          <AnalysisChoice
            body={
              language === "es"
                ? "Para observar movimiento frontal de rodillas, estabilidad y desviación lateral."
                : "Track frontal knee movement, stability, and side-to-side drift."
            }
            disabled={bikes.length === 0}
            instructions={[
              t("frontKneeInstructionCamera"),
              t("frontKneeInstructionVisible"),
              t("frontKneeInstructionCountdown")
            ]}
            onPress={openFrontKneeCamera}
            secondary
            title={t("frontKneeTitle")}
          />
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{t("analysisHistory")}</Text>
          {history.length ? (
            <View style={styles.historyList}>
              {history.map((item, index) => (
                <HistoryCard
                  deleting={deleting && pendingDeleteSessionId === item.session.id}
                  item={item}
                  key={item.session.id}
                  onDelete={() => setPendingDeleteSessionId(item.session.id)}
                  previous={history.slice(index + 1).find((candidate) => getHistoryType(candidate) === getHistoryType(item))}
                />
              ))}
            </View>
          ) : (
            <Body>{t("noAnalysisHistory")}</Body>
          )}
        </Card>
      </View>
      <DeleteAnalysisConfirmModal
        item={pendingDeleteItem}
        loading={deleting}
        onCancel={cancelDeleteHistory}
        onConfirm={performDeleteHistory}
      />
    </Screen>
  );
}

function DeleteAnalysisConfirmModal({
  item,
  loading,
  onCancel,
  onConfirm
}: {
  item: AnalysisHistoryItem | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useLanguage();
  const isFront = item ? getHistoryType(item) === "front_knee_tracking" : false;
  const itemTitle = item?.summary?.title ?? (isFront ? t("frontKneeTitle") : t("sideFitAnalysis"));

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(item)}>
      <Pressable onPress={onCancel} style={styles.modalOverlay}>
        <Pressable onPress={() => undefined} style={styles.confirmModal}>
          <View style={styles.confirmIcon}>
            <Text style={styles.confirmIconText}>!</Text>
          </View>
          <Text style={styles.modalTitle}>{t("deleteAnalysis")}</Text>
          <Text style={styles.confirmBody}>{t("deleteAnalysisConfirm")}</Text>
          {item ? (
            <Text style={styles.confirmItemName}>
              {itemTitle} · {new Date(item.session.created_at).toLocaleDateString()}
            </Text>
          ) : null}
          <Inline style={styles.confirmActions}>
            <Button disabled={loading} onPress={onCancel} variant="secondary">
              {t("cancel")}
            </Button>
            <Button loading={loading} onPress={onConfirm} variant="danger">
              {t("delete")}
            </Button>
          </Inline>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AnalysisChoice({
  body,
  disabled,
  instructions,
  onPress,
  secondary,
  title
}: {
  body: string;
  disabled: boolean;
  instructions: string[];
  onPress: () => void;
  secondary?: boolean;
  title: string;
}) {
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.analysisChoice, disabled && styles.analysisChoiceDisabled]}>
      <View style={styles.analysisChoiceHeader}>
        <View style={styles.analysisChoiceCopy}>
          <Text style={styles.analysisChoiceTitle}>{title}</Text>
        </View>
        <Pressable
          accessibilityLabel={expanded ? (language === "es" ? "Ocultar detalles" : "Hide details") : (language === "es" ? "Mostrar detalles" : "Show details")}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((current) => !current)}
          style={styles.detailButton}
        >
          <PlusMinusIcon expanded={expanded} />
        </Pressable>
      </View>
      <View style={styles.analysisChoiceCopy}>
        <Text style={styles.analysisChoiceBody}>{body}</Text>
      </View>
      {expanded ? (
        <View style={styles.instructions}>
          {instructions.map((instruction) => (
            <Text key={instruction} style={styles.instruction}>{instruction}</Text>
          ))}
        </View>
      ) : null}
      <Button disabled={disabled} onPress={onPress} variant={secondary ? "secondary" : "primary"} style={styles.analysisChoiceButton}>
        {language === "es" ? "Continuar" : "Continue"}
      </Button>
    </View>
  );
}

const TRASH_PATH =
  "M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z";

function TrashIcon({ color, size = 16 }: { color: string; size?: number }) {
  if (Platform.OS === "web") {
    return createElement(
      "svg",
      {
        width: size,
        height: size,
        viewBox: "0 0 16 16",
        fill: color,
        "aria-hidden": true,
        focusable: false
      },
      createElement("path", {
        d: TRASH_PATH,
        fillRule: "evenodd",
        clipRule: "evenodd"
      })
    );
  }

  return (
    <View style={{ alignItems: "center", height: size, justifyContent: "center", width: size }}>
      <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, width: size * 0.875 }} />
      <View
        style={{
          borderColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          borderWidth: 1.25,
          height: size * 0.6875,
          marginTop: 1,
          width: size * 0.75
        }}
      />
    </View>
  );
}

function PlusMinusIcon({ expanded }: { expanded: boolean }) {
  return (
    <View style={styles.plusMinusIcon}>
      <View style={styles.plusMinusHorizontal} />
      {expanded ? null : <View style={styles.plusMinusVertical} />}
    </View>
  );
}

function OptionButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.optionButton, selected && styles.selectedBike]}
    >
      <Text style={[styles.optionText, selected && styles.selectedBikeText]}>{label}</Text>
    </Pressable>
  );
}

function HistoryCard({
  deleting,
  item,
  onDelete,
  previous
}: {
  deleting: boolean;
  item: AnalysisHistoryItem;
  onDelete: () => void;
  previous?: AnalysisHistoryItem;
}) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const isFront = getHistoryType(item) === "front_knee_tracking";
  const score = getPrimaryScore(item);
  const previousScore = previous ? getPrimaryScore(previous) : null;
  const delta = typeof score === "number" && typeof previousScore === "number" ? score - previousScore : null;
  const iconColor = deleting ? colors.inkMuted : hovered ? colors.danger : colors.inkMuted;

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
      <View style={styles.historyActions}>
        <LinkButton
          href={{
            pathname: "/analysis/results",
            params: { sessionId: item.session.id }
          }}
          variant="ghost"
        >
          {t("viewDetails")}
        </LinkButton>
        <Pressable
          accessibilityLabel={t("deleteAnalysis")}
          accessibilityRole="button"
          accessibilityState={{ disabled: deleting }}
          disabled={deleting}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteIconButton,
            hovered && !deleting ? styles.deleteIconButtonHovered : null,
            pressed && !deleting ? styles.deleteIconButtonPressed : null,
            deleting && styles.deleteIconButtonDisabled
          ]}
        >
          <TrashIcon color={iconColor} />
        </Pressable>
      </View>
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
  setupCard: {
    gap: spacing.md
  },
  setupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  setupHeaderCopy: {
    flex: 1,
    gap: spacing.xs
  },
  summaryText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  selectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  selectColumn: {
    flexBasis: 230,
    flexGrow: 1
  },
  instructions: {
    backgroundColor: colors.primaryMist,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  instruction: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  empty: {
    alignItems: "flex-start",
    gap: spacing.md
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  selectedBike: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  selectedBikeText: {
    color: "#ffffff"
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  optionText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  divider: {
    backgroundColor: colors.border,
    height: 1
  },
  compactDisclosure: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  compactDisclosureCopy: {
    flex: 1,
    gap: 2
  },
  compactDisclosureLabel: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  compactDisclosureValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  },
  analysisChoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  analysisChoice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 280,
    flexGrow: 1,
    gap: spacing.lg,
    justifyContent: "space-between",
    padding: spacing.lg
  },
  analysisChoiceDisabled: {
    opacity: 0.65
  },
  analysisChoiceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  analysisChoiceCopy: {
    flex: 1,
    gap: spacing.sm
  },
  analysisChoiceTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24
  },
  analysisChoiceBody: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20
  },
  analysisChoiceButton: {
    alignSelf: "flex-start"
  },
  detailButton: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderColor: colors.border,
    borderRadius: radii.round,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  plusMinusIcon: {
    alignItems: "center",
    height: 16,
    justifyContent: "center",
    position: "relative",
    width: 16
  },
  plusMinusHorizontal: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    height: 3,
    position: "absolute",
    width: 13
  },
  plusMinusVertical: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    height: 13,
    position: "absolute",
    width: 3
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
  },
  historyActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  deleteIconButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radii.round,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  deleteIconButtonHovered: {
    backgroundColor: colors.dangerSoft
  },
  deleteIconButtonPressed: {
    backgroundColor: colors.dangerSoft,
    opacity: 0.85
  },
  deleteIconButtonDisabled: {
    opacity: 0.4
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(7,18,28,0.46)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  confirmModal: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 460,
    padding: spacing.xl,
    width: "100%",
    ...shadows.medium
  },
  confirmIcon: {
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.round,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  confirmIconText: {
    color: colors.danger,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    textAlign: "center"
  },
  confirmBody: {
    color: colors.inkMuted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center"
  },
  confirmItemName: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: "center",
    width: "100%"
  },
  confirmActions: {
    justifyContent: "center"
  }
});
