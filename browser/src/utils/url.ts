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

export function safePickLocalizedValue(
  list: unknown,
  locale: string,
  fallback = '',
): string {
  if (typeof list === 'string') return list
  if (!Array.isArray(list) || list.length === 0) return fallback
  const norm = locale.toLowerCase()
  const entry = list.find((ls: any) => {
    const sp = (ls?.spelling ?? '').toLowerCase()
    return sp === norm || sp === norm || sp.startsWith(`${norm}-`)
  })
  return entry?.value ?? list[0]?.value ?? fallback
}
