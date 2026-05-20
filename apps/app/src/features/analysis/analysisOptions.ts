import type { BikeFitDiscipline, BikeFitGoal, BikeFitPainArea, BikeType, LanguageCode } from "@athmira/types";

export const bikeFitGoals: BikeFitGoal[] = ["comfort", "balanced", "aggressive", "competition"];

export const bikeFitDisciplines: BikeFitDiscipline[] = [
  "road_endurance",
  "road_race",
  "gravel_adventure",
  "gravel_race",
  "triathlon",
  "mtb_xc",
  "mtb_trail_enduro",
  "hybrid"
];

export const bikeFitPainAreas: BikeFitPainArea[] = [
  "none",
  "front_knee",
  "inner_knee",
  "outer_knee",
  "lower_back",
  "neck_shoulders",
  "hands"
];

export function getGoalLabel(goal: BikeFitGoal, language: LanguageCode) {
  const labels: Record<BikeFitGoal, { en: string; es: string }> = {
    aggressive: { en: "Aggressive / aero", es: "Agresivo / aero" },
    balanced: { en: "Balanced", es: "Balanceado" },
    comfort: { en: "Comfort", es: "Comodidad" },
    competition: { en: "Competition", es: "Competencia" }
  };

  return labels[goal][language];
}

export function getDisciplineLabel(discipline: BikeFitDiscipline, language: LanguageCode) {
  const labels: Record<BikeFitDiscipline, { en: string; es: string }> = {
    gravel_adventure: { en: "Gravel adventure", es: "Gravel adventure" },
    gravel_race: { en: "Gravel race", es: "Gravel race" },
    hybrid: { en: "Hybrid / urban", es: "Hibrida / urbana" },
    mtb_trail_enduro: { en: "MTB trail / enduro", es: "MTB trail / enduro" },
    mtb_xc: { en: "MTB XC", es: "MTB XC" },
    road_endurance: { en: "Road endurance", es: "Ruta endurance" },
    road_race: { en: "Road race", es: "Ruta race" },
    triathlon: { en: "Triathlon / TT", es: "Triatlon / TT" }
  };

  return labels[discipline][language];
}

export function getPainAreaLabel(painArea: BikeFitPainArea, language: LanguageCode) {
  const labels: Record<BikeFitPainArea, { en: string; es: string }> = {
    front_knee: { en: "Front knee", es: "Rodilla frontal" },
    hands: { en: "Hands", es: "Manos" },
    inner_knee: { en: "Inner knee", es: "Rodilla interna" },
    lower_back: { en: "Lower back", es: "Espalda baja" },
    neck_shoulders: { en: "Neck / shoulders", es: "Cuello / hombros" },
    none: { en: "No pain", es: "Sin dolor" },
    outer_knee: { en: "Outer knee", es: "Rodilla externa" }
  };

  return labels[painArea][language];
}

export function parseBikeFitGoal(value?: string | string[] | null): BikeFitGoal {
  const candidate = Array.isArray(value) ? value[0] : value;
  return bikeFitGoals.includes(candidate as BikeFitGoal) ? (candidate as BikeFitGoal) : "balanced";
}

export function parseBikeFitDiscipline(value?: string | string[] | null, bikeType?: BikeType): BikeFitDiscipline {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (bikeFitDisciplines.includes(candidate as BikeFitDiscipline)) {
    return candidate as BikeFitDiscipline;
  }

  return getDefaultDiscipline(bikeType);
}

export function parseBikeFitPainAreas(value?: string | string[] | null): BikeFitPainArea[] {
  const raw = Array.isArray(value) ? value.join(",") : value;
  const areas = raw
    ?.split(",")
    .map((area) => area.trim())
    .filter((area): area is BikeFitPainArea => bikeFitPainAreas.includes(area as BikeFitPainArea));

  return areas?.length ? areas : ["none"];
}

export function serializePainAreas(areas: BikeFitPainArea[]) {
  return areas.join(",");
}

export function togglePainArea(current: BikeFitPainArea[], next: BikeFitPainArea): BikeFitPainArea[] {
  if (next === "none") {
    return ["none"];
  }

  const withoutNone = current.filter((area) => area !== "none");
  const exists = withoutNone.includes(next);
  const updated = exists ? withoutNone.filter((area) => area !== next) : [...withoutNone, next];

  return updated.length ? updated : ["none"];
}

export function getDefaultDiscipline(bikeType?: BikeType | null): BikeFitDiscipline {
  switch (bikeType) {
    case "gravel":
      return "gravel_adventure";
    case "hybrid":
      return "hybrid";
    case "mountain":
      return "mtb_trail_enduro";
    case "triathlon":
      return "triathlon";
    case "road":
    default:
      return "road_endurance";
  }
}
