import type {
  Bike,
  BikeFitDiscipline,
  BikeFitGoal,
  BikeFitPainArea,
  BikeFitZone,
  FitRecommendation,
  FrontKneeSideMetrics,
  JointAngles,
  LanguageCode,
  RecommendationCategory,
  RecommendationConfidence,
  RecommendationPriority
} from "@athmira/types";

export type BikeFitRecommendationThresholds = {
  confidence: {
    minimumForGuidance: number;
    minimumForStrongGuidance: number;
  };
  kneeAngleSupplementary: {
    low: number;
    high: number;
  };
  frontKneeDriftMm: {
    good: number;
    observe: number;
    review: number;
    high: number;
    veryHigh: number;
  };
  elbowAngle: {
    closed: number;
    extended: number;
  };
};

export type BikeFitRecommendationInput = {
  angles?: JointAngles;
  bikeProfile?: Bike | null;
  confidenceScore?: number | null;
  discipline?: BikeFitDiscipline;
  frontKnee?: {
    left: FrontKneeSideMetrics;
    right: FrontKneeSideMetrics;
    overallScore: number;
  };
  goal?: BikeFitGoal;
  kneeAngleMax?: number | null;
  kneeAngleMin?: number | null;
  language?: LanguageCode;
  painAreas?: BikeFitPainArea[];
  thresholds?: Partial<BikeFitRecommendationThresholds>;
};

export type BikeFitRecommendationResult = {
  compositeScore: number;
  primaryRecommendation: FitRecommendation | null;
  recommendations: FitRecommendation[];
  zone: BikeFitZone;
};

export const defaultBikeFitRecommendationThresholds: BikeFitRecommendationThresholds = {
  confidence: {
    minimumForGuidance: 0.5,
    minimumForStrongGuidance: 0.7
  },
  elbowAngle: {
    closed: 72,
    extended: 158
  },
  frontKneeDriftMm: {
    good: 20,
    observe: 40,
    review: 80,
    high: 100,
    veryHigh: 120
  },
  kneeAngleSupplementary: {
    high: 147,
    low: 137
  }
};

