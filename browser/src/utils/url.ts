export function urlPrefix(
  basePath: string,
  localePrefix: string,
): string {
  return `${basePath}${localePrefix}/`.replace(/\/{2,}/g, '/')
}

export function localePrefixOf(
  locales: ReadonlyArray<{ code: string; routePrefix?: string }>,
  locale: string,
): string {
  const entry = locales.find((l) => l.code === locale)
  const rp = entry?.routePrefix ?? ''
  return rp ? `/${rp}` : ''
}

const LANG_ALIASES: Record<string, string[]> = {
  en: ['en', 'eng', 'en-US', 'en-US'],
  fr: ['fr', 'fra', 'fre', 'fr-FR', 'fr-CA'],
}

function normalizeLang(locale: string): string {
  return locale.toLowerCase().split('-')[0]
}

export function safePickLocalizedValue(
  list: unknown,
  locale: string,
  fallback = '',
): string {
  if (typeof list === 'string') return list
  if (!Array.isArray(list) || list.length === 0) return fallback
  const norm = normalizeLang(locale)
  const aliases = LANG_ALIASES[norm] ?? [norm]
  const entry = list.find((ls: any) => {
    const sp = normalizeLang(ls?.spelling ?? '')
    return aliases.includes(sp)
  })
  return entry?.value ?? list[0]?.value ?? fallback
}


