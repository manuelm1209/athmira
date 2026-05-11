import { Body, Card, Eyebrow, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export default function WelcomeRoute() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 760;

  return (
    <Screen centered>
      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.copy}>
          <Eyebrow>{t("welcomeTitle")}</Eyebrow>
          <Heading style={styles.title}>{t("tagline")}</Heading>
          <Body>{t("welcomeBody")}</Body>
          <Inline>
            {session ? (
              <LinkButton href="/dashboard">{t("dashboard")}</LinkButton>
            ) : (
              <>
                <LinkButton href="/auth/signup">{t("signUpCta")}</LinkButton>
                <LinkButton href="/auth/login" variant="secondary">
                  {t("signInCta")}
                </LinkButton>
              </>
            )}
          </Inline>
          <Text style={styles.disclaimer}>{t("educationalNote")}</Text>
        </View>
        <View style={styles.panel}>
          <Card style={styles.signalCard}>
            <Text style={styles.panelLabel}>{t("bikeFit")}</Text>
            <Text style={styles.panelValue}>145 deg</Text>
            <Text style={styles.panelHint}>{t("kneeAngle")}</Text>
          </Card>
          <Card style={styles.signalCard}>
            <Text style={styles.panelLabel}>{t("aeroScore")}</Text>
            <Text style={styles.panelValue}>76</Text>
            <Text style={styles.panelHint}>{t("windTunnelNote")}</Text>
          </Card>
          <View style={styles.lineGroup}>
            <View style={styles.longLine} />
            <View style={styles.shortLine} />
            <View style={styles.greenDot} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxl,
    justifyContent: "space-between"
  },
  heroCompact: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  copy: {
    flex: 1,
    gap: spacing.lg
  },
  title: {
    maxWidth: 620
  },
  disclaimer: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 620
  },
  panel: {
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    flex: 1,
    gap: spacing.md,
    minHeight: 360,
    overflow: "hidden",
    padding: spacing.lg
  },
  signalCard: {
    backgroundColor: "#f8fbf8"
  },
  panelLabel: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  panelValue: {
    color: colors.primaryDark,
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 56
  },
  panelHint: {
    color: colors.inkMuted,
    fontSize: 13,
    lineHeight: 18
  },
  lineGroup: {
    flex: 1,
    justifyContent: "center",
    minHeight: 120
  },
  longLine: {
    backgroundColor: colors.accent,
    height: 3,
    transform: [{ rotate: "-18deg" }],
    width: "88%"
  },
  shortLine: {
    alignSelf: "flex-end",
    backgroundColor: "#b6eadc",
    height: 3,
    transform: [{ rotate: "28deg" }],
    width: "52%"
  },
  greenDot: {
    backgroundColor: "#b6eadc",
    borderRadius: 8,
    height: 16,
    left: "42%",
    position: "absolute",
    top: "45%",
    width: 16
  }
});
