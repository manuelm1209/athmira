import { Body, FadeInView, Heading, Inline, Screen, colors, radii, shadows, spacing, typography } from "@athmira/ui";
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { LinkButton } from "@/components/LinkButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { visualAssets } from "@/lib/visual-assets";

export default function WelcomeRoute() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const mobile = width < 640;

  const proofItems = [t("homeProofCamera"), t("homeProofPrivate"), t("homeProofProgress")];
  const featureCards = [
    {
      body: t("homeBikeFitBody"),
      image: visualAssets.cyclistHero,
      stat: "145 deg",
      title: t("homeBikeFitTitle")
    },
    {
      body: t("homeAeroBody"),
      image: visualAssets.aeroTrack,
      stat: "76",
      title: t("homeAeroTitle")
    },
    {
      body: t("homeNutritionBody"),
      image: visualAssets.tireGauge,
      stat: "82 PSI",
      title: t("homeNutritionTitle")
    }
  ];
  const steps = [
    { body: t("homeHowProfileBody"), number: "01", title: t("homeHowProfileTitle") },
    { body: t("homeHowCameraBody"), number: "02", title: t("homeHowCameraTitle") },
    { body: t("homeHowResultsBody"), number: "03", title: t("homeHowResultsTitle") }
  ];

  return (
    <Screen maxWidth={1240}>
      <View style={styles.page}>
        <FadeInView style={[styles.hero, mobile && styles.heroMobile]}>
          <View style={[styles.heroCopy, mobile && styles.heroCopyMobile]}>
            <Heading style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>{t("welcomeTitle")}</Heading>
            <Text style={styles.heroTagline}>{t("tagline")}</Text>
            <Body style={[styles.heroBody, mobile && styles.fullWidthText]}>{t("homeHeroBody")}</Body>
            <Inline>
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
              <View style={styles.proofRow}>
                {proofItems.map((item) => (
                  <View key={item} style={styles.proofItem}>
                    <View style={styles.proofDot} />
                    <Text style={styles.proofText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.heroVisual, mobile && styles.heroVisualMobile]}>
            <Image
              accessibilityLabel="Cyclist in aero road posture"
              resizeMode="cover"
              source={{ uri: visualAssets.cyclistHero }}
              style={styles.heroImage}
            />
            <View style={styles.scanFrame}>
              <View style={styles.scanLineLong} />
              <View style={styles.scanLineShort} />
              <View style={styles.scanJoint} />
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.metricLabel}>{t("kneeAngle")}</Text>
              <Text style={styles.metricValue}>145 deg</Text>
              <Text style={styles.metricHint}>{t("fitConfidence")} 91%</Text>
            </View>
            {mobile ? null : (
              <View style={styles.heroMetricSecondary}>
                <Text style={styles.metricLabel}>{t("aeroScore")}</Text>
                <Text style={styles.metricValueSmall}>76</Text>
              </View>
            )}
          </View>
        </FadeInView>

        <FadeInView delayMs={120} style={styles.featureSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("homeDashboardTitle")}</Text>
            <Body style={[styles.sectionBody, mobile && styles.fullWidthText]}>{t("homeDashboardBody")}</Body>
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
                  <View style={styles.featureStat}>
                    <Text style={styles.featureStatText}>{feature.stat}</Text>
                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        <FadeInView delayMs={180} style={styles.workflowSection}>
          <View style={styles.workflowCopy}>
            <Text style={[styles.sectionTitle, styles.inverseTitle]}>{t("homeHowTitle")}</Text>
            <Body style={[styles.sectionBody, styles.inverseBody, mobile && styles.fullWidthText]}>{t("analysisIntro")}</Body>
          </View>
          <View style={styles.stepList}>
            {steps.map((step) => (
              <View key={step.number} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{step.number}</Text>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        <FadeInView delayMs={240} style={styles.previewSection}>
          <View style={styles.dashboardMock}>
            <View style={styles.mockHeader}>
              <View>
                <Text style={styles.mockTitle}>{t("dashboard")}</Text>
                <Text style={styles.mockSubtitle}>{t("dashboardProgressSnapshot")}</Text>
              </View>
              <View style={styles.mockStatus}>
                <Text style={styles.mockStatusText}>91%</Text>
              </View>
            </View>
            <View style={styles.mockGrid}>
              <MockMetric label={t("comfortScore")} value="82" />
              <MockMetric label={t("aeroScore")} value="76" />
              <MockMetric label={t("confidenceScore")} value="91%" />
            </View>
            <View style={styles.chart}>
              {[38, 58, 48, 72, 64, 86].map((height, index) => (
                <View key={`${height}-${index}`} style={styles.chartColumn}>
                  <View style={[styles.chartBar, { height }]} />
                </View>
              ))}
            </View>
          </View>
          <View style={styles.previewCopy}>
            <Text style={styles.sectionTitle}>{t("homeDashboardTitle")}</Text>
            <Body style={[styles.sectionBody, mobile && styles.fullWidthText]}>{t("homeDashboardBody")}</Body>
            <Text style={styles.safetyNote}>{t("homeSafetyBody")}</Text>
          </View>
        </FadeInView>

        <FadeInView delayMs={300} style={styles.finalCta}>
          <View style={styles.finalCopy}>
            <Text style={styles.finalTitle}>{t("homeFinalTitle")}</Text>
            <Text style={styles.finalBody}>{t("homeFinalBody")}</Text>
          </View>
          <Inline>
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
      </View>
    </Screen>
  );
}

function MockMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mockMetric}>
      <Text style={styles.mockMetricValue}>{value}</Text>
      <Text style={styles.mockMetricLabel}>{label}</Text>
    </View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  page: {
    gap: spacing.xxxl
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxxl,
    justifyContent: "space-between",
    paddingVertical: spacing.xxl
  },
  heroMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.xxl
  },
  heroCopy: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 640,
    minWidth: 280
  },
  heroCopyMobile: {
    maxWidth: "100%",
    minWidth: 0,
    paddingBottom: spacing.xxl,
    width: "100%"
  },
  heroTitle: {
    fontSize: typography.sizes.hero,
    lineHeight: typography.lineHeights.hero,
    maxWidth: 620
  },
  heroTitleMobile: {
    fontSize: 44,
    lineHeight: 48
  },
  heroTagline: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.black,
    lineHeight: 30
  },
  heroBody: {
    maxWidth: 600
  },
  fullWidthText: {
    maxWidth: 330,
    width: "100%"
  },
  proofRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingTop: spacing.sm
  },
  proofItem: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderColor: colors.border,
    borderRadius: radii.round,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.sm,
    maxWidth: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  proofDot: {
    backgroundColor: colors.accent,
    borderRadius: radii.round,
    height: 8,
    width: 8
  },
  proofText: {
    color: colors.ink,
    fontFamily,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: typography.weights.bold
  },
  heroVisual: {
    backgroundColor: colors.graphite,
    borderRadius: radii.xl,
    flex: 1,
    height: 520,
    maxWidth: 560,
    minWidth: 280,
    overflow: "hidden",
    position: "relative",
    ...shadows.medium
  },
  heroVisualMobile: {
    marginTop: spacing.huge + spacing.xl,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  heroImage: {
    height: "100%",
    opacity: 0.94,
    width: "100%"
  },
  scanFrame: {
    bottom: "19%",
    height: "46%",
    left: "15%",
    position: "absolute",
    right: "12%"
  },
  scanLineLong: {
    backgroundColor: colors.aqua,
    borderRadius: radii.round,
    height: 4,
    left: 10,
    position: "absolute",
    top: "42%",
    transform: [{ rotate: "-18deg" }],
    width: "78%"
  },
  scanLineShort: {
    backgroundColor: colors.accent,
    borderRadius: radii.round,
    height: 4,
    position: "absolute",
    right: 4,
    top: "55%",
    transform: [{ rotate: "26deg" }],
    width: "48%"
  },
  scanJoint: {
    backgroundColor: colors.accent,
    borderColor: colors.white,
    borderRadius: radii.round,
    borderWidth: 3,
    height: 18,
    left: "47%",
    position: "absolute",
    top: "47%",
    width: 18
  },
  heroMetric: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.lg,
    bottom: spacing.lg,
    gap: spacing.xs,
    left: spacing.lg,
    padding: spacing.md,
    position: "absolute",
    width: 176
  },
  heroMetricSecondary: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    position: "absolute",
    right: spacing.lg,
    top: spacing.lg
  },
  metricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  metricValue: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 34,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  metricValueSmall: {
    color: colors.accent,
    fontFamily,
    fontSize: 30,
    fontWeight: typography.weights.black,
    lineHeight: 34
  },
  metricHint: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  featureSection: {
    gap: spacing.xl
  },
  sectionHeader: {
    gap: spacing.sm,
    maxWidth: 720
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 34,
    fontWeight: typography.weights.black,
    lineHeight: 40
  },
  sectionBody: {
    maxWidth: 720
  },
  inverseTitle: {
    color: colors.white
  },
  inverseBody: {
    color: "#cfe2e1"
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexBasis: 280,
    flexGrow: 1,
    overflow: "hidden",
    ...shadows.soft
  },
  featureImage: {
    aspectRatio: 1.65,
    width: "100%"
  },
  featureCopy: {
    gap: spacing.sm,
    padding: spacing.lg
  },
  featureStat: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentSoft,
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  featureStatText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  featureTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.black,
    lineHeight: 26
  },
  featureBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 15,
    lineHeight: 22
  },
  workflowSection: {
    alignItems: "flex-start",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxxl,
    padding: spacing.xxl,
    ...shadows.medium
  },
  workflowCopy: {
    flexBasis: 320,
    flexGrow: 1,
    gap: spacing.sm
  },
  stepList: {
    flexBasis: 460,
    flexGrow: 1,
    gap: spacing.md
  },
  stepRow: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  stepNumber: {
    color: colors.accent,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  stepCopy: {
    flex: 1,
    gap: spacing.xs
  },
  stepTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  stepBody: {
    color: "#cfe2e1",
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  previewSection: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xxxl
  },
  dashboardMock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    flexBasis: 440,
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
    borderRadius: radii.round,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  mockStatusText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black
  },
  mockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  mockMetric: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    flexBasis: 120,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  mockMetricValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 26,
    fontWeight: typography.weights.black
  },
  mockMetricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  chart: {
    alignItems: "flex-end",
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing.md,
    height: 150,
    justifyContent: "space-between",
    padding: spacing.lg
  },
  chartColumn: {
    flex: 1,
    justifyContent: "flex-end"
  },
  chartBar: {
    backgroundColor: colors.primary,
    borderRadius: radii.round,
    minHeight: 24
  },
  previewCopy: {
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    justifyContent: "space-between",
    padding: spacing.xxl,
    ...shadows.soft
  },
  finalCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 260
  },
  finalTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.black,
    lineHeight: 34
  },
  finalBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 720
  }
});
