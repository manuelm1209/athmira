import type {
  BikeType,
  NutritionActivityType,
  NutritionIntensity,
  NutritionPlanBottleInput,
  NutritionPlanItemInput,
  NutritionPlanItemLocation,
  NutritionProduct,
  TirePressureInput,
  TirePressureRecommendation,
  TireSetup,
  TireSurface
} from "@athmira/types";

export type FuelingPlanInput = {
  durationMinutes: number;
  intensity: "easy" | "moderate" | "hard";
};

export type FuelingPlan = {
  carbsPerHourGrams: number;
  hydrationPerHourMl: number;
  sodiumPerHourMg: number;
};

export type NutritionTargetInput = {
  activityType: NutritionActivityType;
  bodyWeightKg?: number | null;
  durationMinutes: number;
  intensity: NutritionIntensity;
};

export type NutritionTargets = {
  carbsPerHour: number;
  caloriesBurned: number | null;
  fluidsMlPerHour: number;
  sodiumMgPerHour: number;
  advisory: string;
};

export type NutritionCalculatedItem = NutritionPlanItemInput & {
  calculated_carbs: number;
  calculated_calories: number;
  calculated_sodium_mg: number;
  calculated_volume_ml: number;
  serving_multiplier: number;
};

export type BottleCalculation = {
  bottle: NutritionPlanBottleInput;
  carbsPerLiter: number;
  concentration: BottleConcentration;
  overfilled: boolean;
  remainingWaterMl: number;
  totalCalories: number;
  totalCarbs: number;
  totalSodiumMg: number;
  totalUsedVolumeMl: number;
};

export type PlanTotals = {
  caloriesPerHour: number;
  carbsPerHour: number;
  fluidsMlPerHour: number;
  sodiumMgPerHour: number;
  totalCalories: number;
  totalCarbs: number;
  totalFluidsMl: number;
  totalSodiumMg: number;
};

export type NutritionWarning = {
  level: "info" | "warning" | "danger";
  message: string;
};

export type BottleConcentration = "easy" | "moderate" | "high" | "very_high";

export function calculateFuelingPlan(input: FuelingPlanInput): FuelingPlan {
  const intensityMultiplier = input.intensity === "hard" ? 1.2 : input.intensity === "moderate" ? 1 : 0.8;

  return {
    carbsPerHourGrams: Math.round(55 * intensityMultiplier),
    hydrationPerHourMl: Math.round(600 * intensityMultiplier),
    sodiumPerHourMg: Math.round(500 * intensityMultiplier)
  };
}

export function calculateSuggestedNutritionTargets(input: NutritionTargetInput): NutritionTargets {
  const durationHours = getDurationHours(input.durationMinutes);
  const carbsPerHour = getTargetCarbsPerHour(durationHours, input.intensity);
  const fluidsMlPerHour = getTargetFluidsMlPerHour(input.intensity);
  const sodiumMgPerHour = getTargetSodiumMgPerHour(input.intensity);
  const caloriesBurned = input.bodyWeightKg
    ? Math.round(getActivityMet(input.activityType, input.intensity) * 3.5 * input.bodyWeightKg * input.durationMinutes / 200)
    : null;

  return {
    advisory:
      input.intensity === "race_effort" || input.durationMinutes >= 240
        ? "High carbohydrate targets should be practiced gradually in training before race day."
        : "athmira estimates sports fueling needs for planning. This is not medical or dietary advice.",
    caloriesBurned,
    carbsPerHour,
    fluidsMlPerHour,
    sodiumMgPerHour
  };
}

export function calculateNutritionItem(
  product: NutritionProduct,
  input: Omit<NutritionPlanItemInput, "calculated_calories" | "calculated_carbs" | "calculated_sodium_mg" | "calculated_volume_ml">
): NutritionCalculatedItem {
  const servingMultiplier = getServingMultiplier(product, input.quantity, input.serving_multiplier);

  return {
    ...input,
    calculated_calories: round(product.calories_per_serving * servingMultiplier, 1),
    calculated_carbs: round(product.carbs_per_serving * servingMultiplier, 1),
    calculated_sodium_mg: round(product.sodium_mg_per_serving * servingMultiplier, 0),
    calculated_volume_ml: round(getProductVolumeContribution(product, input.quantity, servingMultiplier, input.location), 1),
    serving_multiplier: servingMultiplier
  };
}

