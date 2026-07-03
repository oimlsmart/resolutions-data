// Bilingual venue rendering.
//
// Venues are stored as `city` + `country_code` (ISO 3166-1 alpha-2) in
// scripts/manifest.yaml. Country names come from countries.yaml. A small
// list of cities whose French name differs is in cities.yaml.
//
// `city` may be either a human-readable name ("Paris") or a UN/LOCODE
// ("FRPAR"). When it's a UN/LOCODE we resolve it via `unlocodeToCity`
// in cities.yaml before rendering.

import { COUNTRIES } from './countries'
import citiesData from './cities.yaml'

type Lang = 'en' | 'fr'

const CITY_FR: Record<string, string> = citiesData.citiesFr || {}
const UNLOCODE_TO_CITY: Record<string, string> = citiesData.unlocodeToCity || {}

export function countryName(code: string | null | undefined, lang: Lang): string {
  if (!code) return ''
  const entry = COUNTRIES[code.toUpperCase()]
  if (entry) return entry[lang] || entry.en || code
  return code
}

/** Resolve a UN/LOCODE ("FRPAR") to its English city name, or return
 *  the input unchanged when it isn't a known code. */
export function unlocodeToCity(code: string | null | undefined): string {
  if (!code) return ''
  // UN/LOCODE is 2 letters + 3 chars, all uppercase. Be forgiving about
  // case and trust the lookup table.
  return UNLOCODE_TO_CITY[code.toUpperCase()] || code
}

function isUnlocode(s: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{3}$/.test(s.toUpperCase())
}

const VIRTUAL_FR = 'Réunion en ligne'
const VIRTUAL_EN = 'Virtual Meeting'

function translateCity(city: string, lang: Lang): string {
  if (lang === 'fr') {
    const key = city.toLowerCase()
    if (CITY_FR[key]) return CITY_FR[key]
  }
  return city
}

/** Render a venue in the requested language.
 *
 * Preferred form: pass an explicit city + country_code (ISO 3166-1 alpha-2).
 *   venueForLang('Berlin', 'DE', 'fr')  -> 'Berlin, Allemagne'
 *
 * The city may be a UN/LOCODE ("FRPAR"); it will be resolved to its
 * English name first, then French-translated if applicable.
 *
 * Legacy form: pass a single venue string ("City, Country") — the country
 * name is looked up via COUNTRIES by trying to match the English name.
 */
export function venueForLang(
  cityOrVenue: string | null | undefined,
  langOrCode: Lang | string | undefined,
  lang?: Lang,
): string {
  if (!cityOrVenue) return ''

  // Preferred form: venueForLang(city, countryCode, lang)
  if (lang) {
    const code = langOrCode as string
    let city = cityOrVenue
    // Resolve UN/LOCODE before translating.
    if (isUnlocode(city)) city = unlocodeToCity(city)
    city = translateCity(city, lang)
    const country = countryName(code, lang)
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
    if (isUnlocode(part)) return translateCity(unlocodeToCity(part), langArg)
    const entry = Object.entries(COUNTRIES).find(([, v]) => v.en.toLowerCase() === part.toLowerCase())
    if (entry) return entry[1][langArg] || entry[1].en
    return translateCity(part, langArg)
  })
  return rendered.join(', ')
}
