import { describe, it, expect } from 'vitest'
import {
  buildResolutionRecords,
  buildMeetingDoi,
} from '../../scripts/lib/transforms.mjs'

// ---------------------------------------------------------------------------
// Build-data pipeline integration tests
// ---------------------------------------------------------------------------

// These tests verify the full resolution-record expansion + meeting DOI
// derivation flow that build-data.mjs uses. They don't need filesystem
// access — just the transforms library functions.

describe('build-data pipeline', () => {
  it('produces correct meeting_slug linking', () => {
    const res = {
      identifier: 'CIML/2024/1',
      localizations: [{
        language_code: 'eng',
        title: 'Test',
        actions: [{ type: 'notes', message: 'Body', dates: [] }],
      }],
    }
    const meta = {
      dates: [{ start: '2024-10-18', kind: 'meeting' }],
      venue: 'Paris, France',
      city: 'FRPAR',
      country_code: 'FR',
    }

    const records = buildResolutionRecords(res, 'ciml-60-resolutions', meta)

    // In the real pipeline, build-data.mjs sets meeting_slug and
    // meeting_urn on each record. Here we just verify the base fields
    // are present and correct.
    expect(records).toHaveLength(1)
    expect(records[0].source_file).toBe('ciml-60-resolutions')
    expect(records[0].year).toBe('2024')
    expect(records[0].city).toBe('FRPAR')
  })

  it('derives meeting DOI from the canonical slug', () => {
    // The pipeline builds DOIs from the meeting_slug, not the source_file.
    // For ciml-60 the DOI should be 10.63493/meetings/ciml60.
    expect(buildMeetingDoi({}, 'ciml-60')).toBe('10.63493/meetings/ciml60')
    expect(buildMeetingDoi({}, 'conference-17')).toBe('10.63493/meetings/conf17')
  })

  it('expands bilingual localizations into paired records', () => {
    const res = {
      identifier: 'CIML/2009/9',
      doi: '10.63493/resolutions/ciml200909',
      urn: 'urn:oiml:doc:ciml:resolution:2009-09',
      dates: [{ start: '2009-10-27', kind: 'decision' }],
      localizations: [
        {
          language_code: 'eng',
          title: 'The Committee took note...',
          subject: 'CIML',
          actions: [{ type: 'notes', message: 'The Committee took note.', dates: [] }],
        },
        {
          language_code: 'fra',
          title: 'Le Comité a pris note...',
          subject: 'CIML',
          actions: [{ type: 'notes', message: 'Le Comité a pris note.', dates: [] }],
        },
      ],
    }
    const meta = {
      dates: [{ start: '2009-10-27', end: '2009-10-30', kind: 'meeting' }],
      venue: 'Mombasa, Kenya',
      city: 'KEMBA',
      country_code: 'KE',
      title_localized: [
        { language_code: 'eng', title: '44th CIML Meeting' },
        { language_code: 'fra', title: '44e réunion du CIML' },
      ],
    }

    const records = buildResolutionRecords(res, 'ciml-44-resolutions', meta)

    expect(records).toHaveLength(2)

    const en = records.find(r => r.language === 'en')
    const fr = records.find(r => r.language === 'fr')

    // Both share the same id (for language-toggle pairing)
    expect(en.id).toBe(fr.id)
    expect(en.id).toBe('CIML-2009-9')

    // Each has its own language-specific title and source_title
    expect(en.title).toBe('The Committee took note...')
    expect(en.source_title).toBe('44th CIML Meeting')
    expect(fr.title).toBe('Le Comité a pris note...')
    expect(fr.source_title).toBe('44e réunion du CIML')

    // Both link to the same meeting
    expect(en.city).toBe('KEMBA')
    expect(fr.city).toBe('KEMBA')
    expect(en.country_code).toBe('KE')
  })

  it('handles Bulletin single-language resolutions', () => {
    const res = {
      identifier: 'CIML/1976/8',
      localizations: [{
        language_code: 'fra',
        title: 'DATE et LIEU de la PROCHAINE RÉUNION',
        subject: '(The CIML)',
        actions: [{ type: 'notes', message: 'La prochaine réunion...', dates: [] }],
      }],
    }
    const meta = {
      dates: [{ start: '1976-10-05', end: '1976-10-12', kind: 'meeting' }],
      venue: 'Paris, France',
      city: 'FRPAR',
      country_code: 'FR',
    }

    const records = buildResolutionRecords(res, '15CIML-1976-FR', meta)

    expect(records).toHaveLength(1)
    expect(records[0].language).toBe('fr')
    expect(records[0].subject).toBe('(The CIML)')
    expect(records[0].source_title).toBe('') // No title_localized for Bulletin
  })
})
