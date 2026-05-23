import { DEFAULT_FOOTER_SETTINGS, getFooterSettings } from "@athmira/supabase";
import type { FooterSettings } from "@athmira/types";
import { colors, radii, spacing, typography } from "@athmira/ui";
import { Link } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useLanguage } from "@/providers/LanguageProvider";

const brandMarkSource = require("../../assets/brand/athmira-mark-solid-128.png");

type FooterPlacement = "web" | "nativeSettings";

type SocialLink = {
  field: keyof Pick<
    FooterSettings,
    "facebook_url" | "instagram_url" | "linkedin_url" | "strava_url" | "tiktok_url" | "x_url" | "youtube_url"
  >;
  label: string;
  shortLabel: string;
};

const socialLinks: SocialLink[] = [
  { field: "instagram_url", label: "Instagram", shortLabel: "IG" },
  { field: "strava_url", label: "Strava", shortLabel: "ST" },
  { field: "x_url", label: "X", shortLabel: "X" },
  { field: "facebook_url", label: "Facebook", shortLabel: "f" },
  { field: "linkedin_url", label: "LinkedIn", shortLabel: "in" },
  { field: "youtube_url", label: "YouTube", shortLabel: "YT" },
  { field: "tiktok_url", label: "TikTok", shortLabel: "TT" }
];

export function AppFooter() {
  return <FooterContent placement="web" />;
}

export function NativeFooterLinks() {
  if (Platform.OS === "web") {
    return null;
  }

  return <FooterContent placement="nativeSettings" />;
}

function FooterContent({ placement }: { placement: FooterPlacement }) {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 720 || placement === "nativeSettings";
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);

  useEffect(() => {
    let active = true;

    getFooterSettings()
      .then((nextSettings) => {
        if (active) {
          setSettings(nextSettings);
        }
      })
      .catch(() => {
        if (active) {
          setSettings(DEFAULT_FOOTER_SETTINGS);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const activeSocialLinks = useMemo(
    () => socialLinks.filter((socialLink) => Boolean(settings[socialLink.field])),
    [settings]
  );
  const appLinks = useMemo(
    () =>
      [
        settings.app_store_url
          ? { label: t("footerAppStore"), platform: "iOS", url: settings.app_store_url }
          : null,
        settings.google_play_url
          ? { label: t("footerGooglePlay"), platform: "Android", url: settings.google_play_url }
          : null
      ].filter(Boolean) as { label: string; platform: string; url: string }[],
    [settings.app_store_url, settings.google_play_url, t]
  );

  return (
    <View style={placement === "web" ? styles.footerBand : styles.nativePanel}>
      <View style={[styles.footerInner, compact && styles.footerInnerCompact]}>
        <View style={[styles.brandBlock, compact && styles.brandBlockCompact]}>
          <View style={styles.brandRow}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="athmira logo"
              source={brandMarkSource}
              style={styles.brandMark}
            />
            <View>
              <Text style={styles.brandName}>athmira</Text>
              <Text style={styles.tagline}>{t("tagline")}</Text>
            </View>
          </View>
          <Text style={styles.footerCopy}>{t("footerDescription")}</Text>
        </View>

        <View style={[styles.footerActions, compact && styles.footerActionsCompact]}>
          {appLinks.length ? (
            <View style={styles.appLinks}>
              {appLinks.map((appLink) => (
                <ExternalLink key={appLink.platform} label={appLink.label} url={appLink.url}>
                  <View style={styles.storeButton}>
                    <Text style={styles.storePlatform}>{appLink.platform}</Text>
                    <Text style={styles.storeText}>{appLink.label}</Text>
                  </View>
                </ExternalLink>
              ))}
            </View>
          ) : null}

          {activeSocialLinks.length ? (
            <View accessibilityLabel={t("footerSocialLinks")} style={styles.socialLinks}>
              {activeSocialLinks.map((socialLink) => (
                <ExternalLink
                  key={socialLink.field}
                  label={socialLink.label}
                  url={settings[socialLink.field] ?? ""}
                >
                  <View style={styles.socialIcon}>
                    <Text style={styles.socialIconText}>{socialLink.shortLabel}</Text>
                  </View>
                </ExternalLink>
              ))}
            </View>
          ) : null}

          <View style={styles.legalLinks}>
            <Link href="/privacy" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.legalText}>{t("privacyPolicy")}</Text>
              </Pressable>
            </Link>
            <Link href="/terms" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.legalText}>{t("termsConditions")}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

function ExternalLink({ children, label, url }: { children: ReactNode; label: string; url: string }) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="link"
      onPress={() => {
        void Linking.openURL(url);
      }}
    >
      {children}
    </Pressable>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  footerBand: {
    backgroundColor: "#082f34",
    borderTopColor: "rgba(255,255,255,0.12)",
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl
  },
  nativePanel: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  footerInner: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.xl,
    justifyContent: "space-between",
    maxWidth: 1120,
    width: "100%"
  },
  footerInnerCompact: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.lg
  },
  brandBlock: {
    flexBasis: 320,
    flexGrow: 1,
    gap: spacing.md
  },
  brandBlockCompact: {
    flexBasis: "auto" as never,
    flexGrow: 0
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  brandMark: {
    borderRadius: radii.sm,
    height: 36,
    width: 36
  },
  brandName: {
    color: Platform.OS === "web" ? "#ffffff" : colors.primary,
    fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 24
  },
  tagline: {
    color: Platform.OS === "web" ? "rgba(255,255,255,0.72)" : colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  footerCopy: {
    color: Platform.OS === "web" ? "rgba(255,255,255,0.68)" : colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
    maxWidth: 420
  },
  footerActions: {
    alignItems: "flex-end",
    flexBasis: 420,
    flexGrow: 1,
    gap: spacing.md
  },
  footerActionsCompact: {
    alignItems: "flex-start",
    flexBasis: "auto" as never,
    flexGrow: 0
  },
  appLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  storeButton: {
    backgroundColor: Platform.OS === "web" ? "#ffffff" : colors.ink,
    borderRadius: radii.sm,
    minWidth: 146,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  storePlatform: {
    color: Platform.OS === "web" ? colors.inkMuted : "rgba(255,255,255,0.72)",
    fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  storeText: {
    color: Platform.OS === "web" ? colors.ink : "#ffffff",
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  socialLinks: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  socialIcon: {
    alignItems: "center",
    borderColor: Platform.OS === "web" ? "rgba(255,255,255,0.28)" : colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  socialIconText: {
    color: Platform.OS === "web" ? "#ffffff" : colors.primaryDark,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black
  },
  legalLinks: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  legalText: {
    color: Platform.OS === "web" ? "rgba(255,255,255,0.78)" : colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  }
});
