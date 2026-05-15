import type {
  Bike,
  FitMeasurement,
  FitRecommendation,
  FitScore,
  FrontKneeSideMetrics,
  FrontKneeTrackingResult,
  FrontKneeTrackingSample,
  JointAngles,
  LanguageCode,
  PoseFrameResult,
  PoseKeypoint,
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

export function analyzeFrontKneeTracking(
  poseFrames: PoseFrameResult[],
  options: {
    durationMs?: number;
    language?: LanguageCode;
    userProfile?: UserProfile | null;
  } = {}
): FrontKneeTrackingResult {
  const durationMs = options.durationMs ?? calculateDurationMs(poseFrames);
  const samples = poseFrames.map(toFrontKneeTrackingSample);
  const estimatedMmPerPixel = estimateMmPerPixel(samples, options.userProfile);
  const left = calculateSideMetrics(samples, "left", estimatedMmPerPixel);
  const right = calculateSideMetrics(samples, "right", estimatedMmPerPixel);
  const confidenceScore = round((left.confidenceScore + right.confidenceScore) / 2, 2);
  const overallScore = Math.round((left.stabilityScore + right.stabilityScore) / 2);

  return {
    confidenceScore,
    durationMs,
    estimatedMmPerPixel,
    left,
    overallScore,
    recommendations: generateFrontKneeRecommendations(left, right, overallScore, options.language ?? "en"),
    right,
    sampleCount: Math.max(left.sampleCount, right.sampleCount)
  };
}

export function toFrontKneeTrackingSample(frame: PoseFrameResult): FrontKneeTrackingSample {
  const timestampMs = frame.frame?.timestampMs ?? Date.now();

  return {
    timestampMs,
    leftAnkle: toTrackingPoint(findKeypoint(frame.keypoints, "left_ankle")),
    leftHip: toTrackingPoint(findKeypoint(frame.keypoints, "left_hip")),
    leftKnee: toTrackingPoint(findKeypoint(frame.keypoints, "left_knee")),
    rightAnkle: toTrackingPoint(findKeypoint(frame.keypoints, "right_ankle")),
    rightHip: toTrackingPoint(findKeypoint(frame.keypoints, "right_hip")),
    rightKnee: toTrackingPoint(findKeypoint(frame.keypoints, "right_knee"))
  };
}

export function generateFrontKneeRecommendations(
  left: FrontKneeSideMetrics,
  right: FrontKneeSideMetrics,
  overallScore: number,
  language: LanguageCode = "en"
): FitRecommendation[] {
  const isSpanish = language === "es";
  const recommendations: FitRecommendation[] = [];
  const largerDrift = Math.max(left.kneeDriftMm ?? 0, right.kneeDriftMm ?? 0);
  const largerHorizontalTravel = Math.max(left.horizontalTravelMm ?? 0, right.horizontalTravelMm ?? 0);
  const asymmetry = Math.abs((left.kneeDriftMm ?? 0) - (right.kneeDriftMm ?? 0));

  if (overallScore >= 82) {
    recommendations.push({
      priority: "low",
      category: "comfort",
      message: isSpanish
        ? "El recorrido frontal de rodillas se ve estable. Mantén la misma cadencia y repite si cambias calas, sillin o zapatillas."
        : "Your front-view knee path looks stable. Keep the same cadence and repeat after cleat, saddle, or shoe changes.",
      confidenceScore: 0.76
    });
  } else if (largerDrift > 45 || largerHorizontalTravel > 65) {
    recommendations.push({
      priority: "high",
      category: "comfort",
      message: isSpanish
        ? "Hay desplazamiento lateral alto de rodilla. Revisa alineacion de calas, estabilidad de cadera y control de rodilla antes de aumentar volumen."
        : "There is high lateral knee movement. Review cleat alignment, hip stability, and knee control before increasing training volume.",
      confidenceScore: 0.74
    });
  } else {
    recommendations.push({
      priority: "medium",
      category: "comfort",
      message: isSpanish
        ? "Hay algo de movimiento lateral. Busca que la rodilla suba y baje con menos zigzag mientras mantienes una cadencia suave."
        : "There is some lateral movement. Aim for a knee path that rises and falls with less side-to-side drift at a smooth cadence.",
      confidenceScore: 0.72
    });
  }

  if (asymmetry > 25) {
    recommendations.push({
      priority: "medium",
      category: "saddle_position",
      message: isSpanish
        ? "La trayectoria izquierda y derecha no es simetrica. Compara posicion de calas, soporte del arco y estabilidad de pelvis en ambos lados."
        : "Left and right knee paths are not symmetrical. Compare cleat position, arch support, and pelvic stability on both sides.",
      confidenceScore: 0.7
    });
  }

  if (Math.min(left.confidenceScore, right.confidenceScore) < 0.55) {
    recommendations.push({
      priority: "low",
      category: "comfort",
      message: isSpanish
        ? "La confianza de deteccion fue limitada. Usa mas luz, centra la rueda delantera y deja visibles rodillas, tobillos y cadera."
        : "Detection confidence was limited. Use better lighting, center the front wheel, and keep knees, ankles, and hips visible.",
      confidenceScore: 0.62
    });
  }

  recommendations.push({
    priority: "low",
    category: "comfort",
    message: isSpanish
      ? "Estas medidas son estimadas desde camara frontal y tienen fines educativos; no diagnostican dolor ni reemplazan un fit profesional."
      : "These are estimated front-camera measurements for education; they do not diagnose pain or replace a professional fit.",
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

function calculateSideMetrics(
  samples: FrontKneeTrackingSample[],
  side: "left" | "right",
  estimatedMmPerPixel: number | null
): FrontKneeSideMetrics {
  const kneeKey = `${side}Knee` as const;
  const ankleKey = `${side}Ankle` as const;
  const usable = samples.filter((sample) => sample[kneeKey] && sample[kneeKey].confidence >= 0.3);
  const kneePoints = usable.map((sample) => sample[kneeKey]).filter(Boolean) as NonNullable<FrontKneeTrackingSample[typeof kneeKey]>[];
  const anklePoints = samples
    .map((sample) => sample[ankleKey])
    .filter((point): point is NonNullable<FrontKneeTrackingSample[typeof ankleKey]> => Boolean(point && point.confidence >= 0.25));
  const xValues = kneePoints.map((point) => point.x);
  const yValues = kneePoints.map((point) => point.y);
  const baselineX = anklePoints.length ? average(anklePoints.map((point) => point.x)) : average(xValues);
  const horizontalTravelPx = range(xValues);
  const verticalTravelPx = range(yValues);
  const kneeDriftPx = xValues.length ? Math.max(...xValues.map((x) => Math.abs(x - baselineX))) : 0;
  const horizontalTravelMm = toMm(horizontalTravelPx, estimatedMmPerPixel);
  const verticalTravelMm = toMm(verticalTravelPx, estimatedMmPerPixel);
  const kneeDriftMm = toMm(kneeDriftPx, estimatedMmPerPixel);
  const confidenceScore = kneePoints.length ? round(average(kneePoints.map((point) => point.confidence)), 2) : 0;
  const driftPenalty = kneeDriftMm ?? kneeDriftPx * 0.45;
  const horizontalPenalty = horizontalTravelMm ?? horizontalTravelPx * 0.28;
  const stabilityScore = Math.round(clamp(96 - driftPenalty * 0.7 - horizontalPenalty * 0.28, 35, 96));

  return {
    confidenceScore,
    horizontalTravelMm,
    horizontalTravelPx: Math.round(horizontalTravelPx),
    kneeDriftMm,
    kneeDriftPx: Math.round(kneeDriftPx),
    sampleCount: kneePoints.length,
    stabilityScore,
    verticalTravelMm,
    verticalTravelPx: Math.round(verticalTravelPx)
  };
}

function estimateMmPerPixel(samples: FrontKneeTrackingSample[], profile?: UserProfile | null): number | null {
  const heightCm = profile?.height_cm;
  const estimatedLegMm = heightCm ? heightCm * 10 * 0.47 : 820;
  const legLengths = samples.flatMap((sample) => {
    const lengths: number[] = [];

    if (sample.leftHip && sample.leftAnkle) {
      lengths.push(distance(sample.leftHip, sample.leftAnkle));
    }

    if (sample.rightHip && sample.rightAnkle) {
      lengths.push(distance(sample.rightHip, sample.rightAnkle));
    }

    return lengths.filter((length) => length > 120);
  });

  if (!legLengths.length) {
    return null;
  }

  return round(estimatedLegMm / median(legLengths), 3);
}

function calculateDurationMs(frames: PoseFrameResult[]) {
  const timestamps = frames.map((frame) => frame.frame?.timestampMs).filter((value): value is number => typeof value === "number");

  if (timestamps.length < 2) {
    return 0;
  }

  return Math.max(...timestamps) - Math.min(...timestamps);
}

function toTrackingPoint(keypoint?: PoseKeypoint) {
  if (!keypoint || keypoint.confidence < 0.2) {
    return undefined;
  }

  return {
    confidence: keypoint.confidence,
    x: keypoint.x,
    y: keypoint.y
  };
}

function findKeypoint(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  return keypoints.find((keypoint) => keypoint.name === name);
}

function range(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.max(...values) - Math.min(...values);
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2) {
    return sorted[middle] ?? 0;
  }

  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toMm(valuePx: number, estimatedMmPerPixel: number | null) {
  return estimatedMmPerPixel ? Math.round(valuePx * estimatedMmPerPixel) : null;
}

function round(value: number, precision: number) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}
