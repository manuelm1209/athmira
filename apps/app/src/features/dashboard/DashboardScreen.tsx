import { getLatestBike } from "@athmira/supabase";
import type { Bike } from "@athmira/types";
import { Body, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

const moduleKeys = ["bikeFit", "aeroAnalysis", "nutrition", "trainingPlan", "wearables"] as const;

export function DashboardScreen() {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
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

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{`${t("greeting")}${profile?.name ? `, ${profile.name}` : ""}`}</Heading>
          <Body>{t("analysisIntro")}</Body>
          <Inline>
            <LinkButton href="/analysis">{t("startBikeFit")}</LinkButton>
            <LinkButton href="/bikes/new" variant="secondary">
              {t("addBike")}
            </LinkButton>
          </Inline>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Card style={styles.latestCard}>
          <Text style={styles.cardLabel}>{t("latestBike")}</Text>
          <Text style={styles.cardTitle}>{latestBike?.name ?? t("noBikes")}</Text>
          {latestBike ? (
            <Text style={styles.cardMeta}>
              {[latestBike.brand, latestBike.model, latestBike.size].filter(Boolean).join(" / ") || latestBike.bike_type}
            </Text>
          ) : null}
        </Card>

        <View style={styles.grid}>
          {moduleKeys.map((key) => (
            <Card key={key} style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>{t(key)}</Text>
              <Text style={styles.moduleMeta}>{key === "bikeFit" ? t("educationalNote") : t("fieldOptional")}</Text>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.xl
  },
  header: {
    gap: spacing.lg
  },
  error: {
    color: colors.danger,
    fontWeight: "700"
  },
  latestCard: {
    gap: spacing.sm
  },
  cardLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  cardMeta: {
    color: colors.inkMuted,
    fontSize: 14
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  moduleCard: {
    flexBasis: 190,
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 130
  },
  moduleTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  moduleMeta: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18
  }
});
