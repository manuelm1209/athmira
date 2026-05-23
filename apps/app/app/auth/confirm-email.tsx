import { Body, Card, Heading, Inline, colors, radii, spacing, typography } from "@athmira/ui";
import { useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LinkButton } from "@/components/LinkButton";
import { SeoHead } from "@/components/SeoHead";
import { useLanguage } from "@/providers/LanguageProvider";

export default function ConfirmEmailRoute() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] : params.email;

  return (
    <>
      <SeoHead
        canonicalPath="/auth/confirm-email"
        description="Instrucciones para confirmar el correo de una cuenta nueva en athmira."
        noindex
        title="Confirma tu correo | athmira"
      />
      <Screen centered maxWidth={620}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.status}>{t("emailConfirmationStatus")}</Text>
            <Heading>{t("emailConfirmationTitle")}</Heading>
            <Body>{t("emailConfirmationBody")}</Body>
            {email ? <Text style={styles.email}>{email}</Text> : null}
          </View>

          <View style={styles.instructions}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Body style={styles.stepText}>{t("emailConfirmationInbox")}</Body>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Body style={styles.stepText}>{t("emailConfirmationSpam")}</Body>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Body style={styles.stepText}>{t("emailConfirmationAfter")}</Body>
            </View>
          </View>

          <Inline style={styles.actions}>
            <LinkButton href="/auth/login">{t("signInCta")}</LinkButton>
            <LinkButton href="/auth/signup" variant="secondary">
              {t("emailConfirmationUseAnother")}
            </LinkButton>
          </Inline>
        </Card>
      </Screen>
    </>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  card: {
    gap: spacing.xl
  },
  header: {
    gap: spacing.sm
  },
  status: {
    color: colors.primary,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  email: {
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    fontFamily,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  instructions: {
    gap: spacing.md
  },
  step: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  stepNumber: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: "#ffffff",
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black,
    height: 28,
    lineHeight: 28,
    overflow: "hidden",
    textAlign: "center",
    width: 28
  },
  stepText: {
    flex: 1
  },
  actions: {
    flexWrap: "wrap",
    justifyContent: "flex-start"
  }
});
