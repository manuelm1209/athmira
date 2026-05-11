import { listBikes } from "@athmira/supabase";
import type { Bike } from "@athmira/types";
import { Body, Button, Card, Heading, Inline, Screen, colors, radii, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

export function AnalysisStartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadBikes() {
      try {
        const nextBikes = await listBikes(currentUser.id);

        if (!cancelled) {
          setBikes(nextBikes);
          setSelectedBikeId(nextBikes[0]?.id ?? null);
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
    if (selectedBikeId) {
      router.push({
        pathname: "/analysis/camera",
        params: { bikeId: selectedBikeId }
      });
      return;
    }

    router.push("/analysis/camera");
  }

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("startBikeFit")}</Heading>
          <Body>{t("analysisIntro")}</Body>
        </View>
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{t("cameraInstructions")}</Text>
          <View style={styles.instructions}>
            <Text style={styles.instruction}>{t("placeCamera")}</Text>
            <Text style={styles.instruction}>{t("showEntireBike")}</Text>
            <Text style={styles.instruction}>{t("steadyPedaling")}</Text>
          </View>
          <Text style={styles.sectionLabel}>{t("chooseBike")}</Text>
          {bikes.length === 0 ? (
            <View style={styles.empty}>
              <Body>{t("noBikes")}</Body>
              <LinkButton href="/bikes/new">{t("addBike")}</LinkButton>
            </View>
          ) : (
            <View style={styles.bikeList}>
              {bikes.map((bike) => (
                <Pressable
                  accessibilityRole="button"
                  key={bike.id}
                  onPress={() => setSelectedBikeId(bike.id)}
                  style={[styles.bikeOption, selectedBikeId === bike.id && styles.selectedBike]}
                >
                  <Text style={[styles.bikeName, selectedBikeId === bike.id && styles.selectedBikeText]}>
                    {bike.name}
                  </Text>
                  <Text style={[styles.bikeMeta, selectedBikeId === bike.id && styles.selectedBikeText]}>
                    {[bike.brand, bike.model].filter(Boolean).join(" / ") || bike.bike_type}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Inline>
            <Button disabled={bikes.length === 0} onPress={openCamera}>
              {t("camera")}
            </Button>
          </Inline>
        </Card>
      </View>
    </Screen>
  );
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
  sectionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  instructions: {
    gap: spacing.sm
  },
  instruction: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 22
  },
  empty: {
    alignItems: "flex-start",
    gap: spacing.md
  },
  bikeList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  bikeOption: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  selectedBike: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  bikeName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900"
  },
  bikeMeta: {
    color: colors.inkMuted,
    fontSize: 13
  },
  selectedBikeText: {
    color: "#ffffff"
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  }
});
