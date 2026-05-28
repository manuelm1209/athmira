import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii, shadows, spacing, typography } from "@athmira/ui";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { AppScreen as Screen } from "@/components/AppScreen";
import { LinkButton } from "@/components/LinkButton";
import { SeoHead } from "@/components/SeoHead";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

const pricingSeoDescription =
  "athmira pricing for cyclists who want camera-based Bike Fit, personalized tire pressure analysis, and nutrition planning in one endurance performance app.";

const pricingStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "athmira",
    description: pricingSeoDescription,
    brand: {
      "@type": "Brand",
      name: "athmira"
    },
    offers: [
      {
        "@type": "Offer",
        name: "athmira free trial",
        price: "0",
        priceCurrency: "COP"
      },
      {
        "@type": "Offer",
        name: "athmira monthly",
        price: "11900",
        priceCurrency: "COP"
      },
      {
        "@type": "Offer",
        name: "athmira annual",
        price: "99000",
        priceCurrency: "COP"
      }
    ]
  }
] satisfies Record<string, unknown>[];

const pricingCopy = {
  en: {
    seoTitle: "athmira pricing | Bike Fit, tire pressure and nutrition planning",
    heroTitle: "Choose the plan for your next 15 days of progress",
    heroBody:
      "Dial in your Bike Fit, optimize tire pressure, and fuel every ride with personalized nutrition plans.",
    heroPrimary: "Start 15-day trial",
    heroSecondary: "Sign in",
    heroMicrocopy: "No payment flow is active yet. These plans preview the athmira subscription structure.",
    mockupTitle: "Today in athmira",
    mockupBike: "Road bike",
    mockupFit: "Fit readiness",
    mockupPressure: "Pressure",
    mockupNutrition: "Nutrition target",
    mockupRecommendation: "Retest after one saddle-height adjustment before changing reach.",
    plansTitle: "Simple plans for consistent improvement.",
    plansBody:
      "The trial lets you test the complete system. Paid plans are designed for athletes who want every bike, retest, pressure plan, and nutrition plan in one place.",
    trialNote: "15 days with 2 Bike Fits",
    bestValue: "Best value",
    chooseTrial: "Start trial",
    chooseMonthly: "Choose monthly",
    chooseAnnual: "Choose annual",
    paymentNote:
      "Payments are not implemented yet. Selecting a plan currently sends athletes to account creation.",
    ethicalNote:
      "athmira provides preliminary, educational, camera-based guidance. It does not replace a professional bike fit, coach, doctor, or physical therapist.",
    plans: [
      {
        description: "Try the complete product, then keep a useful foundation if you stay on free access.",
        name: "Free",
        price: "COP $0",
        cadence: "after trial",
        highlight: "2 Bike Fits during the first 15 days",
        cta: "chooseTrial",
        features: [
          "First 15 days: 2 Bike Fits with side and front computer vision tracking",
          "First 15 days: unlimited bikes and recommendations",
          "First 15 days: personalized tire pressure analysis",
          "First 15 days: unlimited nutrition plans"
        ]
      },
      {
        description: "For riders who want to make regular setup changes and compare progress every month.",
        name: "Monthly",
        price: "COP $11,900",
        cadence: "per month",
        highlight: "Flexible performance system",
        cta: "chooseMonthly",
        features: [
          "Unlimited Bike Fits",
          "Unlimited bikes and recommendations",
          "Personalized tire pressure analysis",
          "Unlimited nutrition plans"
        ]
      },
      {
        description: "For athletes building consistency across seasons, bikes, training blocks, and events.",
        name: "Annual",
        price: "COP $99,000",
        cadence: "per year",
        highlight: "Save compared with monthly",
        cta: "chooseAnnual",
        featured: true,
        features: [
          "Unlimited Bike Fits",
          "Unlimited bikes and recommendations",
          "Personalized tire pressure analysis",
          "Unlimited nutrition plans"
        ]
      }
    ],
    comparisonTitle: "What stays available after the trial?",
    comparisonRows: [
      { label: "Bike profiles", free: "1 bike", paid: "Unlimited" },
      { label: "Bike Fits", free: "2 side + front analyses", paid: "Unlimited" },
      { label: "Tire pressure", free: "Basic saved setup", paid: "Personalized per bike" },
      { label: "Nutrition plans", free: "1 plan", paid: "Unlimited" }
    ],
    finalTitle: "Make every retest count.",
    finalBody:
      "Create your profile, add your first bike, and use the trial to see whether athmira fits your training workflow."
  },
  es: {
    seoTitle: "Precios de athmira | Bike Fit, presión de llantas y nutrición",
    heroTitle: "Elige el plan para tus próximos 15 días de progreso",
    heroBody:
      "Ajusta tu Bike Fit, optimiza presión de llantas y alimenta cada rodada con planes de nutrición personalizados.",
    heroPrimary: "Comenzar prueba de 15 días",
    heroSecondary: "Iniciar sesión",
    heroMicrocopy: "El flujo de pagos aún no está activo. Estos planes muestran la futura estructura de suscripción.",
    mockupTitle: "Hoy en athmira",
    mockupBike: "Bici de ruta",
    mockupFit: "Preparación de fit",
    mockupPressure: "Presión",
    mockupNutrition: "Objetivo de nutrición",
    mockupRecommendation: "Repite el análisis después de un ajuste de sillín antes de cambiar el alcance.",
    plansTitle: "Planes simples para mejorar con consistencia.",
    plansBody:
      "La prueba te deja evaluar el sistema completo. Los planes pagos están pensados para atletas que quieren cada bici, re-test, plan de presión y plan de nutrición en un solo lugar.",
    trialNote: "15 días con 2 Bike Fits",
    bestValue: "Mejor valor",
    chooseTrial: "Comenzar prueba",
    chooseMonthly: "Elegir mensual",
    chooseAnnual: "Elegir anual",
    paymentNote:
      "Los pagos aún no están implementados. Elegir un plan actualmente lleva a la creación de cuenta.",
    ethicalNote:
      "athmira entrega guía preliminar, educativa y basada en cámara. No reemplaza un bike fit profesional, entrenador, médico ni fisioterapeuta.",
    plans: [
      {
        description: "Prueba el producto completo y conserva una base útil si sigues con acceso gratuito.",
        name: "Gratis",
        price: "COP $0",
        cadence: "después de la prueba",
        highlight: "2 Bike Fits durante los primeros 15 días",
        cta: "chooseTrial",
        features: [
          "Primeros 15 días: 2 Bike Fits con tracking lateral y frontal por visión por computador",
          "Primeros 15 días: bicis y recomendaciones ilimitadas",
          "Primeros 15 días: análisis personalizado de presión de llantas",
          "Primeros 15 días: planes de nutrición ilimitados"
        ]
      },
      {
        description: "Para ciclistas que hacen ajustes frecuentes y quieren comparar progreso cada mes.",
        name: "Mensual",
        price: "COP $11.900",
        cadence: "al mes",
        highlight: "Sistema flexible de rendimiento",
        cta: "chooseMonthly",
        features: [
          "Bike Fits ilimitados",
          "Bicis y recomendaciones ilimitadas",
          "Análisis personalizado de presión de llantas",
          "Planes de nutrición ilimitados"
        ]
      },
      {
        description: "Para atletas que construyen consistencia entre temporadas, bicis, bloques y eventos.",
        name: "Anual",
        price: "COP $99.000",
        cadence: "al año",
        highlight: "Ahorra frente al pago mensual",
        cta: "chooseAnnual",
        featured: true,
        features: [
          "Bike Fits ilimitados",
          "Bicis y recomendaciones ilimitadas",
          "Análisis personalizado de presión de llantas",
          "Planes de nutrición ilimitados"
        ]
      }
    ],
    comparisonTitle: "¿Qué queda disponible después de la prueba?",
    comparisonRows: [
      { label: "Perfiles de bici", free: "1 bici", paid: "Ilimitados" },
      { label: "Bike Fits", free: "2 análisis lateral + frontal", paid: "Ilimitados" },
      { label: "Presión de llantas", free: "Setup básico guardado", paid: "Personalizada por bici" },
      { label: "Planes de nutrición", free: "1 plan", paid: "Ilimitados" }
    ],
    finalTitle: "Haz que cada re-test cuente.",
    finalBody:
      "Crea tu perfil, agrega tu primera bici y usa la prueba para saber si athmira encaja con tu forma de entrenar."
  }
} as const;

