import { describe, it, expect } from 'vitest'
import {
  buildResolutionRecords,
  buildMeetingDoi,
  normalizeSnippet,
  isAcclamation,
  sortResolutions,
} from '../../scripts/lib/transforms.mjs'

// ---------------------------------------------------------------------------
// buildResolutionRecords
// ---------------------------------------------------------------------------

describe('buildResolutionRecords', () => {
  const baseMeta = {
    dates: [{ start: '2024-10-18', end: '2024-10-25', kind: 'meeting' }],
    venue: 'Paris, France',
    city: 'FRPAR',
    country_code: 'FR',
  }

  it('expands localizations into one record per language', () => {
    const res = {
      identifier: 'CIML/2024/1',
      doi: '10.63493/resolutions/ciml202401',
      urn: 'urn:oiml:doc:ciml:resolution:2024-01',
      dates: [{ start: '2024-10-18', kind: 'decision' }],
      localizations: [
        {
          language_code: 'eng',
          title: 'Approves the agenda',
          subject: 'CIML',
          actions: [{ type: 'approves', message: 'Approves the agenda.', dates: [{ start: '2024-10-18', kind: 'effective' }] }],
        },
        {
          language_code: 'fra',
          title: 'Approuve l\'ordre du jour',
          subject: 'CIML',
          actions: [{ type: 'approves', message: 'Approuve l\'ordre du jour.', dates: [{ start: '2024-10-18', kind: 'effective' }] }],
        },
      ],
    }
    const records = buildResolutionRecords(res, 'ciml-60-resolutions', {
      ...baseMeta,
      title_localized: [
        { language_code: 'eng', title: '60th CIML Meeting' },
        { language_code: 'fra', title: '60e réunion du CIML' },
      ],
    })

    expect(records).toHaveLength(2)

    // Shared fields
    for (const r of records) {
      expect(r.id).toBe('CIML-2024-1')
      expect(r.identifier).toBe('CIML/2024/1')
      expect(r.doi).toBe('10.63493/resolutions/ciml202401')
      expect(r.meeting_date).toBe('2024-10-18')
      expect(r.year).toBe('2024')
      expect(r.city).toBe('FRPAR')
      expect(r.country_code).toBe('FR')
      expect(r.is_acclamation).toBe(false)
    }

    // Per-language fields
    const en = records.find(r => r.language === 'en')
    const fr = records.find(r => r.language === 'fr')
    expect(en.title).toBe('Approves the agenda')
    expect(en.source_title).toBe('60th CIML Meeting')
    expect(en.actions[0].type).toBe('approves')
    expect(fr.title).toBe('Approuve l\'ordre du jour')
    expect(fr.source_title).toBe('60e réunion du CIML')
  })

  it('handles single-language localizations', () => {
    const res = {
      identifier: 'CIML/1976/1',
      localizations: [
        { language_code: 'fra', title: 'ADOPTION du COMPTE RENDU', actions: [] },
      ],
    }
    const records = buildResolutionRecords(res, '15CIML-1976-FR', baseMeta)
    expect(records).toHaveLength(1)
    expect(records[0].language).toBe('fr')
    expect(records[0].title).toBe('ADOPTION du COMPTE RENDU')
  })

  it('handles missing localizations gracefully', () => {
    const res = { identifier: 'CIML/2024/1', dates: [] }
    const records = buildResolutionRecords(res, 'test', baseMeta)
    expect(records).toHaveLength(1)
    expect(records[0].title).toBe('')
    expect(records[0].actions).toEqual([])
  })

  it('derives snippet from first action message and truncates long text', () => {
    const longMsg = 'A'.repeat(250)
    const res = {
      identifier: 'CIML/2024/1',
      localizations: [{
        language_code: 'eng',
        title: 'Test',
        actions: [{
          type: 'notes',
          message: longMsg,
          dates: [],
        }],
      }],
    }
    const records = buildResolutionRecords(res, 'test', baseMeta)
    expect(records[0].snippet.length).toBeLessThanOrEqual(200)
    expect(records[0].snippet.endsWith('...')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildMeetingDoi
// ---------------------------------------------------------------------------

describe('buildMeetingDoi', () => {
  it('derives CIML DOI from slug', () => {
    expect(buildMeetingDoi({}, 'ciml-44')).toBe('10.63493/meetings/ciml44')
    expect(buildMeetingDoi({}, 'ciml-15')).toBe('10.63493/meetings/ciml15')
  })

  it('derives Conference DOI from slug', () => {
    expect(buildMeetingDoi({}, 'conference-13')).toBe('10.63493/meetings/conf13')
    expect(buildMeetingDoi({}, 'conference-17')).toBe('10.63493/meetings/conf17')
  })

  it('returns empty for unrecognised slug', () => {
    expect(buildMeetingDoi({}, 'unknown')).toBe('')
    expect(buildMeetingDoi({}, '')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// normalizeSnippet
// ---------------------------------------------------------------------------

describe('normalizeSnippet', () => {
  it('replaces PUA bullet characters with Unicode equivalents', () => {
    expect(normalizeSnippet(' Item one')).toBe('• Item one')
    expect(normalizeSnippet(' Item two')).toBe('‣ Item two')
    expect(normalizeSnippet(' Item three')).toBe('▸ Item three')
  })

  it('collapses newlines into spaces', () => {
    expect(normalizeSnippet('Line one\nLine two\nLine three')).toBe('Line one Line two Line three')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeSnippet('too    many    spaces')).toBe('too many spaces')
  })

  it('truncates at 200 chars with ellipsis', () => {
    const long = 'x'.repeat(250)
    const result = normalizeSnippet(long)
    expect(result).toHaveLength(200)
    expect(result.endsWith('...')).toBe(true)
  })

  it('returns empty string for falsy input', () => {
    expect(normalizeSnippet('')).toBe('')
    expect(normalizeSnippet(null as any)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// isAcclamation
// ---------------------------------------------------------------------------

describe('isAcclamation', () => {
  it('detects acclamation identifiers', () => {
    expect(isAcclamation('CIML-acclaim-1')).toBe(true)
    expect(isAcclamation('Conference-acclaim-2024-1')).toBe(true)
  })

  it('returns false for normal identifiers', () => {
    expect(isAcclamation('CIML/2024/1')).toBe(false)
    expect(isAcclamation('Conference-2004-3.2')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// sortResolutions
// ---------------------------------------------------------------------------

describe('sortResolutions', () => {
  const mk = (id: string, date: string) => ({ id, identifier: id, meeting_date: date, is_acclamation: false } as any)

  it('sorts by date descending', () => {
    const a = mk('CIML-2024-1', '2024-10-18')
    const b = mk('CIML-2023-1', '2023-10-17')
    const sorted = [a, b].sort(sortResolutions)
    expect(sorted[0]).toBe(a) // 2024 before 2023
  })

  it('within same date, sorts by numeric id descending', () => {
    const a = mk('CIML-2024-1', '2024-10-18')
    const b = mk('CIML-2024-9', '2024-10-18')
    const sorted = [a, b].sort(sortResolutions)
    expect(sorted[0]).toBe(b) // 9 before 1
  })

  it('pushes acclamations to the end', () => {
    const a = mk('CIML-2024-1', '2024-10-18')
    const b = { ...mk('CIML-acclaim-1', '2024-10-18'), is_acclamation: true }
    const sorted = [b, a].sort(sortResolutions)
    expect(sorted[0]).toBe(a)
    expect(sorted[1]).toBe(b)
  })
})
