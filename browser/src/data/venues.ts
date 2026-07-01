// Bilingual venue rendering.
//
// Venues are stored as `city` + `country_code` (ISO 3166-1 alpha-2) in
// scripts/manifest.yaml; `city` is the IATA city code (BER, CPT, ...)
// and the localized name is read from cities.yaml keyed by code.
// Country names come from countries.yaml.

import { COUNTRIES } from './countries'
import citiesData from './cities.yaml'

type Lang = 'en' | 'fr'

const CITIES = (citiesData.cities || {}) as Record<string, { en: string; fr: string }>

export function countryName(code: string | null | undefined, lang: Lang): string {
  if (!code) return ''
  const entry = COUNTRIES[code.toUpperCase()]
  if (entry) return entry[lang] || entry.en || code
  return code
}

/** Localize an IATA city code. Falls back to the raw string when the
 *  code is unknown so legacy manifests with English city names keep
 *  working. */
export function cityName(code: string | null | undefined, lang: Lang): string {
  if (!code) return ''
  const entry = CITIES[code.toUpperCase()]
  if (entry) return entry[lang] || entry.en || code
  return code
}

const VIRTUAL_FR = 'Réunion en ligne'
const VIRTUAL_EN = 'Virtual Meeting'

/** Render a venue in the requested language.
 *
 *  Preferred form: pass an explicit city + country_code (ISO 3166-1
 *  alpha-2). The city is treated as an IATA city code; if unknown the
 *  raw string is used as-is.
 *   venueForLang('BER', 'DE', 'fr')  -> 'Berlin, Allemagne'
 *
 *  Legacy form: pass a single venue string ("City, Country") — the
 *  country name is looked up via COUNTRIES by trying to match the
 *  English name.
 */
export function venueForLang(
  cityOrVenue: string | null | undefined,
  langOrCode: Lang | string | undefined,
  lang?: Lang,
): string {
  if (!cityOrVenue) return ''

  // Preferred form: venueForLang(cityCode, countryCode, lang)
  if (lang) {
    const code = cityOrVenue
    const countryCode = langOrCode as string
    const city = cityName(code, lang)
    const country = countryName(countryCode, lang)
    return country ? `${city}, ${country}` : city
  }

  // Legacy form: venueForLang("City, Country", lang)
  const langArg = (langOrCode as Lang) || 'en'
  const lower = cityOrVenue.toLowerCase().trim()
  if (lower.includes('virtual') || lower.includes('online')) {
    return langArg === 'fr' ? VIRTUAL_FR : VIRTUAL_EN
  }
  const parts = cityOrVenue.split(',').map(s => s.trim())
  const rendered = parts.map((part) => {
    const entry = Object.entries(COUNTRIES).find(([, v]) => v.en.toLowerCase() === part.toLowerCase())
    if (entry) return entry[1][langArg] || entry[1].en
    return part
  })
  return rendered.join(', ')
}
