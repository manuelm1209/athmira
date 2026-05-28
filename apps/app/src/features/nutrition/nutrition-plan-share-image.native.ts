import type { NutritionPlanShareImagePayload, NutritionPlanShareImageResult } from "./nutrition-plan-share-image.types";

export async function generateNutritionPlanShareImage(payload: NutritionPlanShareImagePayload): Promise<NutritionPlanShareImageResult> {
  return {
    message: payload.copy.unsupported,
    status: "unsupported"
  };
}

export function downloadNutritionPlanShareImage(_dataUrl: string, _fileName: string) {
  return {
    message: "Image export is available on web.",
    status: "unsupported" as const
  };
}
