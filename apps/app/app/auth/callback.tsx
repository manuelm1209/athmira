import { supabase } from "@athmira/supabase";
import { Body, Card, Heading, colors, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { SeoHead } from "@/components/SeoHead";
import { useLanguage } from "@/providers/LanguageProvider";

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
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description") || hashParams.get("error_description");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        clearSensitiveCallbackUrl();

        if (errorDescription) {
          throw new Error(t("authCallbackError"));
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            throw sessionError;
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
      } catch {
        if (!cancelled) {
          setError(t("authCallbackError"));
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  return (
    <>
      <SeoHead
        canonicalPath="/auth/callback"
        description="Ruta privada de verificación de autenticación de athmira."
        noindex
        title="Verificación de acceso | athmira"
      />
      <Screen centered maxWidth={560}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Heading>{t("authCallbackTitle")}</Heading>
            <Body>{error ?? t("authCallbackBody")}</Body>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Card>
      </Screen>
    </>
  );
}

function clearSensitiveCallbackUrl() {
  if (typeof window === "undefined" || (!window.location.search && !window.location.hash)) {
    return;
  }

  window.history.replaceState(null, "", window.location.pathname);
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