export function generateBikeFitRecommendations(input: BikeFitRecommendationInput): BikeFitRecommendationResult {
  const language = input.language ?? "en";
  const thresholds = mergeThresholds(input.thresholds);
  const confidenceScore = normalizeConfidence(input.confidenceScore);
  const confidenceLabel = getConfidenceLabel(confidenceScore, thresholds);
  const lowConfidence = confidenceScore < thresholds.confidence.minimumForGuidance;
  const limitedConfidence = confidenceScore < thresholds.confidence.minimumForStrongGuidance;
  const recommendations: FitRecommendation[] = [];

  if (lowConfidence || limitedConfidence) {
    recommendations.push(
      createRecommendation({
        category: "capture_quality",
        confidence: lowConfidence ? "low" : "medium",
        explanation: text(language, {
          en: "Tracking confidence was limited, so posture conclusions should stay light until the capture is cleaner.",
          es: "La confianza de tracking fue limitada, asi que las conclusiones de postura deben mantenerse suaves hasta mejorar la captura."
        }),
        id: "limited-capture-confidence",
        priority: lowConfidence ? "high" : "medium",
        retestInstruction: text(language, {
          en: "Repeat the analysis after the setup changes and compare the new confidence score before adjusting the bike.",
          es: "Repite el analisis despues de mejorar la captura y compara la nueva confianza antes de ajustar la bici."
        }),
        suggestedAction: getCaptureQualityAction(language, input.frontKnee ? "front" : "side"),
        title: text(language, {
          en: "Improve capture quality first",
          es: "Mejora primero la calidad de captura"
        }),
        zone: "low_tracking_confidence"
      })
    );
  }

  if (lowConfidence) {
    return finishRecommendations({
      confidenceScore,
      input,
      recommendations,
      thresholds,
      zone: "low_tracking_confidence"
    });
  }

  const kneeRecommendation = getKneeAngleRecommendation(input, thresholds, language, confidenceLabel);
  if (kneeRecommendation) {
    recommendations.push(downgradeIfLimited(kneeRecommendation, limitedConfidence));
  }

  const frontRecommendation = getFrontKneeRecommendation(input, thresholds, language, confidenceLabel);
  if (frontRecommendation) {
    recommendations.push(downgradeIfLimited(frontRecommendation, limitedConfidence));
  }

  const hipRecommendation = getHipRecommendation(input, language, confidenceLabel);
  if (hipRecommendation) {
    recommendations.push(downgradeIfLimited(hipRecommendation, limitedConfidence));
  }

  const cockpitRecommendation = getCockpitRecommendation(input, thresholds, language, confidenceLabel);
  if (cockpitRecommendation) {
    recommendations.push(downgradeIfLimited(cockpitRecommendation, limitedConfidence));
  }

  const torsoRecommendation = getTorsoRecommendation(input, language, confidenceLabel);
  if (torsoRecommendation) {
    recommendations.push(downgradeIfLimited(torsoRecommendation, limitedConfidence));
  }

  if (!recommendations.some((recommendation) => recommendation.category !== "capture_quality")) {
    recommendations.push(
      createRecommendation({
        category: "comfort",
        confidence: confidenceLabel,
        explanation: text(language, {
          en: "The main fit signals are close to the current target ranges. Keep changes small and use future sessions for comparison.",
          es: "Las senales principales de fit estan cerca de los rangos objetivo actuales. Mantén cambios pequenos y usa futuras sesiones para comparar."
        }),
        id: "fit-signals-in-range",
        priority: "low",
        retestInstruction: text(language, {
          en: "Repeat the same side and front captures after any equipment or position change.",
          es: "Repite las mismas capturas lateral y frontal despues de cualquier cambio de equipo o posicion."
        }),
        suggestedAction: text(language, {
          en: "Stay with the current setup unless comfort changes during real rides.",
          es: "Mantén la configuracion actual salvo que la comodidad cambie en salidas reales."
        }),
        title: text(language, {
          en: "Current setup looks reasonable",
          es: "La configuracion actual se ve razonable"
        }),
        zone: "ok"
      })
    );
  }

  if (hasPain(input.painAreas)) {
    recommendations.push(
      createRecommendation({
        category: "comfort",
        confidence: "medium",
        explanation: text(language, {
          en: "You marked discomfort, so fit changes should be conservative and validated outside the camera test.",
          es: "Marcaste molestias, asi que los cambios de fit deben ser conservadores y validarse fuera de la prueba de Bike Fit."
        }),
        id: "pain-professional-support",
        medicalDisclaimer: getMedicalDisclaimer(language),
        priority: "medium",
        retestInstruction: text(language, {
          en: "Retest only after a small adjustment, then check how the position feels on an easy ride.",
          es: "Repite solo despues de un ajuste pequeno y revisa como se siente la posicion en una salida suave."
        }),
        suggestedAction: text(language, {
          en: "If pain is persistent or important, consult a health professional or bike fitter before continuing adjustments.",
          es: "Si el dolor persiste o es importante, consulta con un profesional de salud o bike fitter antes de seguir ajustando."
        }),
        title: text(language, {
          en: "Treat discomfort conservatively",
          es: "Maneja las molestias con prudencia"
        }),
        zone: "review"
      })
    );
  }

  return finishRecommendations({
    confidenceScore,
    input,
    recommendations,
    thresholds,
    zone: deriveZone(recommendations, limitedConfidence)
  });
}

