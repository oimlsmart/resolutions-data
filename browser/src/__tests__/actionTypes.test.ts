import { describe, it, expect } from 'vitest'
import { formatActionType, getActionColor } from '../data/actionTypes'

// ---------------------------------------------------------------------------
// formatActionType
// ---------------------------------------------------------------------------

describe('formatActionType', () => {
  it('renders English labels for known types', () => {
    expect(formatActionType('approves', 'en')).toBe('Approves')
    expect(formatActionType('noting', 'en')).toBe('Noting')
    expect(formatActionType('having_regard_to', 'en')).toBe('Having regard to')
    expect(formatActionType('following_recommendation', 'en')).toBe('Following the recommendation of')
  })

  it('renders French labels for known types', () => {
    expect(formatActionType('approves', 'fr')).toBe('Approuve')
    expect(formatActionType('noting', 'fr')).toBe('Notant')
    expect(formatActionType('having_regard_to', 'fr')).toBe('Vu')
    expect(formatActionType('following_recommendation', 'fr')).toBe('Suivant la recommandation de')
  })

  it('defaults to English', () => {
    expect(formatActionType('approves')).toBe('Approves')
    expect(formatActionType('decides')).toBe('Decides')
  })

  it('falls back to Title-Case for unknown types', () => {
    expect(formatActionType('some_new_type', 'en')).toBe('Some New Type')
    expect(formatActionType('custom_action', 'fr')).toBe('Custom Action')
  })

  it('returns empty for falsy input', () => {
    expect(formatActionType('')).toBe('')
    expect(formatActionType(null)).toBe('')
    expect(formatActionType(undefined)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// getActionColor
// ---------------------------------------------------------------------------

describe('getActionColor', () => {
  it('returns color for known action type', () => {
    const color = getActionColor('approves')
    expect(color).toHaveProperty('bg')
    expect(color).toHaveProperty('text')
    expect(color.bg).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('is case-insensitive', () => {
    const lower = getActionColor('approves')
    const upper = getActionColor('APPROVES')
    expect(lower).toEqual(upper)
  })

  it('returns default color for unknown type', () => {
    const color = getActionColor('totally_unknown_type')
    expect(color).toHaveProperty('bg')
    // The default color should be defined in action-types.yaml
    expect(color.bg).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
