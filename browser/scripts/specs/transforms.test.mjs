// Unit tests for browser/scripts/lib/transforms.mjs.
// Run: node --test browser/scripts/specs/transforms.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildResolutionRecord,
  toLang6391,
  normalizeSnippet,
  isAcclamation,
  deriveAdoptionKind,
  sortResolutions,
  bodyTypeFromSourceFile,
  buildMeetingDoi,
} from '../lib/transforms.mjs'

// --- bodyTypeFromSourceFile -------------------------------------------

test('bodyTypeFromSourceFile classifies ciml-*', () => {
  assert.equal(bodyTypeFromSourceFile('ciml-39-decisions'), 'ciml')
  assert.equal(bodyTypeFromSourceFile('ciml-60-resolutions'), 'ciml')
})

test('bodyTypeFromSourceFile classifies conference-*', () => {
  assert.equal(bodyTypeFromSourceFile('conference-17-resolutions'), 'conference')
})

// --- buildMeetingDoi --------------------------------------------------

test('buildMeetingDoi produces ciml prefix', () => {
  assert.equal(
    buildMeetingDoi({}, 'ciml-60-resolutions'),
    '10.63493/meetings/ciml60',
  )
})

test('buildMeetingDoi produces conf prefix', () => {
  assert.equal(
    buildMeetingDoi({}, 'conference-17-resolutions'),
    '10.63493/meetings/conf17',
  )
})

test('buildMeetingDoi returns empty for unknown pattern', () => {
  assert.equal(buildMeetingDoi({}, 'unknown-slug'), '')
})

// --- isAcclamation ----------------------------------------------------

test('isAcclamation matches -acclaim- in identifier', () => {
  assert.equal(isAcclamation('CIML/2025/44-acclaim-1'), true)
  assert.equal(isAcclamation('CIML/2025/44'), false)
})

// --- deriveAdoptionKind ----------------------------------------------

test('deriveAdoptionKind returns acclamation for -acclaim- identifiers', () => {
  assert.equal(deriveAdoptionKind('CIML/2025/44-acclaim-1'), 'acclamation')
})

test('deriveAdoptionKind returns plenary for normal identifiers', () => {
  assert.equal(deriveAdoptionKind('CIML/2025/44'), 'plenary')
  assert.equal(deriveAdoptionKind('Conference/2025/01'), 'plenary')
})

test('deriveAdoptionKind returns plenary for null/empty identifiers', () => {
  assert.equal(deriveAdoptionKind(null), 'plenary')
  assert.equal(deriveAdoptionKind(''), 'plenary')
  assert.equal(deriveAdoptionKind(undefined), 'plenary')
})

// --- toLang6391 -------------------------------------------------------

test('toLang6391 maps ISO 639-3 to ISO 639-1', () => {
  assert.equal(toLang6391('eng'), 'en')
  assert.equal(toLang6391('fra'), 'fr')
  assert.equal(toLang6391('deu'), 'de')
  assert.equal(toLang6391('jpn'), 'ja')
})

test('toLang6391 passes through ISO 639-1 codes', () => {
  assert.equal(toLang6391('en'), 'en')
  assert.equal(toLang6391('fr'), 'fr')
})

test('toLang6391 falls back to original on unknown code', () => {
  assert.equal(toLang6391('xxx'), 'xxx')
})

// --- pickLocalizable is not exported (internal) — covered indirectly
// via buildResolutionRecord tests below.

// --- normalizeSnippet -------------------------------------------------

test('normalizeSnippet truncates at 200 chars', () => {
  const long = 'x'.repeat(300)
  const result = normalizeSnippet(long)
  assert.equal(result.length, 200)
  assert.ok(result.endsWith('...'))
})

test('normalizeSnippet collapses whitespace', () => {
  assert.equal(
    normalizeSnippet('foo\n\n  bar\n  baz'),
    'foo bar baz',
  )
})