function getKneeAngleRecommendation(
  input: BikeFitRecommendationInput,
  thresholds: BikeFitRecommendationThresholds,
  language: LanguageCode,
  confidence: RecommendationConfidence
): FitRecommendation | null {
  const kneeAngle = input.kneeAngleMax ?? input.angles?.kneeAngle;
  if (!isFiniteNumber(kneeAngle)) {
    return null;
  }

  if (kneeAngle < thresholds.kneeAngleSupplementary.low) {
    return createRecommendation({
      adjustmentMm: 4,
      category: "saddle_height",
      confidence,
      explanation: text(language, {
        en: "Your knee appears to stay more flexed near the bottom of the pedal stroke than the current supplementary-angle target.",
        es: "Tu rodilla parece mantenerse mas flexionada cerca de la parte baja del pedaleo que el rango objetivo actual de angulo suplementario."
      }),
      id: "possible-low-saddle",
      priority: "high",
      retestInstruction: text(language, {
        en: "Repeat the side analysis after the adjustment and compare the knee angle before changing anything else.",
        es: "Repite el analisis lateral despues del ajuste y compara el angulo de rodilla antes de cambiar algo mas."
      }),
      suggestedAction: text(language, {
        en: "You could try raising the saddle by 3 to 5 mm.",
        es: "Podrias probar subir el sillin entre 3 y 5 mm."
      }),
      title: text(language, {
        en: "The saddle could be slightly low",
        es: "El sillin podria estar un poco bajo"
      }),
      zone: "review"
    });
  }

  if (kneeAngle > thresholds.kneeAngleSupplementary.high) {
    return createRecommendation({
      adjustmentMm: -4,
      category: "saddle_height",
      confidence,
      explanation: text(language, {
        en: "Your leg appears quite extended near the bottom of the pedal stroke. This can sometimes reduce control or create reaching.",
        es: "Tu pierna parece bastante extendida cerca de la parte baja del pedaleo. Esto a veces puede reducir control o generar alcance excesivo."
      }),
      id: "possible-high-saddle",
      priority: "high",
      retestInstruction: text(language, {
        en: "Repeat the side analysis and check whether the knee angle moves back toward 137 to 147 degrees.",
        es: "Repite el analisis lateral y revisa si el angulo de rodilla vuelve hacia 137 a 147 grados."
      }),
      suggestedAction: text(language, {
        en: "You could try lowering the saddle by 3 to 5 mm.",
        es: "Podrias probar bajar el sillin entre 3 y 5 mm."
      }),
      title: text(language, {
        en: "The saddle could be slightly high",
        es: "El sillin podria estar un poco alto"
      }),
      zone: "review"
    });
  }

  return null;
}

function getFrontKneeRecommendation(
  input: BikeFitRecommendationInput,
  thresholds: BikeFitRecommendationThresholds,
  language: LanguageCode,
  confidence: RecommendationConfidence
): FitRecommendation | null {
  if (!input.frontKnee) {
    return null;
  }

  const maxDrift = Math.max(input.frontKnee.left.kneeDriftMm ?? 0, input.frontKnee.right.kneeDriftMm ?? 0);
  const maxTravel = Math.max(input.frontKnee.left.horizontalTravelMm ?? 0, input.frontKnee.right.horizontalTravelMm ?? 0);
  const maxLateral = Math.max(maxDrift, maxTravel);
  const asymmetry = Math.abs((input.frontKnee.left.kneeDriftMm ?? 0) - (input.frontKnee.right.kneeDriftMm ?? 0));

  if (maxLateral >= thresholds.frontKneeDriftMm.high) {
    return createRecommendation({
      category: "knee_tracking",
      confidence,
      explanation: text(language, {
        en: "The knee path moved substantially relative to the foot line. This pattern can suggest hip stability, cleat alignment, stance width, or foot-support factors.",
        es: "La trayectoria de rodilla se movio bastante respecto a la linea del pie. Este patron puede sugerir estabilidad de cadera, alineacion de calas, ancho de apoyo o soporte del pie."
      }),
      id: "high-lateral-knee-movement",
      priority: maxLateral >= thresholds.frontKneeDriftMm.veryHigh ? "high" : "medium",
      retestInstruction: text(language, {
        en: "Repeat the front capture with the camera centered and better light to confirm the pattern before making strong changes.",
        es: "Repite la captura frontal con camara centrada y mejor luz para confirmar el patron antes de hacer cambios fuertes."
      }),
      suggestedAction: text(language, {
        en: "Review cleat alignment, hip stability, and foot position. Make only one small change before retesting.",
        es: "Recomendamos revisar alineacion de calas, estabilidad de cadera y posicion del pie. Haz solo un cambio pequeno antes de repetir."
      }),
      title: text(language, {
        en: "High lateral knee movement",
        es: "Movimiento lateral alto de rodilla"
      }),
      zone: maxLateral >= thresholds.frontKneeDriftMm.veryHigh ? "high_risk_adjustment" : "review"
    });
  }

  if (maxLateral >= thresholds.frontKneeDriftMm.observe || asymmetry > 25) {
    return createRecommendation({
      category: "hip_stability",
      confidence,
      explanation: text(language, {
        en: "There is some side-to-side knee movement or left-right asymmetry. This is worth watching before changing cleats.",
        es: "Hay algo de movimiento lateral o asimetria entre izquierda y derecha. Vale la pena observarlo antes de modificar calas."
      }),
      id: "moderate-knee-path-asymmetry",
      priority: "medium",
      retestInstruction: text(language, {
        en: "Retest with the same cadence and camera position, then compare both knees.",
        es: "Repite con la misma cadencia y posicion de camara, luego compara ambas rodillas."
      }),
      suggestedAction: text(language, {
        en: "Check that the hips stay quiet and the feet remain consistently supported through the pedal stroke.",
        es: "Revisa que la cadera se mantenga estable y que los pies tengan apoyo consistente durante el pedaleo."
      }),
      title: text(language, {
        en: "Watch knee path stability",
        es: "Observa la estabilidad de la trayectoria"
      }),
      zone: "review"
    });
  }

  return null;
}

