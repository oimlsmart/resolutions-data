import { describe, it, expect } from 'vitest'
import { formatDate, formatDateShort } from '../utils/format'

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats ISO dates in English', () => {
    expect(formatDate('2024-10-18', 'en')).toBe('October 18, 2024')
    expect(formatDate('2003-11-05', 'en')).toBe('November 5, 2003')
  })

  it('formats ISO dates in French', () => {
    expect(formatDate('2024-10-18', 'fr')).toBe('18 octobre 2024')
    expect(formatDate('2003-11-05', 'fr')).toBe('5 novembre 2003')
  })

  it('defaults to English', () => {
    expect(formatDate('2024-10-18')).toBe('October 18, 2024')
  })

  it('returns empty for empty input', () => {
    expect(formatDate('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// formatDateShort
// ---------------------------------------------------------------------------

describe('formatDateShort', () => {
  it('formats compact dates in English', () => {
    expect(formatDateShort('2024-10-18', 'en')).toBe('Oct 18')
  })

  it('formats compact dates in French', () => {
    expect(formatDateShort('2024-10-18', 'fr')).toBe('18 oct.')
  })

  it('defaults to English', () => {
    expect(formatDateShort('2024-10-18')).toBe('Oct 18')
  })

  it('returns empty for empty input', () => {
    expect(formatDateShort('')).toBe('')
  })
})
