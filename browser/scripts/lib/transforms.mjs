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
 * Flatten one (Resolution, Localization) pair into a JSON record.
 * Returns null when neither side carries usable content.
 */
export function buildResolutionRecord(res, sourceFile, metadata, localization) {
  if (!res || !localization) return null
  const identifier = String(res.identifier)
  const acclamation = isAcclamation(identifier)
  const datesInfo = metadata.dates || []
  const meetingDate = datesInfo.length > 0 ? datesInfo[0].start : ''
  const dateEnd = datesInfo.length > 0 ? (datesInfo[0].end || '') : ''
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
    venue: metadata.venue || '',
    city: metadata.city || '',
    country_code: metadata.country_code || '',
    source_file: sourceFile,
    meeting_urn: `${URN_BASE}:meeting:${sourceFile}`,
    source_title: metadata.title || '',
    meeting_date: meetingDate,
    meeting_date_end: dateEnd,
    agenda_item: res.agenda_item || '',
    source_url: sourceUrl,
    is_acclamation: acclamation,
    actions,
    considerations,
    approvals: localization.approvals || res.approvals || [],
    dates: res.dates || [],
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
