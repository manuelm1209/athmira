import { Link, type Href, usePathname } from "expo-router";
import { useEffect, useState, type PropsWithChildren } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type MarketingNavItem = {
  href: Href;
  key: string;
  label: string;
};

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { isAdmin, session, signOut } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== "web";
  const [webHydrated, setWebHydrated] = useState(Platform.OS !== "web");
  const compact = !webHydrated || width < 760;
  const [headerDocked, setHeaderDocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      setWebHydrated(true);
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
  const marketingNavItems: MarketingNavItem[] = [
    { href: "/#funciones" as Href, key: "features", label: t("homeNavFeatures") },
    { href: "/#como-funciona" as Href, key: "howItWorks", label: t("homeNavHowItWorks") },
    { href: "/#limitaciones" as Href, key: "science", label: t("homeNavScience") },
    { href: "/#progreso" as Href, key: "resources", label: t("homeNavResources") }
  ];
  const compactMenuItems = session ? navItems : [...marketingNavItems, ...navItems];

  return (
    <View style={[styles.root, !isNative && styles.webRoot, isNative && styles.nativeRoot]}>
      <View
        accessibilityLabel="Main navigation"
        style={[
          styles.header,
          compact && styles.headerCompact,
          isNative && styles.nativeHeader,
          isNative && { paddingTop: insets.top + spacing.sm },
          headerMotionStyle,
          !isNative && headerDocked && styles.headerDocked
        ]}
      >
        <View style={styles.headerMainRow}>
          <Link href={session ? "/dashboard" : "/"} asChild>
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                setMenuOpen(false);
              }}
              style={styles.brand}
            >
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="athmira logo"
                source={brandMarkSource}
                style={[styles.brandMark, compact && styles.brandMarkCompact]}
              />
              <View style={styles.brandCopy}>
                <Text allowFontScaling={false} style={[styles.brandName, compact && styles.brandNameCompact]}>
                  athmira
                </Text>
                <Text allowFontScaling={false} numberOfLines={1} style={[styles.brandTagline, compact && styles.brandTaglineCompact]}>
                  {t("tagline")}
                </Text>
              </View>
            </Pressable>
          </Link>

          {compact ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: menuOpen }}
              onPress={() => {
                setMenuOpen((current) => !current);
              }}
              style={styles.menuButton}
            >
              <Text allowFontScaling={false} style={styles.menuButtonText}>
                {menuOpen ? t("closeMenu") : t("menu")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {compact && menuOpen ? (
          <View style={styles.compactMenu}>
            <View style={styles.compactMenuGrid}>
              {compactMenuItems.map((item) => {
                const href = String(item.href);
                const active = pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link href={item.href} asChild key={item.key}>
                    <Pressable
                      accessibilityRole="link"
                      style={StyleSheet.flatten([styles.compactMenuItem, active && styles.compactMenuItemActive])}
                    >
                      <Text style={[styles.compactMenuItemText, active && styles.compactMenuItemTextActive]}>{item.label}</Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
            <View style={styles.compactMenuFooter}>
              <LanguageToggle />
              {session ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  style={styles.compactSignOut}
                >
                  <Text style={styles.compactSignOutText}>{t("logout")}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {compact ? null : (
          <View style={styles.nav}>
            {session ? null : (
              <View style={styles.marketingNav}>
                {marketingNavItems.map((item) => (
                  <Link href={item.href} asChild key={item.key}>
                    <Pressable accessibilityRole="link">
                      <Text style={styles.marketingNavText}>{item.label}</Text>
                    </Pressable>
                  </Link>
                ))}
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
        )}
      </View>
      <View style={[styles.content, !isNative && styles.webContent, isNative && styles.nativeContent]}>{children}</View>
    </View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#f3f8fa"
  },
  webRoot: {
    display: "block" as never,
    minHeight: "100vh" as never
  },
  nativeRoot: {
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
    gap: spacing.lg,
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...shadows.soft
  },
  headerCompact: {
    alignItems: "stretch",
    borderRadius: 14,
    gap: spacing.sm,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  nativeHeader: {
    borderRadius: 0,
    borderTopWidth: 0,
    marginHorizontal: 0,
    marginTop: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm
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
  headerMainRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    width: "100%"
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
    minWidth: 0
  },
  brandMark: {
    borderRadius: radii.md,
    height: 38,
    width: 38
  },
  brandMarkCompact: {
    borderRadius: radii.sm,
    height: 34,
    width: 34
  },
  brandCopy: {
    flexShrink: 1,
    minWidth: 0
  },
  brandName: {
    color: colors.primary,
    fontFamily,
    fontSize: 21,
    fontWeight: typography.weights.black,
    letterSpacing: 0
  },
  brandNameCompact: {
    fontSize: 20,
    lineHeight: 23
  },
  brandTagline: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  brandTaglineCompact: {
    fontSize: 11,
    lineHeight: 14
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  menuButtonText: {
    color: colors.white,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
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
  nativeHeaderActions: {
    flexGrow: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    width: "auto"
  },
  compactMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    width: "100%"
  },
  compactMenuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  compactMenuItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 128,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  compactMenuItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  compactMenuItemText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black,
    textAlign: "center"
  },
  compactMenuItemTextActive: {
    color: colors.white
  },
  compactMenuFooter: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.md
  },
  compactSignOut: {
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  compactSignOutText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
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
  content: {},
  webContent: {
    display: "block" as never
  },
  nativeContent: {
    flex: 1
  }
});
