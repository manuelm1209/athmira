import { Link, type Href, usePathname, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Path } from "react-native-svg";
import { colors, radii, shadows, spacing, typography } from "@athmira/ui";

import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { emitTabReselect } from "@/lib/tab-reselect";
import { getNotificationPreview } from "@/services/notifications/notification-service";

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

type MobileNavItem = NavItem & {
  icon: keyof typeof MaterialCommunityIcons.glyphMap | "nutrition-bottle" | "bike-custom";
};

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, session, signOut } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNative = Platform.OS !== "web";
  const [webHydrated, setWebHydrated] = useState(Platform.OS !== "web");
  const compact = !webHydrated || width < 760;
  const [headerDocked, setHeaderDocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const accountMenuRef = useRef<View | null>(null);
  const notificationMenuRef = useRef<View | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      setWebHydrated(true);
    }
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
    setNotificationMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS !== "web" || (!accountMenuOpen && !notificationMenuOpen)) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      const accountNode = accountMenuRef.current as unknown as HTMLElement | null;
      const notificationNode = notificationMenuRef.current as unknown as HTMLElement | null;

      if (accountNode && event.target instanceof Node && accountNode.contains(event.target)) {
        return;
      }

      if (notificationNode && event.target instanceof Node && notificationNode.contains(event.target)) {
        return;
      }

      setAccountMenuOpen(false);
      setNotificationMenuOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [accountMenuOpen, notificationMenuOpen]);

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

  const primaryNavItems: NavItem[] = session
    ? [
        { href: "/dashboard", key: "dashboard", label: t("dashboard") },
        { href: "/bikes", key: "bikes", label: t("bikes") },
        { href: "/analysis", key: "analysis", label: t("camera") },
        { href: "/nutrition", key: "nutrition", label: t("nutritionPlanningNav") },
        { href: "/tire-pressure", key: "tirePressure", label: t("tirePressureNav") }
      ]
    : [
        { href: "/auth/login", key: "login", label: t("login") },
        { href: "/auth/signup", key: "signup", label: t("createAccount") }
      ];
  const accountNavItems: NavItem[] = session
    ? [
        { href: "/profile", key: "profile", label: t("profile") },
        { href: "/settings", key: "settings", label: t("settings") },
        ...(isAdmin ? [{ href: "/admin" as const, key: "admin", label: t("admin") }] : [])
      ]
    : [];
  const navItems: NavItem[] = [...primaryNavItems, ...accountNavItems];
  const marketingNavItems: MarketingNavItem[] = [
    { href: "/#funciones" as Href, key: "features", label: t("homeNavFeatures") },
    { href: "/#como-funciona" as Href, key: "howItWorks", label: t("homeNavHowItWorks") },
    { href: "/#limitaciones" as Href, key: "science", label: t("homeNavScience") },
    { href: "/#progreso" as Href, key: "resources", label: t("homeNavResources") }
  ];
  const compactMenuItems = session ? navItems : [...marketingNavItems, ...navItems];
  const mobileAppNavItems: MobileNavItem[] = session
    ? [
        { href: "/dashboard", icon: "home-variant", key: "mobileHome", label: t("mobileHome") },
        { href: "/bikes", icon: "bike-custom", key: "mobileBike", label: t("mobileBike") },
        { href: "/nutrition", icon: "nutrition-bottle", key: "mobileNutrition", label: t("nutritionPlanningNav") },
        { href: "/analysis", icon: "bike-fast", key: "mobileBikeFit", label: t("camera") },
        { href: "/profile", icon: "account", key: "mobileYou", label: t("mobileYou") }
      ]
    : [];
  const accountMenuActive = accountNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const mobileAppChrome = Boolean(session) && compact;
  const notificationPreview = getNotificationPreview();

  return (
    <View style={styles.root}>
      <View
        accessibilityLabel="Main navigation"
        style={[
          styles.header,
          compact && styles.headerCompact,
          mobileAppChrome && styles.mobileAppHeader,
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
                setNotificationMenuOpen(false);
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
            mobileAppChrome ? (
              <View ref={notificationMenuRef} style={styles.notificationWrapper}>
                <Pressable
                  accessibilityLabel={t("notifications")}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: notificationMenuOpen }}
                  onPress={() => {
                    setNotificationMenuOpen((current) => !current);
                    setAccountMenuOpen(false);
                  }}
                  style={({ pressed }) => [styles.iconButton, pressed && styles.pressedControl]}
                >
                  <MaterialCommunityIcons color={colors.ink} name="bell-outline" size={22} />
                  {notificationPreview.unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
                </Pressable>
                {notificationMenuOpen ? (
                  <View style={styles.notificationMenu}>
                    <Text style={styles.notificationTitle}>{t("notifications")}</Text>
                    <Text style={styles.notificationEmptyText}>{t("noNotifications")}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
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
            )
          ) : (
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
              {primaryNavItems.map((item) => (
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
              {session ? (
                <View ref={accountMenuRef} style={styles.accountMenuWrapper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: accountMenuOpen }}
                    onPress={() => {
                      setAccountMenuOpen((current) => !current);
                    }}
                    style={StyleSheet.flatten([
                      styles.navLink,
                      styles.accountTrigger,
                      (accountMenuOpen || accountMenuActive) && styles.accountTriggerActive
                    ])}
                  >
                    <Text
                      style={[
                        styles.navText,
                        (accountMenuOpen || accountMenuActive) && styles.activeText
                      ]}
                    >
                      {t("account")}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.accountTriggerCaret,
                        (accountMenuOpen || accountMenuActive) && styles.activeText
                      ]}
                    >
                      {accountMenuOpen ? "▴" : "▾"}
                    </Text>
                  </Pressable>
                  {accountMenuOpen ? (
                    <View style={styles.accountMenu}>
                      {accountNavItems.map((item) => {
                        const href = String(item.href);
                        const active = pathname === href || pathname.startsWith(`${href}/`);

                        return (
                          <Link href={item.href} asChild key={item.key}>
                            <Pressable
                              accessibilityRole="link"
                              onPress={() => {
                                setAccountMenuOpen(false);
                              }}
                              style={StyleSheet.flatten([styles.accountMenuItem, active && styles.accountMenuItemActive])}
                            >
                              <Text style={[styles.accountMenuItemText, active && styles.compactMenuItemTextActive]}>
                                {item.label}
                              </Text>
                            </Pressable>
                          </Link>
                        );
                      })}
                      <View style={styles.accountMenuDivider} />
                      <View style={styles.accountMenuLanguageRow}>
                        <LanguageToggle />
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setAccountMenuOpen(false);
                          signOut();
                        }}
                        style={styles.accountMenuSignOut}
                      >
                        <Text style={styles.accountMenuSignOutText}>{t("logout")}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ) : (
                <LanguageToggle />
              )}
            </View>
          )}
        </View>

        {compact && !mobileAppChrome && menuOpen ? (
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

      </View>
      <View style={[styles.content, mobileAppChrome && styles.contentWithMobileNav]}>{children}</View>
      {mobileAppChrome && accountMenuOpen ? (
        <View
          ref={accountMenuRef}
          style={[
            styles.mobileAccountSheet,
            { bottom: 72 + Math.max(insets.bottom, spacing.sm) }
          ]}
        >
          {accountNavItems.map((item) => {
            const href = String(item.href);
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Pressable
                accessibilityRole="link"
                key={item.key}
                onPress={() => {
                  setAccountMenuOpen(false);
                  router.push(item.href);
                }}
                style={({ pressed }) => [
                  styles.mobileAccountItem,
                  active && styles.mobileAccountItemActive,
                  pressed && styles.pressedControl
                ]}
              >
                <Text style={[styles.mobileAccountItemText, active && styles.compactMenuItemTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.accountMenuDivider} />
          <View style={styles.accountMenuLanguageRow}>
            <LanguageToggle />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setAccountMenuOpen(false);
              signOut();
            }}
            style={({ pressed }) => [styles.mobileAccountItem, pressed && styles.pressedControl]}
          >
            <Text style={styles.mobileAccountItemText}>{t("logout")}</Text>
          </Pressable>
        </View>
      ) : null}
      {mobileAppChrome ? (
        <View
          accessibilityLabel="Mobile navigation"
          style={[
            styles.mobileBottomNav,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) }
          ]}
        >
          {mobileAppNavItems.map((item) => {
            const href = String(item.href);
            const isYou = item.key === "mobileYou";
            const active =
              isYou
                ? accountMenuOpen || accountMenuActive
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <View key={item.key} style={styles.mobileNavSlot}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={isYou ? { expanded: accountMenuOpen, selected: active } : { selected: active }}
                  onPress={() => {
                    if (isYou) {
                      setAccountMenuOpen((current) => !current);
                      setNotificationMenuOpen(false);
                    } else {
                      setAccountMenuOpen(false);
                      setNotificationMenuOpen(false);
                      if (pathname === href) {
                        emitTabReselect(item.key);
                        return;
                      }
                      router.push(item.href);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.mobileNavItem,
                    active && styles.mobileNavItemActive,
                    pressed && styles.pressedControl
                  ]}
                >
                  <View style={styles.mobileNavIconFrame}>
                    <MobileNavIcon active={active} icon={item.icon} />
                  </View>
                  <View style={styles.mobileNavLabelFrame}>
                    <Text
                      numberOfLines={1}
                      style={[styles.mobileNavLabel, active && styles.mobileNavLabelActive]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

function MobileNavIcon({ active, icon }: { active: boolean; icon: MobileNavItem["icon"] }) {
  const color = active ? colors.primary : colors.inkMuted;

  if (icon === "bike-custom") {
    return (
      <Svg fill="none" height={26} viewBox="0 0 24 24" width={26}>
        <Path
          d="M7 12.5L8.5 9.5M8.5 9.5H16M8.5 9.5L10.5 16.5L16 9.5M8.5 9.5L7.5 7M16 9.5L17 12.5M16 9.5L15.5 8.5L18.5 8V9.5M9 15.5C9 17.433 7.433 19 5.5 19C3.567 19 2 17.433 2 15.5C2 13.567 3.567 12 5.5 12C7.433 12 9 13.567 9 15.5Z"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Circle cx={18.5} cy={15.5} r={3.5} stroke={color} strokeWidth={1.6} />
        <Path d="M7 7H9.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    );
  }

  if (icon === "nutrition-bottle") {
    return (
      <Svg fill={color} height={22} viewBox="0 0 60 60" width={22}>
        <G>
          <G>
            <Path d="M43.977,17.987c0.158-0.998-0.127-2.01-0.783-2.778C42.537,14.44,41.581,14,40.571,14h-1.76v-2h1c0.553,0,1-0.448,1-1c0-2.757-2.243-5-5-5h-3V5.347C32.812,5.156,32.967,5,33.158,5h0.653c0.553,0,1-0.448,1-1V1c0-0.552-0.447-1-1-1h-7c-0.553,0-1,0.448-1,1v3c0,0.552,0.447,1,1,1h0.653c0.191,0,0.347,0.156,0.347,0.347V6h-3c-2.757,0-5,2.243-5,5c0,0.552,0.447,1,1,1h1v2h-2.385c-1.01,0-1.966,0.44-2.622,1.209c-0.656,0.768-0.941,1.78-0.78,2.796l1.8,10.151c0.507,3.212,0.718,6.54,0.645,9.844l0,0l0,0c-0.049,2.188-0.219,4.366-0.522,6.493l-1.143,6.793c-0.33,2.31,0.396,4.611,1.994,6.314c1.446,1.544,3.429,2.4,5.514,2.4c0.196,0,0.395-0.008,0.592-0.023c3.482-0.271,6.914-0.3,10.199-0.088c2.325,0.148,4.557-0.74,6.132-2.442c1.563-1.69,2.273-3.968,1.95-6.228l-0.807-6.7c-0.305-2.139-0.476-4.324-0.525-6.518l0,0l0,0c-0.074-3.309,0.138-6.637,0.646-9.856L43.977,17.987z M27.812,2h5v1.025c-1.13,0.168-2,1.145-2,2.321V6h-1V5.347c0-1.176-0.87-2.153-2-2.321V2z M24.812,8h4h3h4c1.304,0,2.416,0.836,2.829,2H21.983C22.396,8.836,23.508,8,24.812,8z M36.812,12v2h-13v-2H36.812z M39.766,56.088c-1.163,1.258-2.811,1.919-4.534,1.805c-3.379-0.218-6.907-0.188-10.482,0.09c-1.689,0.126-3.327-0.507-4.492-1.75c-1.18-1.258-1.717-2.958-1.477-4.639L19.553,47h21.109l0.539,4.48C41.443,53.163,40.919,54.843,39.766,56.088z M39.883,39c0.026,0.669,0.062,1.335,0.111,2H20.326c0.049-0.665,0.085-1.332,0.111-2H39.883z M20.452,35h19.415c-0.02,0.667-0.029,1.333-0.026,2H20.479C20.481,36.333,20.472,35.667,20.452,35z M39.962,33H20.358c-0.043-0.669-0.098-1.335-0.164-2h19.932C40.06,31.664,40.005,32.331,39.962,33z M40.176,43c0.065,0.596,0.135,1.19,0.219,1.779L40.421,45H19.89l0.033-0.199c0.085-0.596,0.156-1.198,0.222-1.801H40.176z M40.362,29H19.959c-0.053-0.392-0.101-0.785-0.163-1.174L19.65,27h20.995l-0.123,0.844C40.461,28.227,40.414,28.614,40.362,29z M42,17.687L40.936,25H19.295l-1.299-7.326c-0.066-0.419,0.054-0.844,0.329-1.167C18.602,16.185,19.003,16,19.427,16h2.385h17h1.76c0.424,0,0.825,0.185,1.102,0.508C41.948,16.83,42.069,17.255,42,17.687z" />
          </G>
        </G>
      </Svg>
    );
  }

  return <MaterialCommunityIcons color={color} name={icon} size={22} style={styles.mobileNavIcon} />;
}

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
    flexDirection: "column",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    position: "relative",
    zIndex: 100,
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
  mobileAppHeader: {
    borderBottomColor: colors.border,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    gap: 0,
    marginHorizontal: 0,
    marginTop: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowOpacity: 0.05
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
  notificationWrapper: {
    flexShrink: 0,
    position: "relative",
    zIndex: 260
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  pressedControl: {
    opacity: 0.74
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    borderRadius: radii.round,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 9,
    top: 9,
    width: 10
  },
  notificationMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.xs,
    minWidth: 220,
    padding: spacing.md,
    position: "absolute",
    right: 0,
    top: "100%",
    zIndex: 320,
    ...shadows.medium
  },
  notificationTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  notificationEmptyText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.medium,
    lineHeight: 18
  },
  nav: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "flex-end"
  },
  accountMenuWrapper: {
    position: "relative",
    zIndex: 200
  },
  accountTrigger: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  accountTriggerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  accountTriggerCaret: {
    color: colors.ink,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black
  },
  accountMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    minWidth: 200,
    padding: spacing.sm,
    position: "absolute",
    right: 0,
    top: "100%",
    ...shadows.medium,
    marginTop: spacing.xs,
    zIndex: 300
  },
  accountMenuItem: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  accountMenuItemActive: {
    backgroundColor: colors.primary
  },
  accountMenuItemText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  accountMenuDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xs
  },
  accountMenuLanguageRow: {
    alignItems: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  accountMenuSignOut: {
    alignItems: "flex-start",
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  accountMenuSignOutText: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
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
  content: {
    flex: 1
  },
  contentWithMobileNav: {
    paddingBottom: 84
  },
  mobileAccountSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    left: spacing.lg,
    padding: spacing.sm,
    position: "absolute",
    right: spacing.lg,
    zIndex: 250,
    ...shadows.medium
  },
  mobileAccountItem: {
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: "100%"
  },
  mobileAccountItemActive: {
    backgroundColor: colors.primary
  },
  mobileAccountItemText: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  mobileBottomNav: {
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-around",
    left: 0,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    position: "absolute",
    right: 0,
    zIndex: 220,
    ...shadows.medium
  },
  mobileNavSlot: {
    flex: 1,
    minWidth: 0
  },
  mobileNavItem: {
    alignItems: "center",
    borderRadius: radii.md,
    flexDirection: "column",
    gap: 3,
    justifyContent: "center",
    minHeight: 56,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    width: "100%"
  },
  mobileNavItemActive: {
    backgroundColor: colors.primaryMist
  },
  mobileNavIconFrame: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: "100%"
  },
  mobileNavIcon: {
    lineHeight: 24
  },
  mobileNavLabelFrame: {
    alignItems: "center",
    minWidth: 0,
    width: "100%"
  },
  mobileNavLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.black,
    lineHeight: 14,
    textAlign: "center"
  },
  mobileNavLabelActive: {
    color: colors.primary
  }
});
