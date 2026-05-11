import { Link, type Href, usePathname } from "expo-router";
import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@athmira/ui";

import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

import { LanguageToggle } from "./LanguageToggle";

type NavItem = {
  href: Href;
  key: string;
  label: string;
};

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const { t } = useLanguage();

  const navItems: NavItem[] = session
    ? [
        { href: "/dashboard", key: "dashboard", label: t("dashboard") },
        { href: "/bikes", key: "bikes", label: t("bikes") },
        { href: "/analysis", key: "analysis", label: t("camera") },
        { href: "/profile", key: "profile", label: t("profile") },
        { href: "/settings", key: "settings", label: t("settings") }
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
            <Text style={styles.brandName}>Athmira</Text>
            <Text style={styles.brandTagline}>{t("tagline")}</Text>
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
    paddingVertical: spacing.md
  },
  brand: {
    gap: 2
  },
  brandName: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900"
  },
  brandTagline: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  nav: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  navLink: {
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeLink: {
    backgroundColor: colors.primarySoft
  },
  navText: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "800"
  },
  activeText: {
    color: colors.primaryDark
  },
  content: {
    flex: 1
  }
});
