import { describe, it, expect } from 'vitest'
import { buildResolutionUrn } from '../utils/urn'

// ---------------------------------------------------------------------------
// buildResolutionUrn
// ---------------------------------------------------------------------------

describe('buildResolutionUrn', () => {
  it('builds resolution URN from identifier', () => {
    expect(buildResolutionUrn('CIML-2024-1')).toBe('urn:oiml:resolution:CIML-2024-1')
    expect(buildResolutionUrn('Conference-2004-3.2')).toBe('urn:oiml:resolution:Conference-2004-3.2')
  })

  it('handles empty input', () => {
    expect(buildResolutionUrn('')).toBe('urn:oiml:resolution:')
  })
})
