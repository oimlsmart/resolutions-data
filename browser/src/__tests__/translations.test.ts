import { describe, it, expect } from 'vitest'
import { translations, interpolate } from '../data/translations'

// ---------------------------------------------------------------------------
// translations completeness
// ---------------------------------------------------------------------------

describe('translations', () => {
  it('every key has both en and fr values', () => {
    const keys = Object.keys(translations)
    expect(keys.length).toBeGreaterThan(50)

    const missing: string[] = []
    for (const key of keys) {
      const entry = translations[key]
      if (!entry.en) missing.push(`${key}.en`)
      if (!entry.fr) missing.push(`${key}.fr`)
    }
    expect(missing).toEqual([])
  })

  it('committee.title has correct French name', () => {
    expect(translations['committee.title'].fr).toBe('Organisation Internationale de Métrologie Légale')
  })

  it('committee.placeholderCiml indicates inferred subject', () => {
    expect(translations['committee.placeholderCiml'].en).toContain('not explicit')
    expect(translations['committee.placeholderCiml'].fr).toContain('non explicite')
  })

  it('meetings.count template supports interpolation', () => {
    expect(translations['meetings.count'].en).toContain('{count}')
    expect(translations['meetings.count'].fr).toContain('{count}')
  })
})

// ---------------------------------------------------------------------------
// interpolate
// ---------------------------------------------------------------------------

describe('interpolate', () => {
  it('replaces {placeholder} with value', () => {
    expect(interpolate('{count} meetings', { count: 42 })).toBe('42 meetings')
    expect(interpolate('{count} réunions', { count: 7 })).toBe('7 réunions')
  })

  it('handles multiple placeholders', () => {
    expect(interpolate('{a} and {b}', { a: 'X', b: 'Y' })).toBe('X and Y')
  })

  it('replaces unreferenced placeholders with empty string', () => {
    // interpolate replaces ALL {placeholder} patterns; unreferenced ones
    // become empty strings (not left in place).
    expect(interpolate('{a} {b}', { a: 'X' })).toBe('X ')
  })

  it('handles numeric values', () => {
    expect(interpolate('{n} resolutions', { n: 2497 })).toBe('2497 resolutions')
  })

  it('handles strings without placeholders', () => {
    expect(interpolate('Hello world', {})).toBe('Hello world')
  })
})
