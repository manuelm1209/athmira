import { Link, type Href, usePathname } from "expo-router";
import { useEffect, useState, type PropsWithChildren } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { colors, radii, shadows, spacing, typography } from "@athmira/ui";

import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

import { LanguageToggle } from "./LanguageToggle";

const brandMarkSource = require("../../assets/brand/athmira-mark-solid-128.png");
const headerMotionStyle = Platform.select({
  default: undefined,
  web: {
    backdropFilter: "blur(18px)",
    transitionDuration: "260ms",
    transitionProperty:
      "background-color, border-color, border-radius, box-shadow, margin, padding, transform",
    transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  } as never
});

type NavItem = {
  href: Href;
  key: string;
  label: string;
};

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isAdmin, session, signOut } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [headerDocked, setHeaderDocked] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return undefined;
    }

    let animationFrame: number | null = null;

    function handleScroll(event: Event) {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(() => {
        const target = event.target as HTMLElement | Document | null;
        const scrollTop =
          target && "scrollingElement" in target
            ? target.scrollingElement?.scrollTop ?? 0
            : target && "scrollTop" in target
              ? target.scrollTop
              : 0;

        setHeaderDocked(scrollTop > 12);
      });
    }

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const navItems: NavItem[] = session
    ? [
        { href: "/dashboard", key: "dashboard", label: t("dashboard") },
        { href: "/bikes", key: "bikes", label: t("bikes") },
        { href: "/analysis", key: "analysis", label: t("camera") },
        { href: "/nutrition", key: "nutrition", label: t("nutritionPlanningNav") },
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
      <View
        accessibilityLabel="Main navigation"
        style={[styles.header, compact && styles.headerCompact, headerMotionStyle, headerDocked && styles.headerDocked]}
      >
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
        <View style={[styles.nav, compact && styles.navCompact]}>
          {session || compact ? null : (
            <View style={styles.marketingNav}>
              <Text style={styles.marketingNavText}>{t("homeNavFeatures")}</Text>
              <Text style={styles.marketingNavText}>{t("homeNavHowItWorks")}</Text>
              <Text style={styles.marketingNavText}>{t("homeNavScience")}</Text>
              <Text style={styles.marketingNavText}>{t("homeNavResources")}</Text>
            </View>
          )}
          {navItems.map((item) => (
            <Link href={item.href} asChild key={item.key}>
              <Pressable
                accessibilityRole="link"
                style={StyleSheet.flatten([
                  styles.navLink,
                  item.key === "signup" && styles.primaryNavLink,
                  pathname === item.href && styles.activeLink
                ])}
              >
                <Text
                  style={[
                    styles.navText,
                    item.key === "signup" && styles.primaryNavText,
                    pathname === item.href && styles.activeText
                  ]}
                >
                  {item.label}
                </Text>
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
    backgroundColor: "#f3f8fa",
    flex: 1
  },
  header: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderColor: "rgba(184,206,209,0.72)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...shadows.soft
  },
  headerCompact: {
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  headerDocked: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderBottomColor: "rgba(184,206,209,0.78)",
    borderColor: "rgba(184,206,209,0.34)",
    borderRadius: 0,
    borderTopColor: "transparent",
    marginHorizontal: 0,
    marginTop: 0,
    paddingVertical: spacing.sm,
    transform: [{ translateY: -1 }],
    ...shadows.medium
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
    color: colors.primary,
    fontFamily,
    fontSize: 21,
    fontWeight: typography.weights.black,
    letterSpacing: 1.2,
    textTransform: "uppercase"
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
    gap: spacing.xl
  },
  navCompact: {
    gap: spacing.sm,
    justifyContent: "flex-start",
    width: "100%"
  },
  marketingNav: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    justifyContent: "center"
  },
  marketingNavText: {
    color: colors.ink,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  navLink: {
    borderColor: "transparent",
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeLink: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  primaryNavLink: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  navText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  activeText: {
    color: colors.white
  },
  primaryNavText: {
    color: colors.white
  },
  content: {
    flex: 1
  }
});
