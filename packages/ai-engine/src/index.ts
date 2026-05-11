import type { FitRecommendation, LanguageCode } from "@athmira/types";

export type CoachSummaryInput = {
  recommendations: FitRecommendation[];
  language?: LanguageCode;
};

export function createCoachSummary(input: CoachSummaryInput): string {
  const isSpanish = input.language === "es";
  const priorityCount = input.recommendations.filter((item) => item.priority !== "low").length;

  if (isSpanish) {
    return `Analisis preliminar listo. Revisa ${priorityCount} recomendaciones principales y confirma cualquier ajuste con salidas cortas.`;
  }

  return `Preliminary analysis ready. Review ${priorityCount} primary recommendations and validate any adjustment with short rides.`;
}
