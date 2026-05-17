import { Link, type Href, usePathname } from "expo-router";
import type { PropsWithChildren } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows, spacing, typography } from "@athmira/ui";

import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

import { LanguageToggle } from "./LanguageToggle";

const brandMarkSource = require("../../assets/brand/athmira-mark-solid-128.png");

type NavItem = {
  href: Href;
  key: string;
  label: string;
};

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isAdmin, session, signOut } = useAuth();
  const { t } = useLanguage();

  const navItems: NavItem[] = session
    ? [
        { href: "/dashboard", key: "dashboard", label: t("dashboard") },
        { href: "/bikes", key: "bikes", label: t("bikes") },
        { href: "/analysis", key: "analysis", label: t("camera") },
        { href: "/tire-pressure", key: "tirePressure", label: t("tirePressureNav") },
        { href: "/profile", key: "profile", label: t("profile") },
        { href: "/settings", key: "settings", label: t("settings") },
        ...(isAdmin ? [{ href: "/admin" as const, key: "admin", label: t("admin") }] : [])
      ]
    : [
        { href: "/auth/login", key: "login", label: t("login") },
        { href: "/auth/signup", key: "signup", label: t("createAccount") }
      ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Link href={session ? "/dashboard" : "/"} asChild>
          <Pressable accessibilityRole="link" style={styles.brand}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="Athmira logo"
              source={brandMarkSource}
              style={styles.brandMark}
            />
            <View>
              <Text style={styles.brandName}>Athmira</Text>
              <Text style={styles.brandTagline}>{t("tagline")}</Text>
            </View>
          </Pressable>
        </Link>
        <View style={styles.nav}>
          {navItems.map((item) => (
            <Link href={item.href} asChild key={item.key}>
              <Pressable
                accessibilityRole="link"
                style={StyleSheet.flatten([styles.navLink, pathname === item.href && styles.activeLink])}
              >
                <Text style={[styles.navText, pathname === item.href && styles.activeText]}>{item.label}</Text>
              </Pressable>
            </Link>
          ))}
          <LanguageToggle />
          {session ? (
            <Pressable accessibilityRole="button" onPress={signOut} style={styles.navLink}>
              <Text style={styles.navText}>{t("logout")}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...shadows.soft
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  brandMark: {
    borderRadius: radii.md,
    height: 38,
    width: 38
  },
  brandName: {
    color: colors.ink,
    fontFamily,
    fontSize: 21,
    fontWeight: typography.weights.black
  },
  brandTagline: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  nav: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  navLink: {
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeLink: {
    backgroundColor: colors.primarySoft
  },
  navText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  activeText: {
    color: colors.primaryDark
  },
  content: {
    flex: 1
  }
});
