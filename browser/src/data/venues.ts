// Bilingual venue rendering.
//
// Venues are stored as `city` + `country_code` (ISO 3166-1 alpha-2) in
// scripts/manifest.yaml. The country name is rendered in the current UI
// language via countries.yaml.
//
// For legacy venues that are still single strings ("Berlin, Germany"),
// venueForLang() falls back to the COUNTRY_FR / CITY_FR maps below. New
// meetings should use the structured form.

import { COUNTRIES } from './countries'

type Lang = 'en' | 'fr'


export function countryName(code: string | null | undefined, lang: Lang): string {
  if (!code) return ''
  const entry = COUNTRIES[code.toUpperCase()]
  if (entry) return entry[lang] || entry.en || code
  return code
}

// A small map for the handful of cities whose names differ in FR.
const CITY_FR: Record<string, string> = {
  'vienna':       'Vienne',
  'cologne':      'Cologne',
  'köln':         'Cologne',
  'munich':       'Munich',
  'the hague':    'La Haye',
  'geneva':       'Genève',
  'turin':        'Turin',
  'florence':     'Florence',
  'cape town':    'Le Cap',
  'ho chi minh city': 'Hô Chi Minh-Ville',
  'beijing':      'Pékin',
  'cartagena de indias': 'Carthagène des Indes',
  'hamburg':      'Hambourg',
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
    const city = cityOrVenue
    const code = langOrCode as string
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
    // Try to match the part against a known EN country name → look up the code → translate.
    const entry = Object.entries(COUNTRIES).find(([, v]) => v.en.toLowerCase() === part.toLowerCase())
    if (entry) return entry[1][langArg] || entry[1].en
    return translateCity(part, langArg)
  })
  return rendered.join(', ')
}
