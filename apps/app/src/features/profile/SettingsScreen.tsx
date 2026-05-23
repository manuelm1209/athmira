import { Body, Button, Card, Checkbox, Heading, colors, spacing } from "@athmira/ui";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LanguageToggle } from "@/components/LanguageToggle";
import { NativeFooterLinks } from "@/components/AppFooter";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

export function SettingsScreen() {
  const { profile, signOut, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewsletterOptIn(profile?.newsletter_opt_in === true);
  }, [profile?.newsletter_opt_in]);

  async function updateNewsletterPreference(nextValue: boolean) {
    if (!profile) {
      return;
    }

    const previousValue = newsletterOptIn;
    setNewsletterOptIn(nextValue);
    setMessage(null);
    setError(null);
    setSavingNewsletter(true);

    try {
      await updateProfile({ newsletter_opt_in: nextValue });
      setMessage(t("newsletterPreferenceSaved"));
    } catch (saveError) {
      setNewsletterOptIn(previousValue);
      setError(getErrorMessage(saveError));
    } finally {
      setSavingNewsletter(false);
    }
  }

  return (
    <Screen maxWidth={680}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Heading>{t("settings")}</Heading>
          <Body>{t("educationalNote")}</Body>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t("language")}</Text>
          <LanguageToggle />
        </View>
        <View style={styles.preferenceRow}>
          <Checkbox
            checked={newsletterOptIn}
            disabled={savingNewsletter}
            label={t("newsletterOptIn")}
            onChange={updateNewsletterPreference}
          />
        </View>
        <View style={styles.footerLinksPanel}>
          <Text style={styles.label}>{t("footerMobileTitle")}</Text>
          <NativeFooterLinks />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button onPress={signOut} variant="secondary">
          {t("logout")}
        </Button>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  row: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  preferenceRow: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  footerLinksPanel: {
    gap: spacing.sm
  },
  label: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  error: {
    color: colors.danger,
    fontWeight: "700"
  },
  message: {
    color: colors.primary,
    fontWeight: "700"
  }
});
