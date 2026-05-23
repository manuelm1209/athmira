import { listBikes } from "@athmira/supabase";
import type { Bike } from "@athmira/types";
import { Body, Card, Heading, Inline, colors, radii, spacing } from "@athmira/ui";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LinkButton } from "@/components/LinkButton";
import { getBikeImage } from "@/lib/bike-images";
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
            <LinkButton href="/tire-pressure" variant="secondary">
              {t("tirePressureTitle")}
            </LinkButton>
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
              <View style={styles.cardImageFrame}>
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  source={getBikeImage(bike.bike_type)}
                  style={styles.cardImage}
                />
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.title}>{bike.name}</Text>
                <Text style={styles.type}>{t(bike.bike_type)}</Text>
                <Text style={styles.meta}>
                  {[bike.brand, bike.model, bike.size].filter(Boolean).join(" / ") || "—"}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <LinkButton href={{ pathname: "/bikes/[id]", params: { id: bike.id } }} variant="secondary">
                  {t("editBike")}
                </LinkButton>
                <LinkButton href={{ pathname: "/tire-pressure", params: { bikeId: bike.id } }} variant="ghost">
                  {t("tirePressureConfigure")}
                </LinkButton>
              </View>
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
  cardImageFrame: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 220,
    flexGrow: 0,
    height: 130,
    justifyContent: "center",
    overflow: "hidden",
    padding: spacing.sm
  },
  cardImage: {
    height: "100%",
    width: "100%"
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 220
  },
  cardActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  type: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase"
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 14
  }
});