export function calculateBottleTotals(
  bottle: NutritionPlanBottleInput,
  items: Array<NutritionCalculatedItem | NutritionPlanItemInput>
): BottleCalculation {
  const bottleItems = items.filter((item) => item.location === "bottle" && item.bottle_id === bottle.id);
  const totalCarbs = sumBy(bottleItems, "calculated_carbs");
  const totalCalories = sumBy(bottleItems, "calculated_calories");
  const totalSodiumMg = sumBy(bottleItems, "calculated_sodium_mg");
  const totalUsedVolumeMl = sumBy(bottleItems, "calculated_volume_ml");
  const remainingWaterMl = Math.max(0, bottle.bottle_size_ml - totalUsedVolumeMl);
  const carbsPerLiter = bottle.bottle_size_ml > 0 ? totalCarbs / (bottle.bottle_size_ml / 1000) : 0;

  return {
    bottle,
    carbsPerLiter: round(carbsPerLiter, 1),
    concentration: getBottleConcentration(carbsPerLiter),
    overfilled: totalUsedVolumeMl > bottle.bottle_size_ml,
    remainingWaterMl: round(remainingWaterMl, 1),
    totalCalories: round(totalCalories, 1),
    totalCarbs: round(totalCarbs, 1),
    totalSodiumMg: round(totalSodiumMg, 0),
    totalUsedVolumeMl: round(totalUsedVolumeMl, 1)
  };
}

export function calculatePlanTotals(input: {
  bottles: NutritionPlanBottleInput[];
  durationMinutes: number;
  items: Array<NutritionCalculatedItem | NutritionPlanItemInput>;
}): PlanTotals {
  const durationHours = getDurationHours(input.durationMinutes);
  const itemCarbs = sumBy(input.items, "calculated_carbs");
  const itemCalories = sumBy(input.items, "calculated_calories");
  const itemSodium = sumBy(input.items, "calculated_sodium_mg");
  const bottleFluidMl = input.bottles.reduce((total, bottle) => total + Math.max(0, bottle.bottle_size_ml), 0);
  const separateDrinkFluidMl = input.items.reduce((total, item) => {
    if (item.location === "bottle") {
      return total;
    }

    return total + Math.max(0, item.calculated_volume_ml ?? 0);
  }, 0);
  const totalFluidsMl = bottleFluidMl + separateDrinkFluidMl;

  return {
    caloriesPerHour: round(itemCalories / durationHours, 1),
    carbsPerHour: round(itemCarbs / durationHours, 1),
    fluidsMlPerHour: round(totalFluidsMl / durationHours, 1),
    sodiumMgPerHour: round(itemSodium / durationHours, 0),
    totalCalories: round(itemCalories, 1),
    totalCarbs: round(itemCarbs, 1),
    totalFluidsMl: round(totalFluidsMl, 1),
    totalSodiumMg: round(itemSodium, 0)
  };
}

export function getNutritionWarnings(input: {
  bottles: BottleCalculation[];
  targets: {
    carbsPerHour?: number | null;
    fluidsMlPerHour?: number | null;
    sodiumMgPerHour?: number | null;
  };
  totals: PlanTotals;
}): NutritionWarning[] {
  const warnings: NutritionWarning[] = [];
  const targetCarbs = input.targets.carbsPerHour ?? 0;
  const targetFluids = input.targets.fluidsMlPerHour ?? 0;
  const targetSodium = input.targets.sodiumMgPerHour ?? 0;

  if (targetCarbs > 0 && input.totals.carbsPerHour < targetCarbs * 0.75) {
    warnings.push({ level: "warning", message: "Carbs per hour are well below the target for this session." });
  }

  if (targetCarbs > 0 && input.totals.carbsPerHour > targetCarbs * 1.25) {
    warnings.push({ level: "warning", message: "Carbs per hour are above target. Make sure this amount is trained gradually." });
  }

  if (targetFluids > 0 && input.totals.fluidsMlPerHour < targetFluids * 0.75) {
    warnings.push({ level: "warning", message: "Hydration is below the current target for the planned duration." });
  }

  if (targetSodium > 0 && input.totals.sodiumMgPerHour < targetSodium * 0.65) {
    warnings.push({ level: "info", message: "Sodium is lower than the target. Adjust for sweat rate, heat, and tolerance." });
  }

  input.bottles.forEach((bottle) => {
    const name = bottle.bottle.name || "Bottle";

    if (bottle.overfilled) {
      warnings.push({ level: "danger", message: `${name} is overfilled. Reduce ingredients or use a larger bottle.` });
    } else if (bottle.concentration === "very_high") {
      warnings.push({ level: "warning", message: `${name} is above 90 g/L. This can increase stomach discomfort risk.` });
    } else if (bottle.concentration === "high") {
      warnings.push({ level: "info", message: `${name} has a high carbohydrate concentration. Test it in training first.` });
    }
  });

  if (!warnings.length) {
    warnings.push({
      level: "info",
      message: "This is an estimated sports fueling plan for training guidance, not medical advice."
    });
  }

  return warnings;
}

export function getBottleConcentration(carbsPerLiter: number): BottleConcentration {
  if (carbsPerLiter > 90) {
    return "very_high";
  }

  if (carbsPerLiter > 70) {
    return "high";
  }

  if (carbsPerLiter >= 40) {
    return "moderate";
  }

  return "easy";
}

