import { Body, FadeInView, Heading, Inline, Screen, colors, radii, shadows, spacing, typography } from "@athmira/ui";
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { visualAssets } from "@/lib/visual-assets";

const homeHeroImage = require("../assets/home/image-home-athmira.png");

const brandLogos = ["GIANT", "cervelo", "TREK", "SPECIALIZED", "wahoo", "GARMIN"];
const heroFadeWebStyle = Platform.select({
  default: undefined,
  web: {
    backgroundImage:
      "linear-gradient(90deg, #f3f8fa 0%, rgba(243,248,250,0.74) 38%, rgba(243,248,250,0) 100%)"
  } as never
});

export default function WelcomeRoute() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const mobile = width < 720;
  const heroMediaMobileSize = Math.max(300, width - spacing.xxl);

  const featureCards = [
    {
      body: t("homeBikeFitBody"),
      image: visualAssets.cyclistHero,
      link: "Learn more",
      stat: "146 deg",
      title: t("homeBikeFitTitle")
    },
    {
      body: t("homeAeroBody"),
      image: visualAssets.aeroTrack,
      link: "Learn more",
      stat: "Aero 76",
      title: t("homeAeroTitle")
    },
    {
      body: t("homeNutritionBody"),
      image: visualAssets.tireGauge,
      link: "Learn more",
      stat: "73 PSI",
      title: t("homeNutritionTitle")
    }
  ];

  const proofItems = [
    { icon: "CV", title: t("homeProofCamera") },
    { icon: "AI", title: t("homeProofPrivate") },
    { icon: "UP", title: t("homeProofProgress") }
  ];

  const steps = [
    { body: t("homeHowCameraBody"), icon: "01", title: t("homeHowCameraTitle") },
    { body: t("homeHowResultsBody"), icon: "02", title: t("homeHowResultsTitle") },
    { body: t("homeHowProfileBody"), icon: "03", title: t("homeHowProfileTitle") },
    { body: t("homeFinalBody"), icon: "04", title: t("homeFinalTitle") }
  ];

  return (
    <Screen maxWidth={1280}>
      <View style={styles.page}>
        <FadeInView style={[styles.hero, mobile && styles.heroMobile]}>
          <View style={[styles.heroCopy, mobile && styles.heroCopyMobile]}>
            <Heading style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>
              Fit. Fuel. Perform.{"\n"}
              <Text style={styles.heroTitleAccent}>All in one ride.</Text>
            </Heading>
            <Body style={[styles.heroBody, mobile && styles.mobileBody]}>{t("homeHeroBody")}</Body>
            <Inline style={styles.heroActions}>
              {session ? (
                <LinkButton href="/dashboard">{t("dashboard")}</LinkButton>
              ) : (
                <>
                  <LinkButton href="/auth/signup">{t("signUpCta")}</LinkButton>
                  <LinkButton href="/auth/login" variant="secondary">
                    {t("signInCta")}
                  </LinkButton>
                </>
              )}
            </Inline>
            {mobile ? null : (
              <View style={styles.proofGrid}>
                {proofItems.map((item) => (
                  <View key={item.title} style={styles.proofCard}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.iconText}>{item.icon}</Text>
                    </View>
                    <Text style={styles.proofTitle}>{item.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.heroMedia, mobile && styles.heroMediaMobile, mobile && { height: heroMediaMobileSize }]}>
            <Image
              accessibilityLabel="Cyclist with Athmira posture intelligence dashboard"
              resizeMode="cover"
              source={homeHeroImage}
              style={styles.heroImage}
            />
            <View style={[styles.heroFade, heroFadeWebStyle]} />
          </View>
        </FadeInView>

        <FadeInView delayMs={100} style={styles.brandStrip}>
          <Text style={styles.brandStripTitle}>TRUSTED BY ATHLETES WHO WANT MORE</Text>
          <View style={styles.logoRow}>
            {brandLogos.map((logo) => (
              <Text key={logo} style={styles.logoText}>
                {logo}
              </Text>
            ))}
          </View>
        </FadeInView>

        <FadeInView delayMs={160} style={styles.featureSection}>
          <View style={styles.centerHeader}>
            <Text style={styles.sectionTitle}>See what's possible with Athmira</Text>
            <Text style={styles.sectionBody}>{t("homeDashboardBody")}</Text>
          </View>
          <View style={styles.featureGrid}>
            {featureCards.map((feature) => (
              <View key={feature.title} style={styles.featureCard}>
                <Image
                  accessibilityLabel={feature.title}
                  resizeMode="cover"
                  source={{ uri: feature.image }}
                  style={styles.featureImage}
                />
                <View style={styles.featureCopy}>
                  <View style={styles.featureTopline}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureStatText}>{feature.stat}</Text>
                  </View>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                  <Text style={styles.featureLink}>{feature.link} -&gt;</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        <FadeInView delayMs={220} style={styles.workflowSection}>
          <Text style={styles.sectionTitle}>{t("homeHowTitle")}</Text>
          <View style={styles.stepRail}>
            {steps.map((step) => (
              <View key={step.icon} style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Text style={styles.stepIconText}>{step.icon}</Text>
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        <FadeInView delayMs={280} style={[styles.scienceSection, mobile && styles.scienceSectionMobile]}>
          <View style={styles.dashboardMock}>
            <View style={styles.mockHeader}>
              <View>
                <Text style={styles.mockTitle}>{t("dashboard")}</Text>
                <Text style={styles.mockSubtitle}>{t("dashboardProgressSnapshot")}</Text>
              </View>
              <View style={styles.mockStatus}>
                <Text style={styles.mockStatusText}>92</Text>
              </View>
            </View>
            <View style={styles.mockGrid}>
              <MockMetric trend="+6%" label="FTP" value="278 w" />
              <MockMetric trend="+4%" label="VO2max" value="58" />
              <MockMetric trend="Optimal" label={t("tirePressureNav")} value="73 psi" />
            </View>
            <View style={styles.analysisPreview}>
              <Image
                accessibilityLabel="Bike fit analysis preview"
                resizeMode="cover"
                source={{ uri: visualAssets.cyclistHero }}
                style={styles.analysisImage}
              />
              <View style={styles.analysisStats}>
                <Text style={styles.analysisLabel}>{t("kneeAngle")}</Text>
                <Text style={styles.analysisValue}>146 deg</Text>
                <Text style={styles.analysisGood}>Good</Text>
                <Text style={styles.analysisLabel}>{t("aeroScore")}</Text>
                <Text style={styles.analysisValue}>76</Text>
              </View>
            </View>
          </View>
          <View style={styles.scienceCopy}>
            <Text style={styles.sectionTitle}>{t("homeDashboardTitle")}</Text>
            <Body style={[styles.sectionBody, mobile && styles.mobileBody]}>{t("homeDashboardBody")}</Body>
            <Text style={styles.safetyNote}>{t("homeSafetyBody")}</Text>
          </View>
        </FadeInView>

        <FadeInView delayMs={340} style={styles.finalCta}>
          <Image
            accessibilityLabel="Cyclist training outdoors"
            resizeMode="cover"
            source={{ uri: visualAssets.aeroTrack }}
            style={styles.finalImage}
          />
          <View style={styles.finalOverlay} />
          <View style={styles.finalCopy}>
            <Text style={styles.finalTitle}>Ready to ride smarter?</Text>
            <Text style={styles.finalBody}>{t("homeFinalBody")}</Text>
          </View>
          <Inline style={styles.finalActions}>
            {session ? (
              <LinkButton href="/dashboard">{t("dashboard")}</LinkButton>
            ) : (
              <>
                <LinkButton href="/auth/signup">{t("createAccount")}</LinkButton>
                <LinkButton href="/auth/login" variant="secondary">
                  {t("login")}
                </LinkButton>
              </>
            )}
          </Inline>
        </FadeInView>

        <View style={styles.disclaimer}>
          <View style={styles.disclaimerIcon}>
            <Text style={styles.disclaimerIconText}>OK</Text>
          </View>
          <View style={styles.disclaimerCopy}>
            <Text style={styles.disclaimerTitle}>{t("homeSafetyTitle")}</Text>
            <Text style={styles.disclaimerText}>{t("homeSafetyBody")}</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function MockMetric({ label, trend, value }: { label: string; trend: string; value: string }) {
  return (
    <View style={styles.mockMetric}>
      <Text style={styles.mockMetricLabel}>{label}</Text>
      <Text style={styles.mockMetricValue}>{value}</Text>
      <Text style={styles.mockMetricTrend}>{trend} vs last block</Text>
      <View style={styles.sparkline}>
        {[8, 14, 10, 18, 15, 24].map((height, index) => (
          <View key={`${label}-${height}-${index}`} style={[styles.sparkBar, { height }]} />
        ))}
      </View>
    </View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  page: {
    gap: 54,
    paddingBottom: spacing.xxxl
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: 0,
    minHeight: 520,
    overflow: "hidden",
    paddingVertical: spacing.lg
  },
  heroMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    minHeight: 0,
    overflow: "visible",
    paddingVertical: 0
  },
  heroCopy: {
    flex: 0.82,
    gap: spacing.lg,
    maxWidth: 520,
    minWidth: 300,
    paddingLeft: spacing.md,
    zIndex: 2
  },
  heroCopyMobile: {
    maxWidth: "100%",
    minWidth: 0,
    paddingLeft: 0,
    width: "100%"
  },
  heroTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 66,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 70,
    maxWidth: 560
  },
  heroTitleAccent: {
    color: colors.primary
  },
  heroTitleMobile: {
    fontSize: 39,
    lineHeight: 43
  },
  heroBody: {
    color: colors.inkMuted,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 470
  },
  mobileBody: {
    maxWidth: 340,
    width: "100%"
  },
  heroActions: {
    gap: spacing.md,
    paddingTop: spacing.sm
  },
  proofGrid: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg
  },
  proofCard: {
    alignItems: "center",
    flexBasis: 96,
    flexGrow: 1,
    gap: spacing.sm,
    justifyContent: "center",
    maxWidth: 150
  },
  iconCircle: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  iconText: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  proofTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.black,
    lineHeight: 16,
    textAlign: "center"
  },
  heroMedia: {
    borderRadius: 0,
    flex: 1.14,
    height: 520,
    minWidth: 420,
    overflow: "hidden",
    position: "relative"
  },
  heroMediaMobile: {
    borderRadius: radii.xl,
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    marginTop: spacing.huge,
    minWidth: 0,
    width: "100%"
  },
  heroImage: {
    height: "100%",
    width: "100%"
  },
  heroFade: {
    backgroundColor: "rgba(244,248,250,0.18)",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: "18%"
  },
  brandStrip: {
    alignItems: "center",
    gap: spacing.lg
  },
  brandStripTitle: {
    color: colors.inkSubtle,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    letterSpacing: 4,
    textAlign: "center"
  },
  logoRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxxl,
    justifyContent: "center"
  },
  logoText: {
    color: "#8b969a",
    fontFamily,
    fontSize: 19,
    fontStyle: "italic",
    fontWeight: typography.weights.black,
    letterSpacing: 1
  },
  featureSection: {
    backgroundColor: "#eef5f7",
    borderColor: "rgba(184,206,209,0.36)",
    borderRadius: radii.xl,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
    ...shadows.soft
  },
  centerHeader: {
    alignItems: "center",
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: typography.weights.black,
    lineHeight: 40,
    textAlign: "center"
  },
  sectionBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 720,
    textAlign: "center"
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderColor: "rgba(184,206,209,0.62)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 260,
    flexGrow: 1,
    overflow: "hidden",
    ...shadows.soft
  },
  featureImage: {
    aspectRatio: 1.48,
    width: "100%"
  },
  featureCopy: {
    gap: spacing.sm,
    padding: spacing.lg
  },
  featureTopline: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  featureTitle: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black,
    lineHeight: 24
  },
  featureStatText: {
    color: colors.primary,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  featureBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    lineHeight: 21
  },
  featureLink: {
    color: colors.primary,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black,
    marginTop: spacing.xs
  },
  workflowSection: {
    gap: spacing.xl
  },
  stepRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  stepItem: {
    alignItems: "flex-start",
    flexBasis: 250,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.md
  },
  stepIcon: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  stepIconText: {
    color: colors.primary,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  stepCopy: {
    flex: 1,
    gap: spacing.xs
  },
  stepTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 16,
    fontWeight: typography.weights.black
  },
  stepBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    lineHeight: 19
  },
  scienceSection: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxxl
  },
  scienceSectionMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  dashboardMock: {
    backgroundColor: colors.surface,
    borderColor: "rgba(184,206,209,0.72)",
    borderRadius: radii.xl,
    borderWidth: 1,
    flexBasis: 620,
    flexGrow: 1,
    gap: spacing.lg,
    minWidth: 300,
    padding: spacing.xl,
    ...shadows.medium
  },
  mockHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  mockTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black
  },
  mockSubtitle: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  mockStatus: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 5,
    height: 74,
    justifyContent: "center",
    width: 74
  },
  mockStatusText: {
    color: colors.ink,
    fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.black
  },
  mockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  mockMetric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 150,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  mockMetricLabel: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  mockMetricValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 25,
    fontWeight: typography.weights.black
  },
  mockMetricTrend: {
    color: colors.primary,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  sparkline: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 5,
    height: 28,
    marginTop: spacing.xs
  },
  sparkBar: {
    backgroundColor: colors.aqua,
    borderRadius: radii.round,
    flex: 1,
    minHeight: 6
  },
  analysisPreview: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    overflow: "hidden"
  },
  analysisImage: {
    flex: 1.5,
    minHeight: 210
  },
  analysisStats: {
    flex: 0.8,
    gap: spacing.xs,
    justifyContent: "center",
    padding: spacing.lg
  },
  analysisLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  analysisValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.black
  },
  analysisGood: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.round,
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  scienceCopy: {
    flexBasis: 360,
    flexGrow: 1,
    gap: spacing.md
  },
  safetyNote: {
    backgroundColor: colors.amberSoft,
    borderColor: "#f4d08c",
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.bold,
    lineHeight: 21,
    padding: spacing.lg
  },
  finalCta: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    justifyContent: "space-between",
    minHeight: 150,
    overflow: "hidden",
    padding: spacing.xxl,
    position: "relative",
    ...shadows.medium
  },
  finalImage: {
    bottom: 0,
    left: 0,
    opacity: 0.44,
    position: "absolute",
    top: 0,
    width: 320
  },
  finalOverlay: {
    backgroundColor: "rgba(6,63,61,0.72)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  finalCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 260,
    zIndex: 2
  },
  finalTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 30,
    fontWeight: typography.weights.black,
    lineHeight: 36
  },
  finalBody: {
    color: "#d9efed",
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 620
  },
  finalActions: {
    zIndex: 2
  },
  disclaimer: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    marginTop: -spacing.xl
  },
  disclaimerIcon: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  disclaimerIconText: {
    color: colors.primary,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  disclaimerCopy: {
    flex: 1,
    maxWidth: 860
  },
  disclaimerTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  disclaimerText: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    lineHeight: 18
  }
});
