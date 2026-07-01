// Build-time helpers shared by scripts/build-data.mjs.
//
// Localization model (TODO.complete/14): each Resolution carries a
// `localizations[]` array. Each Localization is monolingual — its
// text fields (title, subject, message) are plain strings, not
// Localizable arrays. The build pipeline flattens each
// (Resolution, Localization) pair into one JSON record keyed by
// (source_file, identifier, language_code) so the browser still
// resolves a single row per resolution × language.

export const URN_BASE = 'urn:oiml'

const PUA_BULLET_REPLACEMENTS = [
  [//g, '•'],
  [//g, '‣'],
  [//g, '▸'],
  [//g, ' '],
]

export function normalizeSnippet(rawMessage) {
  if (!rawMessage) return ''
  let snippet = rawMessage
  for (const [pattern, replacement] of PUA_BULLET_REPLACEMENTS) {
    snippet = snippet.replace(pattern, replacement)
  }
  snippet = snippet
    .replace(/\n+/g, ' ')
    .replace(/  +/g, ' ')
    .trim()
  if (snippet.length > 200) {
    snippet = snippet.substring(0, 197) + '...'
  }
  return snippet
}

export function bodyTypeFromSourceFile(sourceFile) {
  return sourceFile.startsWith('conference-') ? 'conference' : 'ciml'
}

// Per TODO.cleanups/06: each meeting gets a DOI under 10.63493/meetings/.
export function buildMeetingDoi(meta, sourceFile) {
  const bodyType = bodyTypeFromSourceFile(sourceFile)
  const m = sourceFile.match(/^(?:ciml|conference)-(\d+)/)
  if (!m) return ''
  const num = m[1]
  const prefix = bodyType === 'conference' ? 'conf' : 'ciml'
  return `10.63493/meetings/${prefix}${num}`
}

export function isAcclamation(identifier) {
  return String(identifier).includes('-acclaim-')
}

// Derive the adoption_kind from the identifier by matching against
// the YAML-declared identifier_pattern of each kind. Defaults to
// 'plenary' when no pattern matches. See data/adoption-kinds.yaml.
//
// We hard-code the kinds here because the build script runs in Node
// before vite-plugin-yaml has loaded the browser-side data file. The
// canonical source of truth remains adoption-kinds.yaml; this map is
// a build-time mirror that drift-checks against the YAML at test time.
const ADOPTION_KIND_PATTERNS = [
  ['acclamation', '-acclaim-'],
]
const DEFAULT_ADOPTION_KIND = 'plenary'

export function deriveAdoptionKind(identifier) {
  const id = String(identifier || '')
  for (const [kind, pattern] of ADOPTION_KIND_PATTERNS) {
    if (id.includes(pattern)) return kind
  }
  return DEFAULT_ADOPTION_KIND
}

// Map ISO 639-3 (eng, fra) to ISO 639-1 (en, fr) so the browser
// Intl machinery keeps working without code changes.
const LANG_639_3_TO_1 = {
  eng: 'en',
  fra: 'fr',
  deu: 'de',
  spa: 'es',
  jpn: 'ja',
  rus: 'ru',
  zho: 'zh',
  ara: 'ar',
}

export function toLang6391(code) {
  return LANG_639_3_TO_1[code] || code
}

/**
 * Extract the canonical identifier string ("CIML/2023/05") from a
 * Resolution. Accepts both the canonical Edoxen v2 shape
 * (identifier: [{prefix, number}]) and the legacy scalar form.
 */
export function identifierOf(res) {
  const ident = res.identifier
  if (Array.isArray(ident) && ident.length > 0) {
    const first = ident[0]
    if (!first) return ''
    if (first.prefix && first.number) return `${first.prefix}/${first.number}`
    return String(first.number || '')
  }
  return String(ident || '')
}

/**
 * Pick the meeting date (ISO 8601) off a ResolutionMetadata. Newer
 * Edoxen v2 metadata carries a single `date` string; older builds
 * also accepted `dates[]` for back-compat.
 */
export function meetingDateOf(metadata) {
  if (!metadata) return ''
  if (metadata.date) return metadata.date
  const dates = metadata.dates
  if (Array.isArray(dates) && dates.length > 0) {
    return dates[0]?.start || dates[0]?.date || ''
  }
  return ''
}

export function meetingDateEndOf(metadata) {
  if (!metadata) return ''
  const dates = metadata.dates
  if (Array.isArray(dates) && dates.length > 0) return dates[0]?.end || ''
  return ''
}

/**
 * Flatten one (Resolution, Localization) pair into a JSON record.
 * Returns null when neither side carries usable content.
 */
export function buildResolutionRecord(res, sourceFile, metadata, localization) {
  if (!res || !localization) return null
  const identifier = identifierOf(res)
  const acclamation = isAcclamation(identifier)
  const meetingDate = meetingDateOf(metadata)
  const dateEnd = meetingDateEndOf(metadata)
  const year = meetingDate ? meetingDate.substring(0, 4) : ''

  // id is the URL-safe slug (slashes -> dashes) used for routing.
  const id = String(identifier).replace(/\//g, '-')
  const language = toLang6391(localization.language_code || '')

  // Find the matching source URL for this language.
  const sourceUrls = metadata.source_urls || []
  const langMatch = sourceUrls.find(u => u && u.language_code === localization.language_code)
  const sourceUrl = (langMatch && langMatch.ref) || (sourceUrls[0] && sourceUrls[0].ref) || ''

  const actions = (localization.actions || []).map(a => ({
    ...a,
    message: a.message || '',
  }))
  const considerations = (localization.considerations || []).map(c => ({
    ...c,
    message: c.message || '',
  }))

  return {
    id,
    identifier: String(identifier),
    language,
    language_code: localization.language_code || '',
    script: localization.script || 'Latn',
    title: localization.title || '',
    subject: localization.subject || '',
    year,
    city: metadata.city || '',
    country_code: metadata.country_code || '',
    source_file: sourceFile,
    meeting_urn: `${URN_BASE}:meeting:${sourceFile}`,
    source_title: metadata.title || '',
    meeting_date: meetingDate,
    meeting_date_end: dateEnd,
    agenda_item: res.agenda_item || '',
    source_url: sourceUrl,
    adoption_kind: deriveAdoptionKind(identifier),
    is_acclamation: acclamation,
    actions,
    considerations,
    approvals: localization.approvals || [],
    dates: res.dates || [],
    type: res.type || (sourceFile.includes('-decisions-') ? 'decision' : 'resolution'),
    doi: res.doi || '',
    urn: res.urn || '',
    snippet: normalizeSnippet(
      (actions[0] && actions[0].message) ||
      (considerations[0] && considerations[0].message) ||
      (localization.title || '')
    ),
  }
}

export function sortResolutions(a, b) {
  if (a.meeting_date !== b.meeting_date) {
    return (b.meeting_date || '').localeCompare(a.meeting_date || '')
  }
  const aIsAcc = isAcclamation(a.id)
  const bIsAcc = isAcclamation(b.id)
  if (!aIsAcc && !bIsAcc) {
    const aNum = parseFloat(a.id)
    const bNum = parseFloat(b.id)
    if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum
    return (a.id || '').localeCompare(b.id)
  }
  if (aIsAcc !== bIsAcc) return aIsAcc ? 1 : -1
  return (a.id || '').localeCompare(b.id)
}
