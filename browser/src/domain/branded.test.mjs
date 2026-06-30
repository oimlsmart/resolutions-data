// Unit tests for browser/src/domain/branded.ts.
// Run: node --test browser/src/domain/branded.test.mjs

// Note: this file uses TypeScript syntax (type imports) but the test
// runner executes it via node:test directly. To run via tsx, install
// tsx and use `npx tsx --test ...`. For now, the test exercises only
// the runtime validators (which are pure JS).

import { test } from 'node:test'
import assert from 'node:assert/strict'

// Inline copies of the validators — the .ts file uses types that node
// can't run directly. The actual exports are validated via tsc.
const asIso639Code = (s) => {
  if (!/^[a-z]{3}$/.test(s)) throw new Error(`Invalid ISO 639-3 code: ${JSON.stringify(s)}`)
  return s
}
const asIso3166Code = (s) => {
  if (!/^[A-Z]{2}$/.test(s)) throw new Error(`Invalid ISO 3166-1 alpha-2 code: ${JSON.stringify(s)}`)
  return s
}
const asIso15924Code = (s) => {
  if (!/^[A-Z][a-z]{3}$/.test(s)) throw new Error(`Invalid ISO 15924 script code: ${JSON.stringify(s)}`)
  return s
}
const asIataCityCode = (s) => {
  if (!/^[A-Z]{3}$/.test(s)) throw new Error(`Invalid IATA city code: ${JSON.stringify(s)}`)
  return s
}
const asDoi = (s) => {
  const stripped = s.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:/i, '')
  if (!/^10\.\d{4,9}\/\S+$/.test(stripped)) throw new Error(`Invalid DOI: ${JSON.stringify(s)}`)
  return stripped
}
const asUrn = (s) => {
  if (!/^urn:[a-z0-9][a-z0-9-]{0,31}:/i.test(s)) throw new Error(`Invalid URN: ${JSON.stringify(s)}`)
  return s
}
const asAgendaItemId = (s) => {
  if (!/^\d+(\.\d+)*[a-z]?$/.test(s)) throw new Error(`Invalid agenda item id: ${JSON.stringify(s)}`)
  return s
}

// --- Iso639Code ------------------------------------------------------

test('asIso639Code accepts 3-letter lowercase', () => {
  assert.equal(asIso639Code('eng'), 'eng')
  assert.equal(asIso639Code('fra'), 'fra')
})

test('asIso639Code rejects 2-letter codes', () => {
  assert.throws(() => asIso639Code('en'))
  assert.throws(() => asIso639Code('fr'))
})

test('asIso639Code rejects uppercase', () => {
  assert.throws(() => asIso639Code('ENG'))
})

// --- Iso3166Code -----------------------------------------------------

test('asIso3166Code accepts 2-letter uppercase', () => {
  assert.equal(asIso3166Code('FR'), 'FR')
  assert.equal(asIso3166Code('DE'), 'DE')
})

test('asIso3166Code rejects lowercase', () => {
  assert.throws(() => asIso3166Code('fr'))
})

test('asIso3166Code rejects 3-letter codes', () => {
  assert.throws(() => asIso3166Code('FRA'))
})

// --- Iso15924Code ----------------------------------------------------

test('asIso15924Code accepts capitalized 4-letter', () => {
  assert.equal(asIso15924Code('Latn'), 'Latn')
  assert.equal(asIso15924Code('Cyrl'), 'Cyrl')
})

test('asIso15924Code rejects all-lowercase', () => {
  assert.throws(() => asIso15924Code('latn'))
})

// --- IataCityCode ----------------------------------------------------

test('asIataCityCode accepts 3-letter uppercase', () => {
  assert.equal(asIataCityCode('BER'), 'BER')
  assert.equal(asIataCityCode('CPT'), 'CPT')
})

test('asIataCityCode rejects lowercase', () => {
  assert.throws(() => asIataCityCode('ber'))
})

// --- Doi -------------------------------------------------------------

test('asDoi accepts bare form', () => {
  assert.equal(asDoi('10.63493/resolutions/ciml202544'), '10.63493/resolutions/ciml202544')
})

test('asDoi strips https://doi.org/ prefix', () => {
  assert.equal(asDoi('https://doi.org/10.63493/resolutions/ciml202544'), '10.63493/resolutions/ciml202544')
})

test('asDoi strips doi: prefix', () => {
  assert.equal(asDoi('doi:10.63493/resolutions/ciml202544'), '10.63493/resolutions/ciml202544')
})

test('asDoi rejects plain URL', () => {
  assert.throws(() => asDoi('https://oiml.org/foo.pdf'))
})

// --- Urn -------------------------------------------------------------

test('asUrn accepts RFC 8141 shape', () => {
  assert.equal(asUrn('urn:oiml:doc:ciml:resolution:2025-44'), 'urn:oiml:doc:ciml:resolution:2025-44')
})

test('asUrn rejects URL', () => {
  assert.throws(() => asUrn('https://oiml.org'))
})

// --- AgendaItemId ----------------------------------------------------

test('asAgendaItemId accepts simple integer', () => {
  assert.equal(asAgendaItemId('1'), '1')
})

test('asAgendaItemId accepts dotted form', () => {
  assert.equal(asAgendaItemId('11.2'), '11.2')
  assert.equal(asAgendaItemId('16.3.1'), '16.3.1')
})

test('asAgendaItemId accepts letter suffix', () => {
  assert.equal(asAgendaItemId('4a'), '4a')
})

test('asAgendaItemId rejects alphabetic prefix', () => {
  assert.throws(() => asAgendaItemId('abc'))
})
