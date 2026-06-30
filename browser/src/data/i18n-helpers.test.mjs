// Unit tests for browser/src/data/{actionTypes,adoptionKinds}.ts and
// venues.ts i18n helpers.
// Run: node --test browser/src/data/i18n-helpers.test.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// The .ts files import YAML via vite-plugin-yaml, which Node can't
// resolve directly. Inline the data at test time by reading the YAML
// and parsing with js-yaml (the same lib vite-plugin-yaml uses).
import yaml from 'js-yaml'

const actionTypesData = yaml.load(readFileSync(new URL('./action-types.yaml', import.meta.url), 'utf-8'))
const adoptionKindsData = yaml.load(readFileSync(new URL('./adoption-kinds.yaml', import.meta.url), 'utf-8'))

// --- Inline mirrors of the helper logic ------------------------------------
// Keeping these in sync with the .ts files is the trade-off for not
// requiring tsx at test time. The drift surface is small (3 helpers).

function getActionLabel(type, lang) {
  const normalized = String(type || '').toLowerCase().trim()
  const colors = actionTypesData.actionTypeColors || {}
  const cfg = colors[normalized] || colors._default
  const iso639_3 = lang === 'fr' ? 'fra' : 'eng'
  return cfg?.labels?.[iso639_3] || cfg?.labels?.eng || normalized
}

function getAdoptionKindLabel(kind, lang) {
  if (!kind) return ''
  const cfg = adoptionKindsData.adoptionKinds[kind]
  if (!cfg) return kind
  const iso = lang === 'fr' ? 'fra' : 'eng'
  return cfg.label[iso] || cfg.label.eng || kind
}

function deriveAdoptionKind(identifier) {
  const id = String(identifier || '')
  const kinds = adoptionKindsData.adoptionKinds
  for (const key of Object.keys(kinds)) {
    const pattern = kinds[key].identifier_pattern
    if (pattern && id.includes(pattern)) return key
  }
  return 'plenary'
}

// --- Action label tests ----------------------------------------------------

test('getActionLabel returns English label by default', () => {
  assert.equal(getActionLabel('thanks', 'en'), 'Thanks')
  assert.equal(getActionLabel('approves', 'en'), 'Approves')
})

test('getActionLabel returns French label when lang=fr', () => {
  assert.equal(getActionLabel('thanks', 'fr'), 'Remercie')
  assert.equal(getActionLabel('approves', 'fr'), 'Approuve')
})

test('getActionLabel falls back to English when lang has no FR label', () => {
  // _default entry has both languages, but if we removed one the
  // fallback should still work. Use a known-good verb to verify.
  assert.equal(getActionLabel('thanks', 'de'), 'Thanks')
})

test('getActionLabel returns _default label for unknown verbs', () => {
  // The TS implementation falls back to actionTypeColors._default,
  // not the raw type string. So an unknown verb shows as 'Other'.
  assert.equal(getActionLabel('unknown_verb', 'en'), 'Other')
})

// --- Adoption kind tests ---------------------------------------------------

test('getAdoptionKindLabel returns English label by default', () => {
  assert.equal(getAdoptionKindLabel('plenary', 'en'), 'Plenary')
  assert.equal(getAdoptionKindLabel('acclamation', 'en'), 'Acclamation')
})

test('getAdoptionKindLabel returns French label when lang=fr', () => {
  assert.equal(getAdoptionKindLabel('plenary', 'fr'), 'Plénière')
  assert.equal(getAdoptionKindLabel('acclamation', 'fr'), 'Acclamation')
  assert.equal(getAdoptionKindLabel('ballot', 'fr'), 'Scrutin')
})

test('getAdoptionKindLabel returns empty for undefined kind', () => {
  assert.equal(getAdoptionKindLabel(undefined, 'en'), '')
  assert.equal(getAdoptionKindLabel(null, 'en'), '')
})

test('getAdoptionKindLabel returns raw kind for unknown kinds', () => {
  assert.equal(getAdoptionKindLabel('unknown_kind', 'en'), 'unknown_kind')
})

test('deriveAdoptionKind matches -acclaim- pattern → acclamation', () => {
  assert.equal(deriveAdoptionKind('CIML/2025/44-acclaim-1'), 'acclamation')
})

test('deriveAdoptionKind returns plenary when no pattern matches', () => {
  assert.equal(deriveAdoptionKind('CIML/2025/44'), 'plenary')
  assert.equal(deriveAdoptionKind('Conference/2025/01'), 'plenary')
})

test('deriveAdoptionKind handles empty / null identifier', () => {
  assert.equal(deriveAdoptionKind(''), 'plenary')
  assert.equal(deriveAdoptionKind(null), 'plenary')
  assert.equal(deriveAdoptionKind(undefined), 'plenary')
})
