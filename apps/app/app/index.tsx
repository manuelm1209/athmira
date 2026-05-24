import { Body, FadeInView, Heading, Inline, colors, radii, shadows, spacing, typography } from "@athmira/ui";
import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { AppScreen as Screen } from "@/components/AppScreen";

import { LinkButton } from "@/components/LinkButton";
import { SeoHead } from "@/components/SeoHead";
import { visualAssets } from "@/lib/visual-assets";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

const homeHeroImage = require("../assets/home/image-home-bike-fit-hero.png");
const homeSeoTitle = "athmira | Bike Fit, presión de llantas y nutrición para ciclistas";
const homeSeoDescription =
  "athmira ayuda a ciclistas y deportistas de endurance a mejorar su preparación con Bike Fit con cámara, análisis de postura, presión de llantas, nutrición, hidratación e historial de progreso.";
const homeStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "athmira",
    url: "https://athmira.com",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web, iOS, Android",
    description: homeSeoDescription,
    inLanguage: ["es", "en"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    audience: {
      "@type": "Audience",
      audienceType: "Ciclistas, triatletas y deportistas de endurance principiantes e intermedios"
    },
    featureList: [
      "Bike Fit con cámara",
      "Análisis de postura en bicicleta",
      "Análisis frontal de rodillas",
      "Calculadora de presión de llantas bicicleta",
      "Planificación de nutrición e hidratación para ciclismo",
      "Perfiles de bicicletas",
      "Historial de progreso"
    ],
    keywords: [
      "bike fit",
      "bike fitting",
      "bike fit con cámara",
      "análisis de postura en bicicleta",
      "ajuste de bicicleta",
      "postura en bicicleta",
      "presión de llantas bicicleta",
      "nutrición para ciclismo",
      "hidratación para ciclismo",
      "triatlón",
      "endurance training app",
      "camera bike fit",
      "cycling posture analysis",
      "tire pressure calculator",
      "cycling nutrition planner"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "athmira",
    url: "https://athmira.com",
    logo: "https://athmira.com/og-image.png",
    slogan: "Entrena mejor. Llega más lejos.",
    sameAs: []
  }
] satisfies Record<string, unknown>[];

