"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Lang = "en" | "ko"

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  // Restore the visitor's saved language preference (a UI setting, not app data).
  useEffect(() => {
    const saved = window.localStorage.getItem("twk-lang")
    if (saved === "en" || saved === "ko") setLangState(saved)
  }, [])

  const setLang = (next: Lang) => {
    setLangState(next)
    window.localStorage.setItem("twk-lang", next)
    document.documentElement.lang = next
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLang must be used within a LanguageProvider")
  return ctx
}

/** Pick the value for the current language from an { en, ko } pair. */
export function pick<T>(lang: Lang, pair: { en: T; ko: T }): T {
  return pair[lang]
}