type PricingCtaKey = "chooseAnnual" | "chooseMonthly" | "chooseTrial";
type PricingPlan = {
  cadence: string;
  cta: PricingCtaKey;
  description: string;
  featured?: boolean;
  features: readonly string[];
  highlight: string;
  name: string;
  price: string;
};

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });
const pageWebStyle = Platform.select({
  default: undefined,
  web: {
    maxWidth: "calc(100vw - 32px)",
    width: "calc(100vw - 32px)"
  } as never
});
const planGridWebStyle = Platform.select({
  default: undefined,
  web: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
  } as never
});

export default function PricingRoute() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const copy = pricingCopy[language];
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const tablet = width >= 760 && width < 1020;
  const planGridStyle = tablet
    ? Platform.select({
        default: undefined,
        web: {
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
        } as never
      })
    : planGridWebStyle;

  return (
    <>
      <SeoHead
        canonicalPath="/pricing"
        description={pricingSeoDescription}
        jsonLd={pricingStructuredData}
        lang={language}
        title={copy.seoTitle}
      />
      <Screen maxWidth={1240}>
        <View style={[styles.page, mobile && styles.pageMobile, mobile && pageWebStyle]}>
          <View style={[styles.hero, mobile && styles.heroMobile]}>
            <View style={[styles.heroCopy, mobile && styles.heroCopyMobile]}>
              <Text style={[styles.heroTitle, mobile && styles.heroTitleMobile]}>{copy.heroTitle}</Text>
              <Text style={[styles.heroBody, mobile && styles.heroBodyMobile]}>{copy.heroBody}</Text>
              <View style={[styles.heroActions, mobile && styles.heroActionsMobile]}>
                {session ? (
                  <LinkButton href="/dashboard">Dashboard</LinkButton>
                ) : (
                  <>
                    <LinkButton href="/auth/signup">{copy.heroPrimary}</LinkButton>
                    <LinkButton href="/auth/login" variant="secondary">
                      {copy.heroSecondary}
                    </LinkButton>
                  </>
                )}
              </View>
              <Text style={styles.heroMicrocopy}>{copy.heroMicrocopy}</Text>
            </View>
            <PerformanceMockup copy={copy} mobile={mobile} />
          </View>

          <View style={[styles.planGrid, !mobile && planGridStyle, mobile && styles.planGridMobile]}>
            {copy.plans.map((plan) => (
              <PricingCard copy={copy} key={plan.name} plan={plan} />
            ))}
          </View>

          <View style={[styles.notePanel, mobile && styles.notePanelMobile]}>
            <MaterialCommunityIcons color={colors.primary} name="lock-outline" size={22} />
            <View style={styles.noteCopy}>
              <Text style={styles.paymentNote}>{copy.paymentNote}</Text>
              <Text style={styles.ethicalNote}>{copy.ethicalNote}</Text>
            </View>
          </View>

          <View style={[styles.comparison, mobile && styles.comparisonMobile]}>
            <Text style={[styles.comparisonTitle, mobile && styles.sectionTitleMobile]}>{copy.comparisonTitle}</Text>
            <View style={styles.comparisonRows}>
              {copy.comparisonRows.map((row) => (
                <View key={row.label} style={[styles.comparisonRow, mobile && styles.comparisonRowMobile]}>
                  <Text style={styles.comparisonLabel}>{row.label}</Text>
                  <Text style={styles.comparisonValue}>{row.free}</Text>
                  <Text style={[styles.comparisonValue, styles.comparisonValueStrong]}>{row.paid}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.finalCta, mobile && styles.finalCtaMobile]}>
            <View style={styles.finalCopy}>
              <Text style={[styles.finalTitle, mobile && styles.finalTitleMobile]}>{copy.finalTitle}</Text>
              <Text style={styles.finalBody}>{copy.finalBody}</Text>
            </View>
            <LinkButton href={session ? "/dashboard" : "/auth/signup"}>{copy.heroPrimary}</LinkButton>
          </View>
        </View>
      </Screen>
    </>
  );
}

