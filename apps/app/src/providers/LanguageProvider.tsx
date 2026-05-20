import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LanguageCode } from "@athmira/types";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { normalizeLanguage, translate, type TranslationKey } from "@/i18n";

import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "athmira.language";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const { profile, updateProfile, user } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>("es");

  useEffect(() => {
    let mounted = true;

    async function loadStoredLanguage() {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const deviceLanguage =
        typeof navigator !== "undefined" && "language" in navigator ? navigator.language : undefined;
      const nextLanguage = normalizeLanguage(stored ?? deviceLanguage ?? "es");

      if (mounted) {
        setLanguageState(nextLanguage);
      }
    }

    loadStoredLanguage();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (profile?.preferred_language) {
      setLanguageState(profile.preferred_language);
      AsyncStorage.setItem(STORAGE_KEY, profile.preferred_language);
    }
  }, [profile?.preferred_language]);

  const value = useMemo<LanguageContextValue>(() => {
    async function setLanguage(nextLanguage: LanguageCode) {
      setLanguageState(nextLanguage);
      await AsyncStorage.setItem(STORAGE_KEY, nextLanguage);

      if (user && profile?.preferred_language !== nextLanguage) {
        await updateProfile({ preferred_language: nextLanguage });
      }
    }

    return {
      language,
      setLanguage,
      t: (key) => translate(language, key)
    };
  }, [language, profile?.preferred_language, updateProfile, user]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