function getHipRecommendation(
  input: BikeFitRecommendationInput,
  language: LanguageCode,
  confidence: RecommendationConfidence
): FitRecommendation | null {
  const hipAngle = input.angles?.hipAngle;
  if (!isFiniteNumber(hipAngle) || hipAngle >= 95) {
    return null;
  }

  return createRecommendation({
    category: "cockpit",
    confidence,
    explanation: text(language, {
      en: "The hip angle looks closed for a sustainable position, especially if the goal is aggressive or triathlon-oriented.",
      es: "El angulo de cadera se ve cerrado para una posicion sostenible, especialmente si el objetivo es agresivo o de triatlon."
    }),
    id: "closed-hip-angle",
    priority: "medium",
    retestInstruction: text(language, {
      en: "Retest after one small cockpit or saddle-position change and check whether breathing and low-back comfort improve.",
      es: "Repite despues de un cambio pequeno de cockpit o posicion del sillin y revisa si mejora la respiracion y comodidad lumbar."
    }),
    suggestedAction: text(language, {
      en: "You could review handlebar height, reach, saddle setback, or shorter cranks if the position is very aggressive.",
      es: "Podrias revisar altura del manubrio, alcance, retroceso del sillin o bielas mas cortas si la posicion es muy agresiva."
    }),
    title: text(language, {
      en: "Hip angle may be too closed",
      es: "La cadera podria estar demasiado cerrada"
    }),
    zone: "review"
  });
}

function getCockpitRecommendation(
  input: BikeFitRecommendationInput,
  thresholds: BikeFitRecommendationThresholds,
  language: LanguageCode,
  confidence: RecommendationConfidence
): FitRecommendation | null {
  const elbowAngle = input.angles?.elbowAngle;
  if (!isFiniteNumber(elbowAngle)) {
    return null;
  }

  if (elbowAngle > thresholds.elbowAngle.extended) {
    return createRecommendation({
      category: "cockpit",
      confidence,
      explanation: text(language, {
        en: "The arms look close to locked out. This can suggest a long reach or a cockpit that asks the shoulders to carry too much load.",
        es: "Los brazos se ven cerca de bloquearse. Esto puede sugerir alcance largo o un cockpit que carga demasiado los hombros."
      }),
      id: "extended-elbow-long-reach",
      priority: "medium",
      retestInstruction: text(language, {
        en: "Retest after checking hand position and reach; do not combine this with a saddle-height change in the same test.",
        es: "Repite despues de revisar posicion de manos y alcance; no combines esto con cambio de altura de sillin en la misma prueba."
      }),
      suggestedAction: text(language, {
        en: "Review stem length, hood position, and handlebar height. Aim for relaxed arms, not locked elbows.",
        es: "Revisa longitud de potencia, posicion de escaladores y altura de manubrio. Busca brazos relajados, no codos bloqueados."
      }),
      title: text(language, {
        en: "Reach may be long",
        es: "El alcance podria ser largo"
      }),
      zone: "review"
    });
  }

  if (elbowAngle < thresholds.elbowAngle.closed) {
    return createRecommendation({
      category: "cockpit",
      confidence,
      explanation: text(language, {
        en: "The elbow angle looks very closed, which can happen when the cockpit feels cramped or the torso is compressed.",
        es: "El angulo de codo se ve muy cerrado, algo que puede pasar cuando el cockpit se siente corto o el torso queda comprimido."
      }),
      id: "closed-elbow-short-cockpit",
      priority: "low",
      retestInstruction: text(language, {
        en: "Retest after confirming saddle height first, then compare hand pressure and shoulder comfort.",
        es: "Repite despues de confirmar primero la altura del sillin, luego compara presion en manos y comodidad de hombros."
      }),
      suggestedAction: text(language, {
        en: "Review hand position, bar reach, and stem length before making larger cockpit changes.",
        es: "Revisa posicion de manos, alcance del manubrio y longitud de potencia antes de hacer cambios grandes."
      }),
      title: text(language, {
        en: "Cockpit may feel compressed",
        es: "El cockpit podria sentirse comprimido"
      }),
      zone: "review"
    });
  }

  return null;
}

