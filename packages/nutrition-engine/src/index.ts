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
