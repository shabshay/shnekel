export type Locale = 'en' | 'he'

export function isRTL(locale: Locale): boolean {
  return locale === 'he'
}

const LOCALE_KEY = 'shnekel_locale'

export function getSavedLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_KEY)
  if (saved === 'en' || saved === 'he') return saved
  // Auto-detect from browser
  const lang = navigator.language?.toLowerCase() || ''
  if (lang.startsWith('he')) return 'he'
  return 'en'
}

export function saveLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale)
}