function getTorsoRecommendation(
  input: BikeFitRecommendationInput,
  language: LanguageCode,
  confidence: RecommendationConfidence
): FitRecommendation | null {
  const torsoAngle = input.angles?.torsoAngle;
  if (!isFiniteNumber(torsoAngle)) {
    return null;
  }

  const range = getTorsoRange(input);
  if (torsoAngle >= range.min && torsoAngle <= range.max) {
    return null;
  }

  const tooLow = torsoAngle < range.min;
  return createRecommendation({
    category: tooLow ? "comfort" : "aero",
    confidence,
    explanation: tooLow
      ? text(language, {
          en: "Your torso is lower than the current bike and goal target. A low position can be fast, but it should remain sustainable.",
          es: "Tu torso esta mas bajo que el objetivo actual para esta bici y meta. Una posicion baja puede ser rapida, pero debe ser sostenible."
        })
      : text(language, {
          en: "Your torso is more upright than this bike and goal target. That can be fine for comfort, but it may not match an aggressive or race setup.",
          es: "Tu torso esta mas erguido que el objetivo actual para esta bici y meta. Puede estar bien para comodidad, pero quizas no coincida con una posicion agresiva o de competencia."
        }),
    id: tooLow ? "torso-lower-than-goal" : "torso-higher-than-goal",
    priority: input.goal === "comfort" || input.discipline === "hybrid" || input.discipline === "mtb_trail_enduro" ? "low" : "medium",
    retestInstruction: text(language, {
      en: "Retest after a small cockpit change and keep the position only if it feels sustainable while pedaling.",
      es: "Repite despues de un cambio pequeno en cockpit y conserva la posicion solo si se siente sostenible pedaleando."
    }),
    suggestedAction: tooLow
      ? text(language, {
          en: "If comfort is the goal, you could raise the cockpit slightly or reduce reach.",
          es: "Si buscas comodidad, podrias subir ligeramente el cockpit o reducir el alcance."
        })
      : text(language, {
          en: "If aero is the goal, review cockpit height, reach, and flexibility gradually.",
          es: "Si buscas aero, revisa altura del cockpit, alcance y flexibilidad de forma gradual."
        }),
    title: tooLow
      ? text(language, {
          en: "Position may be too aggressive for the goal",
          es: "La posicion podria ser muy agresiva para el objetivo"
        })
      : text(language, {
          en: "Torso position may not match the goal",
          es: "La posicion de torso podria no coincidir con el objetivo"
        }),
    zone: "review"
  });
}

function finishRecommendations(input: {
  confidenceScore: number;
  input: BikeFitRecommendationInput;
  recommendations: FitRecommendation[];
  thresholds: BikeFitRecommendationThresholds;
  zone: BikeFitZone;
}): BikeFitRecommendationResult {
  const ordered = orderRecommendations(input.recommendations);
  const primaryIndex = ordered.findIndex((recommendation) => recommendation.category !== "capture_quality" || input.zone === "low_tracking_confidence");

  if (primaryIndex >= 0) {
    const primary = ordered[primaryIndex];

    if (primary) {
      ordered[primaryIndex] = { ...primary, isPrimary: true };
    }
  }

  return {
    compositeScore: calculateCompositeScore(input.input, input.confidenceScore),
    primaryRecommendation: primaryIndex >= 0 ? ordered[primaryIndex] ?? null : null,
    recommendations: ordered.slice(0, 4),
    zone: input.zone
  };
}

