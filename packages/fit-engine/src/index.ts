import type {
  Bike,
  FitMeasurement,
  FitRecommendation,
  FitScore,
  JointAngles,
  LanguageCode,
  UserProfile
} from "@athmira/types";

export function calculateFitScore(measurements: Partial<FitMeasurement> | JointAngles): FitScore {
  const kneeAngle = isJointAngles(measurements) ? measurements.kneeAngle : measurements.knee_angle_max;
  const hipAngle = isJointAngles(measurements) ? measurements.hipAngle : measurements.hip_angle_avg;
  const torsoAngle = isJointAngles(measurements) ? measurements.torsoAngle : measurements.torso_angle_avg;
  const elbowAngle = isJointAngles(measurements) ? measurements.elbowAngle : measurements.elbow_angle_avg;
  const confidence = isJointAngles(measurements) ? undefined : measurements.confidence_score;

  const kneeScore = kneeAngle ? normalizeRangeScore(kneeAngle, 138, 154) : 70;
  const hipScore = hipAngle ? normalizeRangeScore(hipAngle, 42, 62) : 70;
  const torsoComfortScore = torsoAngle ? normalizeRangeScore(torsoAngle, 28, 52) : 72;
  const elbowScore = elbowAngle ? normalizeRangeScore(elbowAngle, 82, 112) : 72;
  const comfortScore = Math.round(kneeScore * 0.35 + hipScore * 0.3 + torsoComfortScore * 0.2 + elbowScore * 0.15);
  const aeroScore = Math.round(
    clamp(
      (torsoAngle ? 100 - Math.abs(torsoAngle - 32) * 1.4 : 72) * 0.55 +
        (elbowAngle ? 100 - Math.abs(elbowAngle - 92) * 0.9 : 74) * 0.25 +
        (hipAngle ? 100 - Math.abs(hipAngle - 48) * 1.1 : 70) * 0.2,
      45,
      96
    )
  );

  return {
    comfortScore,
    aeroScore,
    confidenceScore: Math.round((confidence ?? 0.78) * 100)
  };
}

function isJointAngles(measurements: Partial<FitMeasurement> | JointAngles): measurements is JointAngles {
  return (
    "kneeAngle" in measurements ||
    "hipAngle" in measurements ||
    "torsoAngle" in measurements ||
    "elbowAngle" in measurements ||
    "shoulderAngle" in measurements
  );
}

export function generateFitRecommendations(
  measurements: JointAngles,
  _bikeProfile?: Bike | null,
  _userProfile?: UserProfile | null,
  language: LanguageCode = "en"
): FitRecommendation[] {
  const isSpanish = language === "es";
  const recommendations: FitRecommendation[] = [];
  const kneeAngle = measurements.kneeAngle;
  const hipAngle = measurements.hipAngle;
  const torsoAngle = measurements.torsoAngle;
  const elbowAngle = measurements.elbowAngle;

  if (kneeAngle && kneeAngle > 156) {
    recommendations.push({
      priority: "high",
      category: "saddle_height",
      message: isSpanish
        ? "La pierna se ve demasiado extendida en el punto mas bajo. Baja el sillin en pequenos pasos y repite el analisis."
        : "Your leg looks overextended near the bottom of the stroke. Lower the saddle in small steps and repeat the analysis.",
      adjustmentMm: -4,
      confidenceScore: 0.78
    });
  } else if (kneeAngle && kneeAngle < 136) {
    recommendations.push({
      priority: "high",
      category: "saddle_height",
      message: isSpanish
        ? "La rodilla queda demasiado cerrada. Sube el sillin gradualmente y vuelve a medir antes de hacer cambios grandes."
        : "Your knee remains too closed. Raise the saddle gradually and re-measure before making larger changes.",
      adjustmentMm: 4,
      confidenceScore: 0.78
    });
  } else {
    recommendations.push({
      priority: "low",
      category: "saddle_height",
      message: isSpanish
        ? "La extension de rodilla estimada esta cerca del rango objetivo. Mantén los cambios de sillin pequenos."
        : "Your estimated knee extension is close to the target range. Keep saddle-height changes small.",
      confidenceScore: 0.72
    });
  }

  if (hipAngle && hipAngle < 42) {
    recommendations.push({
      priority: "medium",
      category: "reach",
      message: isSpanish
        ? "La cadera se ve muy cerrada. Revisa alcance, altura frontal o rotacion de pelvis si sientes compresion al pedalear."
        : "Your hip angle looks very closed. Check reach, front-end height, or pelvic rotation if you feel compressed while riding.",
      confidenceScore: 0.72
    });
  } else if (hipAngle && hipAngle > 66) {
    recommendations.push({
      priority: "medium",
      category: "torso",
      message: isSpanish
        ? "La postura se ve bastante abierta. Puede ser comoda, pero si buscas aero considera bajar la parte frontal poco a poco."
        : "Your position looks fairly open. That may be comfortable, but if aero is the goal consider lowering the front end gradually.",
      confidenceScore: 0.72
    });
  }

  if (torsoAngle && torsoAngle > 52) {
    recommendations.push({
      priority: "medium",
      category: "aero",
      message: isSpanish
        ? "El torso esta alto para una posicion aero. Prueba ajustes pequenos en cockpit antes de comprometer comodidad."
        : "Your torso is high for an aero-oriented position. Try small cockpit changes before sacrificing comfort.",
      confidenceScore: 0.7
    });
  } else if (torsoAngle && torsoAngle < 25) {
    recommendations.push({
      priority: "low",
      category: "comfort",
      message: isSpanish
        ? "La posicion es agresiva. Vigila cuello, espalda y respiracion durante esfuerzos largos."
        : "This is an aggressive position. Watch neck, back, and breathing comfort during longer efforts.",
      confidenceScore: 0.68
    });
  }

  if (elbowAngle && elbowAngle > 122) {
    recommendations.push({
      priority: "medium",
      category: "arms",
      message: isSpanish
        ? "Los brazos se ven muy extendidos. Un codo ligeramente flexionado mejora control y reduce carga en hombros."
        : "Your arms look too extended. A slight elbow bend improves control and reduces shoulder load.",
      confidenceScore: 0.72
    });
  } else if (elbowAngle && elbowAngle < 72) {
    recommendations.push({
      priority: "low",
      category: "reach",
      message: isSpanish
        ? "El codo se ve muy cerrado. Si sientes presion en manos o hombros, revisa alcance y apoyo."
        : "Your elbow angle looks very closed. If you feel hand or shoulder pressure, review reach and support.",
      confidenceScore: 0.68
    });
  }

  recommendations.push({
    priority: "low",
    category: "head",
    message: isSpanish
      ? "Mantén la cabeza estable y la mirada al frente. La guia es educativa y no reemplaza un fit profesional."
      : "Keep your head stable with eyes forward. This guidance is educational and does not replace a professional fit.",
    confidenceScore: 0.66
  });

  return recommendations.slice(0, 5);
}

function normalizeRangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 88;
  }

  const nearest = value < min ? min : max;
  const distance = Math.abs(value - nearest);
  return Math.round(Math.max(48, 88 - distance * 4));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
