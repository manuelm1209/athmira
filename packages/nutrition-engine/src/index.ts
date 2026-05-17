import type { BikeType, TirePressureInput, TirePressureRecommendation, TireSetup, TireSurface } from "@athmira/types";

export type FuelingPlanInput = {
  durationMinutes: number;
  intensity: "easy" | "moderate" | "hard";
};

export type FuelingPlan = {
  carbsPerHourGrams: number;
  hydrationPerHourMl: number;
  sodiumPerHourMg: number;
};

export function calculateFuelingPlan(input: FuelingPlanInput): FuelingPlan {
  const intensityMultiplier = input.intensity === "hard" ? 1.2 : input.intensity === "moderate" ? 1 : 0.8;

  return {
    carbsPerHourGrams: Math.round(55 * intensityMultiplier),
    hydrationPerHourMl: Math.round(600 * intensityMultiplier),
    sodiumPerHourMg: Math.round(500 * intensityMultiplier)
  };
}

type BikePressureProfile = {
  maxPsi: number;
  minPsi: number;
  referencePsi: number;
  referenceWidthMm: number;
  surfaceAdjustments: Record<TireSurface, { front: number; rear: number; note: string }>;
};

const pressureProfiles: Record<BikeType, BikePressureProfile> = {
  road: {
    maxPsi: 95,
    minPsi: 55,
    referencePsi: 78,
    referenceWidthMm: 28,
    surfaceAdjustments: createSurfaceAdjustments(-2, -4, -8, -10, -12)
  },
  triathlon: {
    maxPsi: 100,
    minPsi: 58,
    referencePsi: 82,
    referenceWidthMm: 28,
    surfaceAdjustments: createSurfaceAdjustments(-1, -3, -7, -9, -11)
  },
  gravel: {
    maxPsi: 55,
    minPsi: 24,
    referencePsi: 38,
    referenceWidthMm: 40,
    surfaceAdjustments: createSurfaceAdjustments(-1, -3, -5, -7, -9)
  },
  mountain: {
    maxPsi: 36,
    minPsi: 16,
    referencePsi: 25,
    referenceWidthMm: 58,
    surfaceAdjustments: createSurfaceAdjustments(0, -2, -3, -4, -6)
  },
  hybrid: {
    maxPsi: 65,
    minPsi: 32,
    referencePsi: 48,
    referenceWidthMm: 38,
    surfaceAdjustments: createSurfaceAdjustments(-1, -3, -5, -6, -8)
  }
};

export function calculateTirePressure(input: TirePressureInput): TirePressureRecommendation {
  const widthMm = normalizeTireWidthMm(input.tireWidth, input.tireWidthUnit);
  const profile = pressureProfiles[input.bikeType];
  const minPsi = getSetupMinPsi(profile.minPsi, input.bikeType, input.tireSetup);
  const riderWeightKg = clamp(input.riderWeightKg, 30, 250);
  const weightAdjustment = (riderWeightKg - 75) * 0.32;
  const widthAdjustment = (profile.referenceWidthMm - widthMm) * getWidthSensitivity(input.bikeType);
  const setupAdjustment = getSetupPressureAdjustment(input.bikeType, input.tireSetup);
  const baseRear = clamp(
    profile.referencePsi + weightAdjustment + widthAdjustment + setupAdjustment,
    minPsi,
    profile.maxPsi
  );
  const frontRearSplit = getFrontRearSplit(input.bikeType);
  const rearPsi = roundPressure(baseRear);
  const frontPsi = roundPressure(clamp(baseRear - frontRearSplit, minPsi, profile.maxPsi));

  return {
    frontPsi,
    rearPsi,
    maxPsi: profile.maxPsi,
    minPsi,
    normalizedTireWidthMm: round(widthMm, 1),
    surfaceRecommendations: buildSurfaceRecommendations(profile, frontPsi, rearPsi, minPsi)
  };
}

export function normalizeTireWidthMm(width: number, unit: "in" | "mm") {
  const normalized = unit === "in" ? width * 25.4 : width;
  return clamp(normalized, 18, 90);
}

function buildSurfaceRecommendations(
  profile: BikePressureProfile,
  frontPsi: number,
  rearPsi: number,
  minPsi: number
) {
  return (Object.entries(profile.surfaceAdjustments) as Array<
    [TireSurface, { front: number; rear: number; note: string }]
  >).map(([surface, adjustment]) => ({
    frontPsi: roundPressure(clamp(frontPsi + adjustment.front, minPsi, profile.maxPsi)),
    label: getSurfaceLabel(surface),
    note: adjustment.note,
    rearPsi: roundPressure(clamp(rearPsi + adjustment.rear, minPsi, profile.maxPsi)),
    surface
  }));
}

function createSurfaceAdjustments(smooth: number, rough: number, gravel: number, wet: number, loose: number) {
  return {
    smooth: {
      front: smooth,
      note: "Efficient paved surfaces with predictable grip.",
      rear: smooth
    },
    rough: {
      front: rough,
      note: "Slightly lower pressure improves comfort and tire contact on rough pavement.",
      rear: rough
    },
    gravel: {
      front: gravel,
      note: "Lower pressure improves vibration control and traction on firm gravel.",
      rear: gravel + 1
    },
    wet: {
      front: wet,
      note: "A modest drop can improve grip in wet conditions. Avoid going below tire/rim limits.",
      rear: wet + 1
    },
    loose: {
      front: loose,
      note: "Loose dirt or chunky gravel often benefits from lower pressure and smoother handling.",
      rear: loose + 2
    }
  } satisfies BikePressureProfile["surfaceAdjustments"];
}

function getWidthSensitivity(bikeType: BikeType) {
  switch (bikeType) {
    case "mountain":
      return 0.28;
    case "gravel":
      return 0.46;
    case "hybrid":
      return 0.52;
    case "road":
    case "triathlon":
    default:
      return 1.15;
  }
}

function getFrontRearSplit(bikeType: BikeType) {
  switch (bikeType) {
    case "mountain":
      return 2;
    case "gravel":
    case "hybrid":
      return 3;
    case "road":
    case "triathlon":
    default:
      return 4;
  }
}

function getSetupPressureAdjustment(bikeType: BikeType, tireSetup: TireSetup) {
  if (tireSetup === "inner_tube") {
    return 0;
  }

  switch (bikeType) {
    case "road":
    case "triathlon":
      return -5;
    case "gravel":
    case "hybrid":
      return -3;
    case "mountain":
    default:
      return -2;
  }
}

function getSetupMinPsi(profileMinPsi: number, bikeType: BikeType, tireSetup: TireSetup) {
  if (tireSetup === "tubeless") {
    return profileMinPsi;
  }

  switch (bikeType) {
    case "road":
    case "triathlon":
      return profileMinPsi + 5;
    case "gravel":
    case "hybrid":
      return profileMinPsi + 3;
    case "mountain":
    default:
      return profileMinPsi + 2;
  }
}

function getSurfaceLabel(surface: TireSurface) {
  switch (surface) {
    case "smooth":
      return "Smooth pavement";
    case "rough":
      return "Rough pavement";
    case "gravel":
      return "Firm gravel";
    case "wet":
      return "Wet roads";
    case "loose":
      return "Loose dirt/gravel";
    default:
      return surface;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundPressure(value: number) {
  return Math.round(value);
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
