import { signInWithEmail, signUpWithEmail } from "@athmira/supabase";
import { Body, Button, Card, Field, Heading, Inline, Screen, colors, spacing } from "@athmira/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useLanguage } from "@/providers/LanguageProvider";
import { getErrorMessage } from "@/utils/form";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.replace("/dashboard");
      } else {
        const result = await signUpWithEmail({
          email,
          name,
          password,
          preferredLanguage: language
        });

        if (result.session) {
          router.replace("/dashboard");
        } else {
          setMessage(t("emailConfirmation"));
        }
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError));
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
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button loading={loading} onPress={submit}>
          {mode === "login" ? t("login") : t("createAccount")}
        </Button>
        <Inline style={styles.footer}>
          <Body>{mode === "login" ? t("newToAthmira") : t("alreadyHaveAccount")}</Body>
          <LinkButton href={mode === "login" ? "/auth/signup" : "/auth/login"} variant="ghost">
            {mode === "login" ? t("signUpCta") : t("signInCta")}
          </LinkButton>
        </Inline>
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
  },
  message: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  footer: {
    justifyContent: "center"
  }
});
