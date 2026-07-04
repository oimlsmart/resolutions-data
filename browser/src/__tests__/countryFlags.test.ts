import { describe, it, expect } from 'vitest'
import { countryCodeToFlag } from '../data/countryFlags'

// ---------------------------------------------------------------------------
// countryCodeToFlag
// ---------------------------------------------------------------------------

describe('countryCodeToFlag', () => {
  it('renders flag emoji from ISO 3166-1 alpha-2 code', () => {
    expect(countryCodeToFlag('FR')).toBe('🇫🇷')
    expect(countryCodeToFlag('DE')).toBe('🇩🇪')
    expect(countryCodeToFlag('US')).toBe('🇺🇸')
    expect(countryCodeToFlag('JP')).toBe('🇯🇵')
    expect(countryCodeToFlag('CN')).toBe('🇨🇳')
    expect(countryCodeToFlag('AU')).toBe('🇦🇺')
  })

  it('normalises case', () => {
    expect(countryCodeToFlag('fr')).toBe('🇫🇷')
    expect(countryCodeToFlag('Fr')).toBe('🇫🇷')
  })

  it('returns empty for invalid input', () => {
    expect(countryCodeToFlag('')).toBe('')
    expect(countryCodeToFlag(null)).toBe('')
    expect(countryCodeToFlag(undefined)).toBe('')
    // 3-letter codes are not ISO 3166-1 alpha-2
    expect(countryCodeToFlag('FRA')).toBe('')
    expect(countryCodeToFlag('123')).toBe('')
    expect(countryCodeToFlag('F')).toBe('')
  })
})