function calculateCompositeScore(input: BikeFitRecommendationInput, confidenceScore: number): number {
  const kneeAngle = input.kneeAngleMax ?? input.angles?.kneeAngle;
  const saddleScore = isFiniteNumber(kneeAngle) ? normalizeRangeScore(kneeAngle, 137, 147) : 70;
  const frontScore = input.frontKnee ? input.frontKnee.overallScore : 70;
  const torsoScore = isFiniteNumber(input.angles?.torsoAngle) ? getTorsoScore(input.angles.torsoAngle, getTorsoRange(input)) : 72;
  const comfortScore = getComfortScore(input);
  const captureScore = Math.round(confidenceScore * 100);
  const rawScore = Math.round(saddleScore * 0.3 + frontScore * 0.3 + torsoScore * 0.2 + comfortScore * 0.1 + captureScore * 0.1);

  if (confidenceScore < 0.5) {
    return Math.min(rawScore, 55);
  }

  if (confidenceScore < 0.7) {
    return Math.min(rawScore, 75);
  }

  return clamp(rawScore, 0, 100);
}

function getComfortScore(input: BikeFitRecommendationInput): number {
  let score = 78;

  if (isFiniteNumber(input.angles?.hipAngle) && input.angles.hipAngle < 95) {
    score -= 14;
  }

  if (isFiniteNumber(input.angles?.elbowAngle) && input.angles.elbowAngle > 158) {
    score -= 10;
  }

  if (hasPain(input.painAreas)) {
    score -= 12;
  }

  return clamp(score, 35, 92);
}

function getTorsoRange(input: BikeFitRecommendationInput): { min: number; max: number } {
  const discipline = input.discipline ?? inferDiscipline(input.bikeProfile, input.goal);
  const comfortBias = input.goal === "comfort" ? 5 : input.goal === "aggressive" || input.goal === "competition" ? -4 : 0;

  switch (discipline) {
    case "road_race":
      return { max: 44 + comfortBias, min: 35 + comfortBias };
    case "road_endurance":
      return { max: 55 + comfortBias, min: 40 + comfortBias };
    case "gravel_race":
      return { max: 50 + comfortBias, min: 38 + comfortBias };
    case "gravel_adventure":
      return { max: 60, min: 42 };
    case "triathlon":
      return { max: input.goal === "comfort" ? 35 : 30, min: 10 };
    case "mtb_xc":
      return { max: 55, min: 38 };
    case "mtb_trail_enduro":
      return { max: 70, min: 45 };
    case "hybrid":
      return { max: 75, min: 50 };
    default:
      return { max: 55, min: 38 };
  }
}

function inferDiscipline(bike?: Bike | null, goal?: BikeFitGoal): BikeFitDiscipline {
  switch (bike?.bike_type) {
    case "road":
      return goal === "aggressive" || goal === "competition" ? "road_race" : "road_endurance";
    case "gravel":
      return goal === "aggressive" || goal === "competition" ? "gravel_race" : "gravel_adventure";
    case "triathlon":
      return "triathlon";
    case "mountain":
      return goal === "competition" ? "mtb_xc" : "mtb_trail_enduro";
    case "hybrid":
      return "hybrid";
    default:
      return "road_endurance";
  }
}

function createRecommendation(input: {
  adjustmentMm?: number;
  category: RecommendationCategory;
  confidence: RecommendationConfidence;
  explanation: string;
  id: string;
  medicalDisclaimer?: string;
  priority: RecommendationPriority;
  retestInstruction: string;
  suggestedAction: string;
  title: string;
  zone: BikeFitZone;
}): FitRecommendation {
  return {
    adjustmentMm: input.adjustmentMm,
    category: input.category,
    confidence: input.confidence,
    confidenceScore: input.confidence === "high" ? 0.82 : input.confidence === "medium" ? 0.68 : 0.48,
    explanation: input.explanation,
    id: input.id,
    medicalDisclaimer: input.medicalDisclaimer,
    message: `${input.explanation} ${input.suggestedAction} ${input.retestInstruction}`,
    priority: input.priority,
    retestInstruction: input.retestInstruction,
    suggestedAction: input.suggestedAction,
    title: input.title,
    zone: input.zone
  };
}

function orderRecommendations(recommendations: FitRecommendation[]): FitRecommendation[] {
  const categoryOrder: RecommendationCategory[] = [
    "capture_quality",
    "saddle_height",
    "knee_tracking",
    "hip_stability",
    "cockpit",
    "cleats",
    "saddle_setback",
    "comfort",
    "aero",
    "torso",
    "reach",
    "arms",
    "head",
    "saddle_position"
  ];

  return [...recommendations].sort((a, b) => {
    const priorityDelta = priorityRank(b.priority) - priorityRank(a.priority);
    if (priorityDelta) {
      return priorityDelta;
    }

    return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  });
}

