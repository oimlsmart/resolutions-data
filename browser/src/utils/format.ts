/**
 * Date formatting helpers shared across views.
 *
 * Dates arrive as ISO 8601 strings (e.g. "2024-10-18") from the Edoxen YAML.
 * All formatting uses UTC to avoid off-by-one shifts on the parsed date.
 */

/** "October 18, 2024" — full date for detail pages. */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}

/** "Oct 18" — compact date for timeline rows. */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}
