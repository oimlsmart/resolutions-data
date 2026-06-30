// Thin TypeScript wrapper around country-flags.yaml.
// Editing the country-name → code map: edit country-flags.yaml, not this file.

import data from './country-flags.yaml'

const COUNTRY_CODE_MAP: Record<string, string> = data.countryCodeMap || {}

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

export function venueToFlag(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return '🌐'
  const code = venueToCountryCode(venue)
  return code ? countryCodeToEmoji(code) : ''
}

export function countryCodeToFlag(code: string | undefined | null): string {
  if (!code) return ''
  return countryCodeToEmoji(code)
}
