import { signInWithEmail, signUpWithEmail } from "@athmira/supabase";
import { Body, Button, Card, Field, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useLanguage } from "@/providers/LanguageProvider";

import { TurnstileChallenge } from "../../components/TurnstileChallenge";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const turnstileEnabled = isTurnstileEnabled();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError(t("authRequiredFields"));
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError(t("authInvalidEmail"));
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError(t("authNameRequired"));
        return;
      }

      if (password.length < 6) {
        setError(t("authPasswordTooShort"));
        return;
      }
    }

    if (turnstileEnabled && !captchaToken) {
      setError(t("turnstileRequired"));
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(normalizedEmail, password, captchaToken);
        router.replace("/dashboard");
      } else {
        const result = await signUpWithEmail({
          captchaToken,
          email: normalizedEmail,
          name,
          password,
          preferredLanguage: language
        });

        if (result.session) {
          router.replace("/dashboard");
        } else {
          router.replace({
            pathname: "/auth/confirm-email",
            params: { email: normalizedEmail }
          });
        }
      }
    } catch {
      setError(mode === "login" ? t("authLoginFailed") : t("authSignupFailed"));
      setCaptchaToken(null);
      setChallengeVersion((version) => version + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen centered maxWidth={520}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Heading>{mode === "login" ? t("login") : t("createAccount")}</Heading>
          <Body>{t("educationalNote")}</Body>
        </View>
        {mode === "signup" ? (
          <Field autoCapitalize="words" label={t("authName")} onChangeText={setName} value={name} />
        ) : null}
        <Field
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          label={t("authEmail")}
          onChangeText={setEmail}
          value={email}
        />
        <Field
          autoCapitalize="none"
          helper={mode === "signup" ? t("passwordHelp") : undefined}
          label={t("authPassword")}
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
        {turnstileEnabled ? (
          <TurnstileChallenge
            errorLabel={t("turnstileError")}
            key={challengeVersion}
            loadingLabel={t("turnstileLoading")}
            onTokenChange={setCaptchaToken}
          />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button disabled={turnstileEnabled && !captchaToken} loading={loading} onPress={submit}>
          {mode === "login" ? t("login") : t("createAccount")}
        </Button>
        <Inline style={styles.footer}>
          <Body>{mode === "login" ? t("newToathmira") : t("alreadyHaveAccount")}</Body>
          <LinkButton href={mode === "login" ? "/auth/signup" : "/auth/login"} variant="ghost">
            {mode === "login" ? t("signUpCta") : t("signInCta")}
          </LinkButton>
        </Inline>
      </Card>
    </Screen>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type AppExtra = {
  turnstileSiteKey?: string;
};

function isTurnstileEnabled() {
  if (Platform.OS !== "web") {
    return false;
  }

  const extra = Constants.expoConfig?.extra as AppExtra | undefined;
  return Boolean(
    process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      extra?.turnstileSiteKey
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
  },
  footer: {
    justifyContent: "center"
  }
});
