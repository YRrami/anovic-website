"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translations, LANGS, type Dict, type Lang } from "./translations";

type LanguageContextValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: Dict;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "anovic-lang";

function dirFor(lang: Lang): "ltr" | "rtl" {
  return LANGS.find((l) => l.code === lang)?.dir ?? "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from storage / browser preference on mount
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && translations[stored]) {
      setLangState(stored);
      return;
    }
    const browser = window.navigator.language.slice(0, 2).toLowerCase();
    if (browser === "ar" || browser === "es") {
      setLangState(browser as Lang);
    }
  }, []);

  // Keep <html lang> and <html dir> in sync with the active language
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dirFor(lang);
    root.setAttribute("data-lang", lang);
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage may be unavailable (private mode) — language still applies for the session
    }
  };

  const value: LanguageContextValue = {
    lang,
    dir: dirFor(lang),
    t: translations[lang],
    setLang,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
