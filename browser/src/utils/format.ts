/**
 * Date formatting helpers shared across views.
 *
 * Dates arrive as ISO 8601 strings (e.g. "2024-10-18") from the Edoxen YAML.
 * All formatting uses UTC to avoid off-by-one shifts on the parsed date.
 *
 * Pass an explicit `lang` ('en' | 'fr') to localise the month name. The
 * default is English for backwards compatibility with call sites that
 * haven't been updated yet.
 */

const LOCALE_FOR_LANG: Record<'en' | 'fr', string> = {
  en: 'en-US',
  fr: 'fr-FR',
}

/** "October 18, 2024" / "18 octobre 2024" — full date for detail pages. */
export function formatDate(dateStr: string, lang: 'en' | 'fr' = 'en'): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(LOCALE_FOR_LANG[lang], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return dateStr
  }
}

/** "Oct 18" / "18 oct." — compact date for timeline rows. */
export function formatDateShort(dateStr: string, lang: 'en' | 'fr' = 'en'): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(LOCALE_FOR_LANG[lang], {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return dateStr
  }
}
