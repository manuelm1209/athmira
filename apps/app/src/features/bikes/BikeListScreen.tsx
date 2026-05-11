import { listBikes } from "@athmira/supabase";
import type { Bike } from "@athmira/types";
import { Body, Card, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

export function BikeListScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [bikes, setBikes] = useState<Bike[]>([]);
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

  return (
    <Screen>
      <View style={styles.stack}>
        <View style={styles.header}>
          <Heading>{t("bikes")}</Heading>
          <Body>{t("bikeProfile")}</Body>
          <Inline>
            <LinkButton href="/bikes/new">{t("addBike")}</LinkButton>
          </Inline>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.grid}>
          {bikes.length === 0 ? (
            <Card>
              <Body>{t("noBikes")}</Body>
            </Card>
          ) : null}
          {bikes.map((bike) => (
            <Card key={bike.id} style={styles.card}>
              <View style={styles.cardCopy}>
                <Text style={styles.title}>{bike.name}</Text>
                <Text style={styles.meta}>
                  {[bike.brand, bike.model, bike.size].filter(Boolean).join(" / ") || bike.bike_type}
                </Text>
              </View>
              <LinkButton href={{ pathname: "/bikes/[id]", params: { id: bike.id } }} variant="secondary">
                {t("editBike")}
              </LinkButton>
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
    gap: spacing.md
  },
  error: {
    color: colors.danger,
    fontWeight: "800"
  },
  grid: {
    gap: spacing.md
  },
  card: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 14
  }
});
