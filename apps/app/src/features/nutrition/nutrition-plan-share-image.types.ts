export type NutritionPlanShareImageMetric = {
  label: string;
  value: string;
  detail?: string;
};

export type NutritionPlanShareImageIngredient = {
  color: string;
  meta: string;
  name: string;
};

export type NutritionPlanShareImageBottle = {
  ingredients: NutritionPlanShareImageIngredient[];
  meta: string;
  name: string;
};

export type NutritionPlanShareImagePayload = {
  bottles: NutritionPlanShareImageBottle[];
  brand: string;
  carriedItems: NutritionPlanShareImageIngredient[];
  copy: {
    bottles: string;
    carried: string;
    disclaimer: string;
    domain: string;
    downloaded: string;
    empty: string;
    generated: string;
    goals: string;
    more: (count: number) => string;
    shared: string;
    strategy: string;
    unsupported: string;
  };
  fileName: string;
  metrics: NutritionPlanShareImageMetric[];
  meta: string;
  title: string;
};

export type NutritionPlanShareImageResult = {
  dataUrl?: string;
  fileName?: string;
  message: string;
  status: "generated" | "unsupported";
};