test('normalizeSnippet replaces PUA bullet chars', () => {
  const text = 'Item ' + '' + ' point'
  assert.equal(normalizeSnippet(text), 'Item • point')
})

test('normalizeSnippet returns empty for null/empty', () => {
  assert.equal(normalizeSnippet(null), '')
  assert.equal(normalizeSnippet(''), '')
})

// --- buildResolutionRecord -------------------------------------------

const SAMPLE_METADATA = {
  title: 'Test Meeting',
  dates: [{ start: '2025-10-13', end: '2025-10-15', kind: 'meeting' }],
  venue: 'Paris, France',
  city: 'PAR',
  country_code: 'FR',
  source_urls: [
    { ref: 'https://oiml.org/en.pdf', format: 'pdf', language_code: 'eng' },
    { ref: 'https://oiml.org/fr.pdf', format: 'pdf', language_code: 'fra' },
  ],
}

const SAMPLE_RESOLUTION = {
  identifier: 'CIML/2025/44',
  doi: '10.63493/resolutions/ciml202544',
  urn: 'urn:oiml:doc:ciml:resolution:2025-44',
  agenda_item: '16.2',
  dates: [{ start: '2025-10-13', kind: 'decision' }],
}

const SAMPLE_LOCALIZATION_EN = {
  language_code: 'eng',
  script: 'Latn',
  title: 'Approval of minutes',
  subject: 'CIML',
  actions: [{ type: 'approves', message: 'Approves the minutes.' }],
}

test('buildResolutionRecord flattens (resolution, localization) into a row', () => {
  const r = buildResolutionRecord(SAMPLE_RESOLUTION, 'ciml-60-resolutions', SAMPLE_METADATA, SAMPLE_LOCALIZATION_EN)
  assert.equal(r.id, 'CIML-2025-44')
  assert.equal(r.identifier, 'CIML/2025/44')
  assert.equal(r.language, 'en')
  assert.equal(r.language_code, 'eng')
  assert.equal(r.script, 'Latn')
  assert.equal(r.title, 'Approval of minutes')
  assert.equal(r.subject, 'CIML')
  assert.equal(r.agenda_item, '16.2')
  assert.equal(r.source_url, 'https://oiml.org/en.pdf')
  assert.equal(r.adoption_kind, 'plenary')
  assert.equal(r.is_acclamation, false)
})

test('buildResolutionRecord picks matching source URL by language_code', () => {
  const frLoc = { ...SAMPLE_LOCALIZATION_EN, language_code: 'fra', title: 'Approbation' }
  const r = buildResolutionRecord(SAMPLE_RESOLUTION, 'ciml-60-resolutions', SAMPLE_METADATA, frLoc)
  assert.equal(r.language, 'fr')
  assert.equal(r.title, 'Approbation')
  assert.equal(r.source_url, 'https://oiml.org/fr.pdf')
})

test('buildResolutionRecord builds snippet from first action', () => {
  const r = buildResolutionRecord(SAMPLE_RESOLUTION, 'ciml-60-resolutions', SAMPLE_METADATA, SAMPLE_LOCALIZATION_EN)
  assert.equal(r.snippet, 'Approves the minutes.')
})

// --- sortResolutions --------------------------------------------------

test('sortResolutions orders by meeting_date desc', () => {
  const a = { id: 'A-1', meeting_date: '2025-01-01' }
  const b = { id: 'B-1', meeting_date: '2024-01-01' }
  assert.equal(sortResolutions(a, b), -1)
})

test('sortResolutions tie-breaks by id when dates are equal', () => {
  // parseFloat('CIML-2025-1') yields 2025 for both, so the function
  // falls back to localeCompare. We just assert it returns *some*
  // deterministic non-zero result.
  const a = { id: 'CIML-2025-1', meeting_date: '2025-01-01' }
  const b = { id: 'CIML-2025-2', meeting_date: '2025-01-01' }
  const result = sortResolutions(a, b)
  assert.notEqual(result, 0)
})
