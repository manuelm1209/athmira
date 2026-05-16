import { colors, spacing } from "@athmira/ui";
import Constants from "expo-constants";
import { useEffect, useId, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

type TurnstileChallengeProps = {
  errorLabel: string;
  loadingLabel: string;
  onTokenChange: (token: string | null) => void;
};

type TurnstileWidget = {
  remove: (widgetId: string) => void;
  render: (
    container: string | HTMLElement,
    options: {
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      sitekey: string;
      theme?: "auto" | "dark" | "light";
    }
  ) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileWidget;
  }
}

type AppExtra = {
  turnstileSiteKey?: string;
};

const extra = Constants.expoConfig?.extra as AppExtra | undefined;
const turnstileSiteKey =
  process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ??
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  extra?.turnstileSiteKey ??
  "";

export function TurnstileChallenge({ errorLabel, loadingLabel, onTokenChange }: TurnstileChallengeProps) {
  const reactId = useId();
  const containerId = `turnstile-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    Platform.OS === "web" && typeof window !== "undefined" && Boolean(window.turnstile)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onTokenChange(null);
  }, [onTokenChange]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    if (!turnstileSiteKey) {
      setError(errorLabel);
      return;
    }

    if (window.turnstile) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-athmira-turnstile]");

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      return () => existingScript.removeEventListener("load", handleLoad);
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.athmiraTurnstile = "true";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    function handleLoad() {
      setScriptReady(true);
    }

    function handleError() {
      setError(errorLabel);
      onTokenChange(null);
    }
  }, [errorLabel, onTokenChange]);

  useEffect(() => {
    if (Platform.OS !== "web" || !scriptReady || !turnstileSiteKey || widgetIdRef.current) {
      return;
    }

    const container = document.getElementById(containerId);

    if (!container || !window.turnstile) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(container, {
      callback: (token) => {
        setError(null);
        onTokenChange(token);
      },
      "error-callback": () => {
        setError(errorLabel);
        onTokenChange(null);
      },
      "expired-callback": () => {
        onTokenChange(null);
      },
      sitekey: turnstileSiteKey,
      theme: "light"
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [containerId, errorLabel, onTokenChange, scriptReady]);

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <div id={containerId} style={containerStyle} />
      {!scriptReady && !error ? <Text style={styles.helper}>{loadingLabel}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const containerStyle = {
  minHeight: 65
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  helper: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: "700"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800"
  }
});
