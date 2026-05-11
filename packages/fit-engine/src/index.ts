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

  const kneeScore = kneeAngle ? normalizeRangeScore(kneeAngle, 140, 152) : 72;
  const hipScore = hipAngle ? normalizeRangeScore(hipAngle, 45, 58) : 74;
  const comfortScore = Math.round((kneeScore + hipScore) / 2);
  const aeroScore = Math.round(Math.max(55, Math.min(92, 100 - ((hipAngle ?? 51) - 42))));

  return {
    comfortScore,
    aeroScore,
    confidenceScore: 78
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

  return [
    {
      priority: "medium",
      category: "saddle_height",
      message: isSpanish
        ? "Tu angulo de rodilla estimado esta cerca del rango objetivo. Ajusta la altura del sillin solo en cambios pequenos."
        : "Your estimated knee angle is close to the target range. Adjust saddle height only in small steps.",
      adjustmentMm: measurements.kneeAngle && measurements.kneeAngle < 140 ? 3 : undefined,
      confidenceScore: 0.72
    },
    {
      priority: "medium",
      category: "reach",
      message: isSpanish
        ? "La postura sugiere revisar el alcance si sientes tension en hombros o cuello durante salidas largas."
        : "The posture suggests checking reach if you feel shoulder or neck tension during longer rides.",
      confidenceScore: 0.68
    },
    {
      priority: "low",
      category: "head",
      message: isSpanish
        ? "Mantener la cabeza estable y baja puede mejorar la posicion aero sin sacrificar visibilidad."
        : "Keeping your head stable and lower may improve aero posture without sacrificing visibility.",
      confidenceScore: 0.66
    },
    {
      priority: "low",
      category: "torso",
      message: isSpanish
        ? "Pedalea de forma constante y evita balanceo excesivo antes de hacer ajustes grandes."
        : "Pedal steadily and avoid excessive rocking before making larger setup changes.",
      confidenceScore: 0.7
    }
  ];
}

function normalizeRangeScore(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 88;
  }

  const nearest = value < min ? min : max;
  const distance = Math.abs(value - nearest);
  return Math.round(Math.max(48, 88 - distance * 4));
}
