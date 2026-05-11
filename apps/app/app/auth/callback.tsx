import { supabase } from "@athmira/supabase";
import { Body, Card, Heading, Screen, colors, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

export default function AuthCallbackRoute() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        if (typeof window === "undefined") {
          throw new Error(t("authCallbackError"));
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description") ||
          new URLSearchParams(window.location.hash.replace(/^#/, "")).get("error_description");

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!data.session) {
          throw new Error(t("authCallbackError"));
        }

        if (!cancelled) {
          router.replace("/dashboard");
        }
      } catch (callbackError) {
        if (!cancelled) {
          setError(getErrorMessage(callbackError, t("authCallbackError")));
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  return (
    <Screen centered maxWidth={560}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Heading>{t("authCallbackTitle")}</Heading>
          <Body>{error ?? t("authCallbackBody")}</Body>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "700"
  }
});
