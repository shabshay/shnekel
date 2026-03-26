import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Locale } from '../lib/i18n'
import { getSavedLocale, saveLocale, isRTL } from '../lib/i18n'
import en from '../locales/en.json'
import he from '../locales/he.json'

const translations: Record<Locale, typeof en> = { en, he }

interface LocaleContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isRTL: boolean
}

const LocaleContext = createContext<LocaleContextType | null>(null)

/**
 * Get a nested value from an object using a dot-separated path.
 * e.g. get(obj, "dashboard.settings") → obj.dashboard.settings
 */
function get(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getSavedLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    saveLocale(l)
  }, [])

  // Apply dir and lang to document
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL(locale) ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = get(translations[locale] as unknown as Record<string, unknown>, key)
      ?? get(translations.en as unknown as Record<string, unknown>, key)
      ?? key

    // Handle plural forms: "singular|plural" with {count}
    if (value.includes('|') && params?.count !== undefined) {
      const [singular, plural] = value.split('|')
      value = Number(params.count) === 1 ? singular : plural
    }

    // Replace {param} placeholders
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }

    return value
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isRTL: isRTL(locale) }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