const homeCopy = {
  en: {
    heroTitle: "athmira turns your bike setup into a ride system.",
    heroBody:
      "Bike Fit, aero posture, tire pressure, nutrition planning, and progress history come together so every adjustment has context and every retest teaches you something useful.",
    heroBodyMobile:
      "Bike Fit, aero posture,\npressure and fueling.\nEvery retest teaches\nthe next useful step.",
    heroPrimary: "Start your ride system",
    heroSecondary: "Sign in",
    heroMetrics: [
      { label: "Bike Fit", value: "side + front" },
      { label: "Next change", value: "one at a time" },
      { label: "Retest", value: "compare progress" }
    ],
    systemTitle: "Everything a cyclist needs before the next ride.",
    systemBody:
      "athmira is built for cyclists moving from beginner confidence to serious goals. Start with the bike and the body, then layer in pressure, fueling, and training intelligence without losing the thread.",
    systemTitleMobile: "Everything\na cyclist needs\nbefore the next\nride.",
    systemBodyMobile:
      "athmira is built for cyclists\nmoving from beginner confidence\nto serious goals.\nStart with the bike and the body,\nthen layer in pressure, fueling,\nand training intelligence.",
    modules: [
      {
        body: "Capture side and front views, review joint angles, knee tracking, confidence, and a single practical adjustment to test next.",
        image: "hero",
        metric: "137-147 deg",
        title: "Bike Fit that explains the why"
      },
      {
        body: "Understand torso, hip, head, and arm position with estimated visual aero guidance that avoids wind-tunnel claims.",
        image: "aero",
        metric: "estimated",
        title: "Aero guidance for real riders"
      },
      {
        body: "Calculate pressure from bike type, tire width, rider weight, surface, and tire setup, then save it to the bike profile.",
        image: "pressure",
        metric: "PSI by surface",
        title: "Pressure planning with context"
      },
      {
        body: "Plan carbs, fluids, sodium, and race-day fueling from products you actually use, in English or Spanish.",
        image: "nutrition",
        metric: "carbs + sodium",
        title: "Nutrition that fits the session"
      }
    ],
    workflowTitle: "A better fit happens in loops, not guesses.",
    workflowBody:
      "athmira guides the athlete through one clean capture, one main recommendation, one small change, and one retest. That keeps the process useful without pretending to replace a professional bike fit.",
    steps: [
      {
        body: "Save bike type, size, saddle height, setback, stem, crank length, handlebar width, and tire setup.",
        title: "Build the bike profile"
      },
      {
        body: "Capture lateral posture and front knee tracking with confidence checks before the system gives stronger guidance.",
        title: "Measure the ride position"
      },
      {
        body: "athmira prioritizes capture quality, saddle height, knee stability, cockpit, and cleat review in that order.",
        title: "Choose one main change"
      },
      {
        body: "Repeat the analysis after a small adjustment and compare the new score, angles, and recommendation history.",
        title: "Retest and compare"
      }
    ],
    cockpitTitle: "The dashboard becomes the athlete's memory.",
    cockpitBody:
      "Bikes, fit sessions, aero scores, pressure plans, nutrition plans, and recommendations live together. The goal is not more data. The goal is a clearer next ride.",
    dashboardCards: [
      { label: "Fit readiness", value: "82", note: "confidence-limited guidance visible" },
      { label: "Knee tracking", value: "front view", note: "left / right stability trend" },
      { label: "Pressure plan", value: "73 psi", note: "saved to gravel bike" },
      { label: "Fueling", value: "75 g/h", note: "carbs, fluids, sodium" }
    ],
    futureTitle: "Built for the road ahead.",
    futureBody:
      "The foundation already supports the next layers: AI coaching, Garmin, Strava, Apple Health, Google Fit, running, swimming, and triathlon modules. The product grows without rebuilding the athlete record.",
    finalTitle: "Make the next ride the start of a smarter system.",
    finalBody:
      "Create your profile, add a bike, run Bike Fit, save pressure and nutrition plans, then let every retest move the story forward."
  },
  es: {
    heroTitle: "Convierte tu bici en un sistema de progreso.",
    heroBody:
      "Bike Fit, postura aero, presión de llantas, nutrición e historial de progreso viven juntos para que cada ajuste tenga contexto y cada re-test deje una señal útil.",
    heroBodyMobile:
      "Bike Fit, postura aero,\npresión y fueling.\nCada re-test muestra\nel siguiente paso útil.",
    heroPrimary: "Crear mi sistema",
    heroSecondary: "Iniciar sesión",
    heroMetrics: [
      { label: "Bike Fit", value: "lateral + frontal" },
      { label: "Siguiente cambio", value: "uno a la vez" },
      { label: "Re-test", value: "comparar progreso" }
    ],
    systemTitle: "Todo lo que un ciclista necesita antes de la próxima rodada.",
    systemBody:
      "athmira está pensado para ciclistas que pasan de ganar confianza a perseguir metas serias. Empieza con la bici y el cuerpo, luego suma presión, fueling e inteligencia de entrenamiento sin perder el hilo.",
    systemTitleMobile: "Todo lo que\nun ciclista necesita\nantes de la próxima\nrodada.",
    systemBodyMobile:
      "athmira está pensado para ciclistas\nque pasan de ganar confianza\na perseguir metas serias.\nEmpieza con la bici y el cuerpo,\nluego suma presión, fueling\ne inteligencia de entrenamiento.",
    modules: [
      {
        body: "Captura vista lateral y frontal, revisa ángulos, tracking de rodilla, confianza y un ajuste principal para probar después.",
        image: "hero",
        metric: "137-147 deg",
        title: "Bike Fit que explica el por qué"
      },
      {
        body: "Entiende torso, cadera, cabeza y brazos con guía aero visual estimada, sin prometer precisión de túnel de viento.",
        image: "aero",
        metric: "estimado",
        title: "Guía aero para ciclistas reales"
      },
      {
        body: "Calcula presión por tipo de bici, ancho de llanta, peso, superficie y montaje, y guárdala en el perfil de bici.",
        image: "pressure",
        metric: "PSI por terreno",
        title: "Presión con contexto"
      },
      {
        body: "Planea carbohidratos, líquidos, sodio y fueling de carrera con productos reales, en inglés o español.",
        image: "nutrition",
        metric: "carbs + sodio",
        title: "Nutrición que encaja con la sesión"
      }
    ],
    workflowTitle: "Un mejor fit ocurre en ciclos, no por intuición.",
    workflowBody:
      "athmira guía al atleta por una captura limpia, una recomendación principal, un cambio pequeño y un re-test. Así el proceso es útil sin pretender reemplazar a un bike fitter profesional.",
    steps: [
      {
        body: "Guarda tipo de bici, talla, altura de sillín, retroceso, potencia, bielas, ancho de manubrio y setup de llantas.",
        title: "Construye el perfil de bici"
      },
      {
        body: "Captura postura lateral y tracking frontal de rodillas con validaciones de confianza antes de dar guía fuerte.",
        title: "Mide la posición"
      },
      {
        body: "athmira prioriza calidad de captura, altura de sillín, estabilidad de rodilla, cockpit y revisión de calas.",
        title: "Elige un cambio principal"
      },
      {
        body: "Repite el análisis después de un ajuste pequeño y compara puntaje, ángulos e historial de recomendaciones.",
        title: "Re-test y comparación"
      }
    ],
    cockpitTitle: "El dashboard se convierte en la memoria del atleta.",
    cockpitBody:
      "Bicis, sesiones de fit, puntajes aero, planes de presión, nutrición y recomendaciones viven juntos. El objetivo no es tener más datos. Es saber mejor qué hacer en la próxima rodada.",
    dashboardCards: [
      { label: "Preparación de fit", value: "82", note: "guía visible según confianza" },
      { label: "Tracking de rodilla", value: "frontal", note: "tendencia izquierda / derecha" },
      { label: "Plan de presión", value: "73 psi", note: "guardado en gravel" },
      { label: "Fueling", value: "75 g/h", note: "carbs, líquidos, sodio" }
    ],
    futureTitle: "Construido para lo que viene.",
    futureBody:
      "La base ya soporta las próximas capas: coaching con IA, Garmin, Strava, Apple Health, Google Fit, running, natación y módulos de triatlón. El producto crece sin reconstruir el registro del atleta.",
    finalTitle: "Haz que la próxima rodada empiece un sistema más inteligente.",
    finalBody:
      "Crea tu perfil, agrega una bici, ejecuta Bike Fit, guarda presión y nutrición, y deja que cada re-test mueva la historia hacia adelante."
  }
} as const;