function downgradeIfLimited(recommendation: FitRecommendation, limitedConfidence: boolean): FitRecommendation {
  if (!limitedConfidence || recommendation.priority === "low") {
    return recommendation;
  }

  return {
    ...recommendation,
    confidence: "medium",
    confidenceScore: Math.min(recommendation.confidenceScore, 0.66),
    priority: recommendation.priority === "high" ? "medium" : recommendation.priority
  };
}

function deriveZone(recommendations: FitRecommendation[], limitedConfidence: boolean): BikeFitZone {
  if (limitedConfidence) {
    return "low_tracking_confidence";
  }

  if (recommendations.some((recommendation) => recommendation.zone === "high_risk_adjustment")) {
    return "high_risk_adjustment";
  }

  if (recommendations.some((recommendation) => recommendation.zone === "review")) {
    return "review";
  }

  return "ok";
}

function getConfidenceLabel(
  confidenceScore: number,
  thresholds: BikeFitRecommendationThresholds
): RecommendationConfidence {
  if (confidenceScore >= thresholds.confidence.minimumForStrongGuidance) {
    return "high";
  }

  if (confidenceScore >= thresholds.confidence.minimumForGuidance) {
    return "medium";
  }

  return "low";
}

function normalizeConfidence(value?: number | null): number {
  if (!isFiniteNumber(value)) {
    return 0.78;
  }

  return value > 1 ? clamp(value / 100, 0, 1) : clamp(value, 0, 1);
}

function mergeThresholds(input?: Partial<BikeFitRecommendationThresholds>): BikeFitRecommendationThresholds {
  return {
    confidence: { ...defaultBikeFitRecommendationThresholds.confidence, ...input?.confidence },
    elbowAngle: { ...defaultBikeFitRecommendationThresholds.elbowAngle, ...input?.elbowAngle },
    frontKneeDriftMm: { ...defaultBikeFitRecommendationThresholds.frontKneeDriftMm, ...input?.frontKneeDriftMm },
    kneeAngleSupplementary: {
      ...defaultBikeFitRecommendationThresholds.kneeAngleSupplementary,
      ...input?.kneeAngleSupplementary
    }
  };
}

function getTorsoScore(value: number, range: { min: number; max: number }): number {
  if (value >= range.min && value <= range.max) {
    return 88;
  }

  const nearest = value < range.min ? range.min : range.max;
  return clamp(Math.round(88 - Math.abs(value - nearest) * 3), 40, 88);
}

function normalizeRangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 90;
  }

  const nearest = value < min ? min : max;
  return clamp(Math.round(90 - Math.abs(value - nearest) * 5), 35, 90);
}

function priorityRank(priority: RecommendationPriority): number {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function getCaptureQualityAction(language: LanguageCode, view: "front" | "side") {
  if (view === "front") {
    return text(language, {
      en: "Use more light, center the front wheel, keep both knees, ankles, and hips visible, and avoid a tilted camera.",
      es: "Usa mas luz, centra la rueda delantera, deja visibles ambas rodillas, tobillos y cadera, y evita inclinar la camara."
    });
  }

  return text(language, {
    en: "Use a stable side camera, keep the full bike and rider visible, and make sure hip, knee, ankle, shoulder, elbow, and wrist are unobstructed.",
    es: "Usa una camara lateral estable, manten bici y ciclista completos visibles, y deja despejados cadera, rodilla, tobillo, hombro, codo y muneca."
  });
}

function getMedicalDisclaimer(language: LanguageCode) {
  return text(language, {
    en: "Athmira provides educational computer-vision guidance. It does not replace medical, physical therapy, coaching, or professional bike-fit evaluation.",
    es: "Athmira ofrece orientacion educativa basada en vision por computador. No reemplaza una evaluacion medica, fisioterapeutica, de coaching ni un bike fit profesional."
  });
}

function hasPain(painAreas?: BikeFitPainArea[]) {
  return Boolean(painAreas?.some((painArea) => painArea !== "none"));
}

function text(language: LanguageCode, copy: { en: string; es: string }) {
  return language === "es" ? copy.es : copy.en;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