function PerformanceMockup({ copy, mobile }: { copy: typeof pricingCopy.en | typeof pricingCopy.es; mobile: boolean }) {
  return (
    <View style={[styles.mockup, mobile && styles.mockupMobile]}>
      <View style={styles.mockupHeader}>
        <View>
          <Text style={styles.mockupTitle}>{copy.mockupTitle}</Text>
          <Text style={styles.mockupSubtitle}>{copy.trialNote}</Text>
        </View>
        <View style={styles.mockupScore}>
          <Text style={styles.mockupScoreValue}>82</Text>
        </View>
      </View>
      <View style={styles.mockupBikeRow}>
        <View style={styles.bikeIconFrame}>
          <MaterialCommunityIcons color={colors.primary} name="bike-fast" size={24} />
        </View>
        <View style={styles.mockupBikeCopy}>
          <Text style={styles.mockupLabel}>{copy.mockupBike}</Text>
          <Text style={styles.mockupValue}>{copy.mockupFit}</Text>
        </View>
      </View>
      <View style={[styles.mockupMetricRow, mobile && styles.mockupMetricRowMobile]}>
        <MetricBlock label={copy.mockupPressure} value="73 / 75 PSI" />
        <MetricBlock label={copy.mockupNutrition} value="75 g/h" />
      </View>
      <View style={styles.recommendationPanel}>
        <Text style={styles.recommendationTitle}>Next test</Text>
        <Text style={styles.recommendationBody}>{copy.mockupRecommendation}</Text>
      </View>
    </View>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PricingCard({
  copy,
  plan
}: {
  copy: typeof pricingCopy.en | typeof pricingCopy.es;
  plan: PricingPlan;
}) {
  const cta = copy[plan.cta as PricingCtaKey];

  return (
    <View style={[styles.planCard, plan.featured && styles.planCardFeatured]}>
      <View style={styles.planHeader}>
        <View style={styles.planNameRow}>
          <Text style={styles.planName}>{plan.name}</Text>
          {plan.featured ? <Text style={styles.planValueLabel}>{copy.bestValue}</Text> : null}
        </View>
        <Text style={styles.planDescription}>{plan.description}</Text>
      </View>
      <View style={styles.priceBlock}>
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planCadence}>{plan.cadence}</Text>
      </View>
      <Text style={styles.planHighlight}>{plan.highlight}</Text>
      <View style={styles.featureList}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <MaterialCommunityIcons color={colors.primary} name="check-bold" size={16} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <LinkButton href="/auth/signup" variant={plan.featured ? "primary" : "secondary"}>
        {cta}
      </LinkButton>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 36,
    overflow: "hidden",
    paddingBottom: spacing.xxxl,
    width: "100%"
  },
  pageMobile: {
    gap: 44
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxxl,
    minHeight: 430,
    paddingTop: spacing.md
  },
  heroMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.xl,
    minHeight: 0
  },
  heroCopy: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 320
  },
  heroCopyMobile: {
    minWidth: 0,
    width: "100%"
  },
  heroTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 58,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 62,
    maxWidth: 700
  },
  heroTitleMobile: {
    fontSize: 38,
    lineHeight: 43,
    maxWidth: "100%"
  },
  heroBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 18,
    lineHeight: 29,
    maxWidth: 620
  },
  heroBodyMobile: {
    fontSize: 16,
    lineHeight: 24
  },
  heroActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  heroActionsMobile: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  heroMicrocopy: {
    color: colors.inkSubtle,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
    maxWidth: 500
  },
  mockup: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 0.9,
    gap: spacing.lg,
    minWidth: 360,
    padding: spacing.xl,
    ...shadows.medium
  },
  mockupMobile: {
    minWidth: 0,
    padding: spacing.lg,
    width: "100%"
  },
  mockupHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  mockupTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 20,
    fontWeight: typography.weights.black,
    lineHeight: 25
  },
  mockupSubtitle: {
    color: colors.primary,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black,
    marginTop: spacing.xs
  },
  mockupScore: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 5,
    height: 68,
    justifyContent: "center",
    width: 68
  },
  mockupScoreValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.black
  },
  mockupBikeRow: {
    alignItems: "center",
    backgroundColor: colors.primaryMist,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  bikeIconFrame: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.round,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  mockupBikeCopy: {
    flex: 1,
    gap: spacing.xs
  },
  mockupLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  mockupValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.black
  },
  mockupMetricRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  mockupMetricRowMobile: {
    flexDirection: "column"
  },
  metricBlock: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  metricLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  metricValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 27
  },
  recommendationPanel: {
    backgroundColor: colors.graphite,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.lg
  },
  recommendationTitle: {
    color: colors.accent,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  recommendationBody: {
    color: colors.white,
    fontFamily,
    fontSize: 14,
    lineHeight: 21
  },
  plansIntro: {
    alignItems: "center",
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 38,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 44,
    maxWidth: 780,
    textAlign: "center"
  },
  sectionTitleMobile: {
    fontSize: 30,
    lineHeight: 35,
    maxWidth: "100%"
  },
  sectionBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 820,
    textAlign: "center"
  },
  sectionBodyMobile: {
    fontSize: 15,
    lineHeight: 23
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    width: "100%"
  },
  planGridMobile: {
    flexDirection: "column"
  },
  planCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 300,
    flexGrow: 1,
    gap: spacing.lg,
    minWidth: 0,
    padding: spacing.xl,
    ...shadows.soft
  },
  planCardFeatured: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  planHeader: {
    gap: spacing.sm
  },
  planNameRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  planName: {
    color: colors.ink,
    fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.black,
    lineHeight: 28
  },
  planValueLabel: {
    backgroundColor: colors.accentSoft,
    borderColor: "#d5eb95",
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  planDescription: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    lineHeight: 21
  },
  priceBlock: {
    gap: spacing.xs
  },
  planPrice: {
    color: colors.ink,
    fontFamily,
    fontSize: 33,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  planCadence: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  planHighlight: {
    color: colors.primary,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  featureList: {
    gap: spacing.sm
  },
  featureRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  featureText: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  notePanel: {
    alignItems: "flex-start",
    backgroundColor: colors.primaryMist,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  notePanelMobile: {
    padding: spacing.md
  },
  noteCopy: {
    flex: 1,
    gap: spacing.xs
  },
  paymentNote: {
    color: colors.ink,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black,
    lineHeight: 20
  },
  ethicalNote: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    lineHeight: 20
  },
  comparison: {
    gap: spacing.xl
  },
  comparisonMobile: {
    gap: spacing.lg
  },
  comparisonTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 32,
    fontWeight: typography.weights.black,
    lineHeight: 38,
    textAlign: "center"
  },
  comparisonRows: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  comparisonRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  comparisonRowMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: spacing.xs
  },
  comparisonLabel: {
    color: colors.ink,
    flex: 1,
    fontFamily,
    fontSize: 14,
    fontWeight: typography.weights.black
  },
  comparisonValue: {
    color: colors.inkMuted,
    flex: 1,
    fontFamily,
    fontSize: 14,
    lineHeight: 20
  },
  comparisonValueStrong: {
    color: colors.primary,
    fontWeight: typography.weights.black
  },
  finalCta: {
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.xl,
    justifyContent: "space-between",
    padding: spacing.xxl
  },
  finalCtaMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    padding: spacing.xl
  },
  finalCopy: {
    flex: 1,
    gap: spacing.sm
  },
  finalTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 32,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  finalTitleMobile: {
    fontSize: 27,
    lineHeight: 33
  },
  finalBody: {
    color: "#d8f0ed",
    fontFamily,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 620
  }
});
