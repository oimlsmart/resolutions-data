import { describe, it, expect } from 'vitest'
import {
  venueForLang,
  countryName,
  unlocodeToCity,
} from '../data/venues'

// ---------------------------------------------------------------------------
// venueForLang
// ---------------------------------------------------------------------------

describe('venueForLang', () => {
  it('renders city + country from UN/LOCODE + ISO code', () => {
    expect(venueForLang('FRPAR', 'FR', 'en')).toBe('Paris, France')
    expect(venueForLang('FRPAR', 'FR', 'fr')).toBe('Paris, France')
    expect(venueForLang('DEBER', 'DE', 'en')).toBe('Berlin, Germany')
    expect(venueForLang('DEBER', 'DE', 'fr')).toBe('Berlin, Allemagne')
  })

  it('translates city name to French when applicable', () => {
    expect(venueForLang('CNBJS', 'CN', 'en')).toBe('Beijing, China')
    expect(venueForLang('CNBJS', 'CN', 'fr')).toBe('Pékin, Chine')
  })

  it('handles unknown UN/LOCODE by passing through', () => {
    // ZZ is not a real ISO 3166-1 code, so countryName returns the code itself.
    expect(venueForLang('ZZXXX', 'ZZ', 'en')).toBe('ZZXXX, ZZ')
  })

  it('renders virtual meetings via legacy venue string', () => {
    // Virtual / online venue strings are only handled by the legacy form
    // (venueForLang(venueString, lang)). The preferred form
    // (venueForLang(city, countryCode, lang)) treats the city as a literal
    // string and does not check for "virtual".
    expect(venueForLang('virtual', 'en')).toBe('Virtual Meeting')
    expect(venueForLang('virtual', 'fr')).toBe('Réunion en ligne')
    expect(venueForLang('Online meeting', 'en')).toBe('Virtual Meeting')
    expect(venueForLang('Online meeting', 'fr')).toBe('Réunion en ligne')
  })

  it('renders legacy venue strings', () => {
    expect(venueForLang('Berlin, Germany', 'en')).toBe('Berlin, Germany')
    expect(venueForLang('Berlin, Germany', 'fr')).toBe('Berlin, Allemagne')
    expect(venueForLang('Paris, France', 'fr')).toBe('Paris, France')
  })

  it('returns empty for empty input', () => {
    expect(venueForLang('', 'en')).toBe('')
    expect(venueForLang(null, 'en')).toBe('')
    expect(venueForLang(undefined, 'en')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// countryName
// ---------------------------------------------------------------------------

describe('countryName', () => {
  it('renders localized country names', () => {
    expect(countryName('FR', 'en')).toBe('France')
    expect(countryName('FR', 'fr')).toBe('France')
    expect(countryName('DE', 'en')).toBe('Germany')
    expect(countryName('DE', 'fr')).toBe('Allemagne')
    expect(countryName('US', 'en')).toBe('United States')
    expect(countryName('US', 'fr')).toBe('États-Unis')
    expect(countryName('JP', 'en')).toBe('Japan')
    expect(countryName('JP', 'fr')).toBe('Japon')
  })

  it('handles case-insensitive input', () => {
    expect(countryName('fr', 'en')).toBe('France')
    expect(countryName('Fr', 'en')).toBe('France')
  })

  it('returns the code for unknown countries', () => {
    expect(countryName('XX', 'en')).toBe('XX')
  })

  it('returns empty for empty input', () => {
    expect(countryName('', 'en')).toBe('')
    expect(countryName(null, 'en')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// unlocodeToCity
// ---------------------------------------------------------------------------

describe('unlocodeToCity', () => {
  it('resolves known UN/LOCODEs', () => {
    expect(unlocodeToCity('FRPAR')).toBe('Paris')
    expect(unlocodeToCity('DEBER')).toBe('Berlin')
    expect(unlocodeToCity('JPUKH')).toBe('Kyoto')
    expect(unlocodeToCity('USWAS')).toBe('Washington')
    expect(unlocodeToCity('RUMOW')).toBe('Moscow')
  })

  it('is case-insensitive', () => {
    expect(unlocodeToCity('frpar')).toBe('Paris')
    expect(unlocodeToCity('FRpar')).toBe('Paris')
  })

  it('passes through unknown codes', () => {
    expect(unlocodeToCity('ZZXXX')).toBe('ZZXXX')
  })

  it('returns empty for empty input', () => {
    expect(unlocodeToCity('')).toBe('')
    expect(unlocodeToCity(null)).toBe('')
  })
})
