import type { LanguageCode } from "@athmira/types";

import { translations, type TranslationKey } from "./translations";

export function translate(language: LanguageCode, key: TranslationKey): string {
  return translations[language][key] ?? translations.en[key];
}

export function normalizeLanguage(value?: string | null): LanguageCode {
  if (!value) {
    return "en";
  }

  return value.toLowerCase().startsWith("es") ? "es" : "en";
}

export type { TranslationKey };