type ModuleImageKey = "aero" | "hero" | "nutrition" | "pressure";

const moduleImageMap: Record<ModuleImageKey, ImageSourcePropType | string> = {
  aero: visualAssets.aeroTrack,
  hero: visualAssets.cyclistHero,
  nutrition: visualAssets.nutritionPlan,
  pressure: visualAssets.tireGauge
};

const heroFadeWebStyle = Platform.select({
  default: undefined,
  web: {
    backgroundImage:
      "linear-gradient(90deg, rgba(244,248,250,0.94) 0%, rgba(244,248,250,0.62) 34%, rgba(244,248,250,0) 100%)"
  } as never
});
const mobilePageWebStyle = Platform.select({
  default: undefined,
  web: {
    maxWidth: "calc(100vw - 32px)",
    width: "calc(100vw - 32px)"
  } as never
});

export default function WelcomeRoute() {
  const { session } = useAuth();
  const { language, t } = useLanguage();
  const copy = homeCopy[language];
  const { width } = useWindowDimensions();
  const [webHydrated, setWebHydrated] = useState(Platform.OS !== "web");
  const layoutWidth = webHydrated ? width : 0;
  const mobile = !webHydrated || layoutWidth < 760;
  const moduleColumns = mobile ? 1 : layoutWidth < 1100 ? 2 : 4;
  const moduleGridWebStyle = Platform.select({
    default: undefined,
    web: {
      display: "grid",
      gridTemplateColumns: `repeat(${moduleColumns}, minmax(0, 1fr))`
    } as never
  });
  const mobilePageWidth = Math.max(320, layoutWidth - spacing.xxl);
  const mobileBox = mobile ? { maxWidth: mobilePageWidth, width: mobilePageWidth } : undefined;

  useEffect(() => {
    if (Platform.OS === "web") {
      setWebHydrated(true);
    }
  }, []);

  return (
    <>
      <SeoHead description={homeSeoDescription} jsonLd={homeStructuredData} title={homeSeoTitle} />
      <Screen maxWidth={1280}>
        <View
          style={[
            styles.page,
            mobile && styles.pageMobile,
            mobile && { maxWidth: mobilePageWidth, width: mobilePageWidth },
            mobile && mobilePageWebStyle
          ]}
        >
        <FadeInView style={[styles.hero, mobile && styles.heroMobile]}>
          <View style={[styles.heroCopy, mobile && styles.heroCopyMobile, mobileBox]}>
            <Heading style={[styles.heroTitle, mobile && styles.heroTitleMobile, mobileBox]}>{copy.heroTitle}</Heading>
            {!mobile ? (
              <Body style={styles.heroBody}>{copy.heroBody}</Body>
            ) : null}
            {!mobile ? <Inline style={styles.heroActions}>
              {session ? (
                <LinkButton href="/dashboard">{t("dashboard")}</LinkButton>
              ) : (
                <>
                  <LinkButton href="/auth/signup">{copy.heroPrimary}</LinkButton>
                  <LinkButton href="/auth/login" variant="secondary">
                    {copy.heroSecondary}
                  </LinkButton>
                </>
              )}
            </Inline> : null}
            {mobile ? null : <View style={styles.heroMetricRow}>
              {copy.heroMetrics.map((metric) => (
                <View key={metric.label} style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>{metric.label}</Text>
                  <Text style={styles.heroMetricValue}>{metric.value}</Text>
                </View>
              ))}
            </View>}
          </View>

          {mobile ? null : (
            <View style={styles.heroMedia}>
              <Image
                accessibilityLabel="athmira Bike Fit analysis preview"
                resizeMode="cover"
                source={homeHeroImage}
                style={styles.heroImage}
              />
              <View style={[styles.heroFade, heroFadeWebStyle]} />
              <View style={styles.analysisOverlay}>
                <Text style={styles.overlayTitle}>Fit & Aero overview</Text>
                <View style={styles.overlayMainRow}>
                  <View style={styles.overlayScoreBlock}>
                    <View style={styles.overlayScoreRing}>
                      <Text style={styles.overlayScoreValue}>76</Text>
                    </View>
                    <View style={styles.overlayScoreCopy}>
                      <Text style={styles.overlayScoreLabel}>{language === "es" ? "Puntaje general" : "Overall score"}</Text>
                      <Text style={styles.overlayScoreStatus}>Good</Text>
                    </View>
                  </View>
                  <View style={styles.overlayMetricStack}>
                    {[
                      { label: language === "es" ? "Comodidad" : "Comfort", value: 82, color: "#17a673" },
                      { label: "Aero", value: 72, color: colors.primary },
                      { label: language === "es" ? "Tracking rodilla" : "Knee tracking", value: 68, color: "#f58a20" },
                      { label: language === "es" ? "Calidad captura" : "Capture quality", value: 78, color: "#17a673" }
                    ].map((metric) => (
                      <View key={metric.label} style={styles.overlayMetric}>
                        <View style={styles.overlayMetricHeader}>
                          <Text style={styles.overlayLabel}>{metric.label}</Text>
                          <Text style={styles.overlayValue}>{metric.value}</Text>
                        </View>
                        <View style={styles.overlayTrack}>
                          <View style={[styles.overlayTrackFill, { backgroundColor: metric.color, width: `${metric.value}%` }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.overlayPressure}>
                  <Text style={styles.overlayPressureTitle}>{language === "es" ? "Presión recomendada" : "Pressure recommended"}</Text>
                  <View style={styles.overlayPressureRow}>
                    <Text style={styles.overlayPressureValue}>73 psi</Text>
                    <Text style={styles.overlayPressureValue}>75 psi</Text>
                  </View>
                  <View style={styles.overlayPressureRow}>
                    <Text style={styles.overlayPressureLabel}>{language === "es" ? "Del." : "Front"}</Text>
                    <Text style={styles.overlayPressureLabel}>{language === "es" ? "Tras." : "Rear"}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </FadeInView>

        <FadeInView delayMs={100} style={styles.storyIntro}>
          {mobile ? (
            <MobileLines text={copy.systemTitleMobile} textStyle={[styles.sectionTitle, styles.sectionTitleMobile]} />
          ) : (
            <Text style={styles.sectionTitle}>{copy.systemTitle}</Text>
          )}
          {mobile ? (
            <MobileLines text={copy.systemBodyMobile} textStyle={styles.sectionBody} />
          ) : (
            <Text style={styles.sectionBody}>{copy.systemBody}</Text>
          )}
        </FadeInView>

        <FadeInView delayMs={150} style={[styles.moduleGrid, moduleGridWebStyle]}>
          {copy.modules.map((module) => (
            <View key={module.title} style={styles.modulePanel}>
              <View style={[styles.moduleImageFrame, mobile && styles.moduleImageFrameMobile]}>
                <Image
                  accessibilityLabel={module.title}
                  resizeMode="cover"
                  source={getModuleImageSource(module.image)}
                  style={styles.moduleImage}
                />
              </View>
              <View style={styles.moduleCopy}>
                <Text style={styles.moduleMetric}>{module.metric}</Text>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleBody}>{module.body}</Text>
              </View>
            </View>
          ))}
        </FadeInView>

        <FadeInView delayMs={200} style={[styles.workflow, mobile && styles.workflowMobile]}>
          <View style={[styles.workflowCopy, mobile && styles.workflowCopyMobile]}>
            <Text style={[styles.sectionTitleLeft, styles.workflowTitle, mobile && styles.sectionTitleMobile, mobile && styles.textMobile]}>
              {copy.workflowTitle}
            </Text>
            <Text style={[styles.sectionBodyLeft, styles.workflowBody, mobile && styles.workflowBodyMobile]}>
              {copy.workflowBody}
            </Text>
          </View>
          <View style={[styles.stepStack, mobile && styles.stepStackMobile]}>
            {copy.steps.map((step, index) => (
              <View key={step.title} style={[styles.stepItem, mobile && styles.stepItemMobile]}>
                <View style={[styles.stepNumber, mobile && styles.stepNumberMobile]}>
                  <Text style={[styles.stepNumberText, mobile && styles.stepNumberTextMobile]}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepTitle, mobile && styles.stepTitleMobile]}>{step.title}</Text>
                  <Text style={[styles.stepBody, mobile && styles.stepBodyMobile]}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        <FadeInView delayMs={250} style={[styles.cockpitSection, mobile && styles.cockpitSectionMobile]}>
          <View style={[styles.dashboardMock, mobile && styles.dashboardMockMobile]}>
            <View style={[styles.mockHeader, mobile && styles.mockHeaderMobile]}>
              <View>
                <Text style={[styles.mockTitle, mobile && styles.mockTitleMobile]}>athmira</Text>
                <Text style={[styles.mockSubtitle, mobile && styles.mockSubtitleMobile]}>{copy.cockpitTitle}</Text>
              </View>
              <View style={[styles.scoreRing, mobile && styles.scoreRingMobile]}>
                <Text style={[styles.scoreRingValue, mobile && styles.scoreRingValueMobile]}>82</Text>
              </View>
            </View>
            <View style={[styles.dashboardGrid, mobile && styles.dashboardGridMobile]}>
              {copy.dashboardCards.map((card) => (
                <View key={card.label} style={[styles.dashboardCard, mobile && styles.dashboardCardMobile]}>
                  <Text style={styles.dashboardLabel}>{card.label}</Text>
                  <Text style={[styles.dashboardValue, mobile && styles.dashboardValueMobile]}>{card.value}</Text>
                  <Text style={styles.dashboardNote}>{card.note}</Text>
                </View>
              ))}
            </View>
            <View style={styles.recommendationStrip}>
              <Text style={styles.recommendationTitle}>
                {language === "es" ? "Recomendación principal" : "Primary recommendation"}
              </Text>
              <Text style={styles.recommendationBody}>
                {language === "es"
                  ? "Prueba un ajuste pequeño, repite el análisis y compara antes de tocar otra variable."
                  : "Try one small adjustment, repeat the analysis, and compare before changing another variable."}
              </Text>
            </View>
          </View>
          <View style={[styles.cockpitCopy, mobile && styles.cockpitCopyMobile]}>
            <Text style={[styles.sectionTitleLeft, mobile && styles.sectionTitleMobile, mobileBox]}>{copy.cockpitTitle}</Text>
            <Text style={[styles.sectionBodyLeft, mobileBox]}>{copy.cockpitBody}</Text>
          </View>
        </FadeInView>

        <FadeInView delayMs={300} style={[styles.finalCta, mobile && styles.finalCtaMobile]}>
          <Image
            accessibilityLabel="Cyclist riding with athmira planning context"
            resizeMode="cover"
            source={visualAssets.aeroTrack}
            style={styles.finalImage}
          />
          <View style={styles.finalOverlay} />
          <View style={styles.finalCopy}>
            <Text style={styles.finalTitle}>{copy.finalTitle}</Text>
            <Text style={styles.finalBody}>{copy.finalBody}</Text>
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
        </View>
      </Screen>
    </>
  );
}

function getModuleImageSource(key: string) {
  const source = moduleImageMap[key as ModuleImageKey];

  if (typeof source === "string") {
    return { uri: source };
  }

  return source;
}

function MobileLines({ text, textStyle }: { text: string; textStyle: object }) {
  return (
    <View style={styles.mobileLines}>
      {text.split("\n").map((line) => (
        <Text key={line} style={textStyle}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const fontFamily = Platform.select({ default: undefined, web: typography.fontFamily });

const styles = StyleSheet.create({
  page: {
    gap: 64,
    overflow: "hidden",
    paddingBottom: spacing.xxxl,
    width: "100%"
  },
  pageMobile: {
    gap: 44,
    paddingBottom: spacing.xxl
  },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxxl,
    minHeight: 620,
    paddingTop: spacing.xl
  },
  heroMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.xl,
    minHeight: 0
  },
  heroCopy: {
    flex: 0.92,
    gap: spacing.lg,
    minWidth: 300
  },
  heroCopyMobile: {
    minWidth: 0,
    width: "100%"
  },
  heroTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 60,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 64,
    maxWidth: 680
  },
  heroTitleMobile: {
    fontSize: 39,
    lineHeight: 43
  },
  heroBody: {
    color: colors.inkMuted,
    flexShrink: 1,
    fontFamily,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 600
  },
  textMobile: {
    maxWidth: "100%",
    width: "100%"
  },
  mobileLines: {
    alignItems: "center",
    flexShrink: 1,
    width: "100%"
  },
  heroActions: {
    gap: spacing.md,
    paddingTop: spacing.sm
  },
  heroMetricRow: {
    alignItems: "flex-start",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.xl,
    justifyContent: "space-between",
    marginTop: spacing.lg,
    paddingTop: spacing.lg
  },
  heroMetric: {
    flex: 1,
    minWidth: 0
  },
  heroMetricLabel: {
    color: colors.inkSubtle,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  heroMetricValue: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily,
    fontSize: 19,
    fontWeight: typography.weights.black,
    lineHeight: 23,
    marginTop: spacing.xs
  },
  heroMedia: {
    borderRadius: radii.xl,
    flex: 1,
    height: 560,
    minWidth: 420,
    overflow: "hidden",
    position: "relative",
    ...shadows.medium
  },
  heroMediaMobile: {
    height: 430,
    marginTop: spacing.xxxl,
    minWidth: 0,
    width: "100%"
  },
  heroImage: {
    height: "100%",
    width: "100%"
  },
  heroFade: {
    backgroundColor: "rgba(244,248,250,0.08)",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: "22%"
  },
  analysisOverlay: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderColor: "rgba(184,206,209,0.82)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 360,
    ...shadows.medium
  },
  overlayTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  overlayMainRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: spacing.md
  },
  overlayScoreBlock: {
    alignItems: "flex-start",
    gap: spacing.xs,
    width: 100
  },
  overlayScoreRing: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 5,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  overlayScoreValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 27,
    fontWeight: typography.weights.black
  },
  overlayScoreCopy: {
    gap: 3
  },
  overlayScoreLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold
  },
  overlayScoreStatus: {
    color: "#17a673",
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  overlayMetricStack: {
    flex: 1,
    gap: spacing.xs
  },
  overlayMetric: {
    gap: spacing.xs
  },
  overlayMetricHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  overlayLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  overlayValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.black
  },
  overlayTrack: {
    backgroundColor: "#e6eef0",
    borderRadius: radii.round,
    height: 5,
    overflow: "hidden"
  },
  overlayTrackFill: {
    borderRadius: radii.round,
    height: "100%"
  },
  overlayPressure: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.sm
  },
  overlayPressureTitle: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  overlayPressureRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  overlayPressureValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.black
  },
  overlayPressureLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold
  },
  storyIntro: {
    alignItems: "center",
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily,
    fontSize: 38,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 44,
    maxWidth: 830,
    textAlign: "center"
  },
  sectionTitleMobile: {
    fontSize: 31,
    lineHeight: 36,
    maxWidth: "100%",
    width: "100%"
  },
  sectionBody: {
    color: colors.inkMuted,
    flexShrink: 1,
    fontFamily,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 850,
    textAlign: "center"
  },
  sectionTitleLeft: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily,
    fontSize: 36,
    fontWeight: typography.weights.black,
    letterSpacing: 0,
    lineHeight: 42
  },
  sectionBodyLeft: {
    color: colors.inkMuted,
    flexShrink: 1,
    fontFamily,
    fontSize: 17,
    lineHeight: 26
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    width: "100%"
  },
  modulePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 260,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    overflow: "hidden",
    ...shadows.soft
  },
  moduleImageFrame: {
    aspectRatio: 1.48,
    overflow: "hidden",
    width: "100%"
  },
  moduleImageFrameMobile: {
    aspectRatio: 1.62
  },
  moduleImage: {
    height: "100%",
    width: "100%"
  },
  moduleCopy: {
    gap: spacing.xs,
    padding: spacing.md
  },
  moduleMetric: {
    color: colors.primary,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  moduleTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black,
    lineHeight: 23
  },
  moduleBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    lineHeight: 20
  },
  workflow: {
    alignItems: "flex-start",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    flexDirection: "row",
    gap: spacing.xxxl,
    padding: spacing.xxxl
  },
  workflowMobile: {
    flexDirection: "column",
    gap: spacing.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  workflowCopy: {
    flexBasis: 0,
    flexGrow: 0.75,
    flexShrink: 1,
    gap: spacing.md,
    minWidth: 260
  },
  workflowCopyMobile: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: "100%"
  },
  workflowTitle: {
    color: colors.white
  },
  workflowBody: {
    color: "#d8f0ed"
  },
  workflowBodyMobile: {
    maxWidth: "100%",
    paddingRight: spacing.xs,
    width: "100%"
  },
  stepStack: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.lg
  },
  stepStackMobile: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    gap: spacing.md,
    width: "100%"
  },
  stepItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  stepItemMobile: {
    gap: spacing.sm
  },
  stepNumber: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.round,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  stepNumberMobile: {
    height: 36,
    width: 36
  },
  stepNumberText: {
    color: colors.primaryDark,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black
  },
  stepNumberTextMobile: {
    fontSize: 11
  },
  stepCopy: {
    flex: 1,
    gap: spacing.xs
  },
  stepTitle: {
    color: colors.white,
    fontFamily,
    fontSize: 18,
    fontWeight: typography.weights.black,
    lineHeight: 23
  },
  stepTitleMobile: {
    fontSize: 16,
    lineHeight: 21
  },
  stepBody: {
    color: "#d8f0ed",
    fontFamily,
    fontSize: 14,
    lineHeight: 21
  },
  stepBodyMobile: {
    fontSize: 13,
    lineHeight: 20
  },
  cockpitSection: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxxl
  },
  cockpitSectionMobile: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: spacing.xl
  },
  dashboardMock: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radii.xl,
    borderWidth: 1,
    flex: 1.2,
    gap: spacing.lg,
    minWidth: 310,
    padding: spacing.xl,
    ...shadows.medium
  },
  dashboardMockMobile: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    padding: spacing.lg,
    width: "100%"
  },
  mockHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between"
  },
  mockHeaderMobile: {
    alignItems: "flex-start",
    gap: spacing.md
  },
  mockTitle: {
    color: colors.primary,
    fontFamily,
    fontSize: 24,
    fontWeight: typography.weights.black,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  mockTitleMobile: {
    fontSize: 21,
    lineHeight: 25
  },
  mockSubtitle: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    maxWidth: 360
  },
  mockSubtitleMobile: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 210
  },
  scoreRing: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.round,
    borderWidth: 6,
    height: 78,
    justifyContent: "center",
    width: 78
  },
  scoreRingMobile: {
    borderWidth: 4,
    height: 58,
    width: 58
  },
  scoreRingValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 27,
    fontWeight: typography.weights.black
  },
  scoreRingValueMobile: {
    fontSize: 21
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  dashboardGridMobile: {
    flexDirection: "column",
    flexWrap: "nowrap"
  },
  dashboardCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 190,
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  dashboardCardMobile: {
    flexBasis: "auto",
    padding: spacing.md
  },
  dashboardLabel: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.black,
    textTransform: "uppercase"
  },
  dashboardValue: {
    color: colors.ink,
    fontFamily,
    fontSize: 27,
    fontWeight: typography.weights.black
  },
  dashboardValueMobile: {
    fontSize: 24,
    lineHeight: 28
  },
  dashboardNote: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 12,
    lineHeight: 17
  },
  recommendationStrip: {
    backgroundColor: colors.amberSoft,
    borderColor: "#f4d08c",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg
  },
  recommendationTitle: {
    color: colors.ink,
    fontFamily,
    fontSize: 15,
    fontWeight: typography.weights.black
  },
  recommendationBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 14,
    lineHeight: 21
  },
  cockpitCopy: {
    flex: 0.8,
    gap: spacing.md,
    minWidth: 300
  },
  cockpitCopyMobile: {
    flexBasis: "auto",
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 0,
    width: "100%"
  },
  futureTitle: {
    color: colors.primary,
    fontFamily,
    fontSize: 17,
    fontWeight: typography.weights.black,
    marginTop: spacing.sm
  },
  futureBody: {
    color: colors.inkMuted,
    fontFamily,
    fontSize: 15,
    lineHeight: 23
  },
  finalCta: {
    alignItems: "center",
    backgroundColor: colors.graphite,
    borderRadius: radii.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    justifyContent: "space-between",
    minHeight: 230,
    overflow: "hidden",
    padding: spacing.xxl,
    position: "relative",
    ...shadows.medium
  },
  finalCtaMobile: {
    alignItems: "stretch",
    gap: spacing.lg,
    padding: spacing.xl
  },
  finalImage: {
    bottom: 0,
    left: 0,
    opacity: 0.38,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  finalOverlay: {
    backgroundColor: "rgba(16,24,32,0.68)",
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
    fontSize: 32,
    fontWeight: typography.weights.black,
    lineHeight: 38
  },
  finalBody: {
    color: "#d9efed",
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 660
  },
  finalActions: {
    zIndex: 2
  }
});
