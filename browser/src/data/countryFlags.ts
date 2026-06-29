/**
 * Maps meeting venue strings to country flag emojis.
 *
 * Venue data is stored as "City, Country" (e.g. "Nagasaki, Japan").
 * The country is the last comma-separated segment. We resolve it to an
 * ISO 3166-1 alpha-2 code, then convert to a regional-indicator emoji.
 */

const COUNTRY_CODE_MAP: Record<string, string> = {
  'germany': 'DE',
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'china': 'CN',
  'france': 'FR',
  'korea': 'KR',
  'south korea': 'KR',
  'japan': 'JP',
  'italy': 'IT',
  'switzerland': 'CH',
  'australia': 'AU',
  'sweden': 'SE',
  'norway': 'NO',
  'canada': 'CA',
  'portugal': 'PT',
  'south africa': 'ZA',
  'spain': 'ES',
  'netherlands': 'NL',
  'the netherlands': 'NL',
}

function countryCodeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

/** Returns the ISO 3166-1 alpha-2 code for the venue's country, or '' if unknown. */
export function venueToCountryCode(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return ''

  const parts = venue.split(',')
  const countryName = parts[parts.length - 1].trim().toLowerCase()
  return COUNTRY_CODE_MAP[countryName] || ''
}

/** Returns the flag emoji for the venue's country, or '🌐' for virtual meetings. */
export function venueToFlag(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return '\u{1F310}'
  const code = venueToCountryCode(venue)
  return code ? countryCodeToEmoji(code) : ''
}
