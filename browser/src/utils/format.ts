/**
 * Date formatting helpers shared across views.
 *
 * Dates arrive as ISO 8601 strings (e.g. "2024-10-18") from the Edoxen YAML.
 * All formatting uses UTC to avoid off-by-one shifts on the parsed date.
 *
 * Every helper takes the current UI language as a second argument so that
 * `formatDate('2024-10-18', 'fr')` returns "18 octobre 2024" while the EN
 * call returns "October 18, 2024". Internally `Intl.DateTimeFormat`
 * dispatches to the appropriate BCP-47 locale.
 */

const LOCALE: Record<'en' | 'fr', string> = { en: 'en-US', fr: 'fr-FR' }
const DEFAULT_LANG: 'en' | 'fr' = 'en'

type Lang = 'en' | 'fr'

function lc(lang: Lang | string | null | undefined): string {
  return LOCALE[(lang as Lang)] || LOCALE[DEFAULT_LANG]
}

/** "October 18, 2024" / "18 octobre 2024" — full date for detail pages. */
export function formatDate(dateStr: string, lang: Lang | string = DEFAULT_LANG): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat(lc(lang), {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/** "Oct 18" / "18 oct." — compact date for timeline rows. */
export function formatDateShort(dateStr: string, lang: Lang | string = DEFAULT_LANG): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat(lc(lang), {
      month: 'short', day: 'numeric', timeZone: 'UTC',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/** "Oct 2024" / "oct. 2024" — month + year only. */
export function formatMonthYear(dateStr: string, lang: Lang | string = DEFAULT_LANG): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat(lc(lang), {
      month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

/**
 * Render a date range. The four output shapes are:
 *   start == end          -> "October 18, 2024"          (full single date)
 *   same month, same year -> "October 18–22, 2024"       (compact range)
 *   same year, multi-month-> "October 28 – November 2, 2024"
 *   different years       -> "December 28, 2023 – January 3, 2024"
 *
 * `end` is optional: only the start date is rendered when no end is
 * provided (handled by formatDate()).
 */
export function formatDateRange(
  start: string,
  end: string | undefined | null,
  lang: Lang | string = DEFAULT_LANG,
): string {
  if (!start) return ''
  if (!end || end === start) return formatDate(start, lang)

  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return formatDate(start, lang)

  const sameYear = s.getUTCFullYear() === e.getUTCFullYear()
  const sameMonth = sameYear && s.getUTCMonth() === e.getUTCMonth()

  if (sameMonth) {
    // Same month/year: "October 18–22, 2024"
    const dayRange = `${s.getUTCDate()}–${e.getUTCDate()}`
    const monthYear = new Intl.DateTimeFormat(lc(lang), {
      month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(s)
    return `${monthYear.replace(/\d{4}/, `${dayRange}, ${s.getUTCFullYear()}`)}`
  }
  if (sameYear) {
    const monthDay = (d: Date) =>
      new Intl.DateTimeFormat(lc(lang), { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d)
    return `${monthDay(s)} – ${monthDay(e)}, ${s.getUTCFullYear()}`
  }
  return `${formatDate(start, lang)} – ${formatDate(end, lang)}`
}