export function getDurationHours(durationMinutes: number) {
  return Math.max(durationMinutes, 1) / 60;
}

export function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

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

function getTargetCarbsPerHour(durationHours: number, intensity: NutritionIntensity) {
  if (durationHours < 1) {
    return intensity === "race_effort" ? 30 : 20;
  }

  if (durationHours <= 2) {
    return intensity === "easy" ? 30 : intensity === "moderate" ? 40 : 45;
  }

  if (durationHours <= 3) {
    return intensity === "easy" ? 45 : intensity === "moderate" ? 55 : 60;
  }

  if (intensity === "race_effort" || intensity === "hard") {
    return 90;
  }

  return intensity === "moderate" ? 75 : 60;
}

function getTargetFluidsMlPerHour(intensity: NutritionIntensity) {
  switch (intensity) {
    case "easy":
      return 450;
    case "moderate":
      return 650;
    case "hard":
    case "race_effort":
    default:
      return 875;
  }
}

function getTargetSodiumMgPerHour(intensity: NutritionIntensity) {
  switch (intensity) {
    case "easy":
      return 400;
    case "moderate":
      return 600;
    case "hard":
    case "race_effort":
    default:
      return 850;
  }
}

function getActivityMet(activityType: NutritionActivityType, intensity: NutritionIntensity) {
  const byIntensity = getIntensityMetScale(intensity);

  switch (activityType) {
    case "running":
      return byIntensity.running;
    case "triathlon":
      return byIntensity.triathlon;
    case "gravel":
    case "mountain_biking":
      return byIntensity.offRoadCycling;
    case "indoor_cycling":
      return byIntensity.indoorCycling;
    case "hiking":
      return byIntensity.hiking;
    case "cycling":
      return byIntensity.cycling;
    case "other":
    default:
      return byIntensity.other;
  }
}

function getIntensityMetScale(intensity: NutritionIntensity) {
  switch (intensity) {
    case "easy":
      return {
        cycling: 6.8,
        hiking: 5.3,
        indoorCycling: 6.4,
        offRoadCycling: 7.2,
        other: 6,
        running: 8.3,
        triathlon: 7.5
      };
    case "moderate":
      return {
        cycling: 8.5,
        hiking: 6.5,
        indoorCycling: 8,
        offRoadCycling: 9,
        other: 7.5,
        running: 10.5,
        triathlon: 9.5
      };
    case "hard":
      return {
        cycling: 11,
        hiking: 8,
        indoorCycling: 10.5,
        offRoadCycling: 11.5,
        other: 9.5,
        running: 13,
        triathlon: 12
      };
    case "race_effort":
    default:
      return {
        cycling: 12.5,
        hiking: 9,
        indoorCycling: 12,
        offRoadCycling: 13,
        other: 11,
        running: 15,
        triathlon: 13.5
      };
  }
}

function getServingMultiplier(product: NutritionProduct, quantity: number, explicitMultiplier?: number) {
  if (explicitMultiplier && explicitMultiplier > 0) {
    return explicitMultiplier;
  }

  const servingSize = product.default_serving_size && product.default_serving_size > 0 ? product.default_serving_size : 1;
  return Math.max(0, quantity) / servingSize;
}

function getProductVolumeContribution(
  product: NutritionProduct,
  quantity: number,
  servingMultiplier: number,
  location: NutritionPlanItemLocation
) {
  if (product.liquid_volume_ml_per_serving > 0) {
    return product.liquid_volume_ml_per_serving * servingMultiplier;
  }

  if (location !== "bottle") {
    return 0;
  }

  if (product.weight_g_per_serving > 0) {
    return product.weight_g_per_serving * servingMultiplier;
  }

  if (product.category === "powder" || product.category === "bottle_ingredient") {
    return quantity;
  }

  return 0;
}

function sumBy(items: Array<NutritionCalculatedItem | NutritionPlanItemInput>, key: keyof NutritionCalculatedItem) {
  return items.reduce((total, item) => {
    const value = item[key];
    return typeof value === "number" ? total + value : total;
  }, 0);
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
  if (tireSetup === "standard_tube") {
    return 0;
  }

  if (tireSetup === "tpu_tube") {
    switch (bikeType) {
      case "road":
      case "triathlon":
        return -2;
      case "gravel":
      case "hybrid":
        return -1;
      case "mountain":
      default:
        return -1;
    }
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

  if (tireSetup === "tpu_tube") {
    switch (bikeType) {
      case "road":
      case "triathlon":
        return profileMinPsi + 3;
      case "gravel":
      case "hybrid":
        return profileMinPsi + 2;
      case "mountain":
      default:
        return profileMinPsi + 1;
    }
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
