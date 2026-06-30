// Build-time helpers shared by scripts/build-data.mjs.
//
// Localization: per TODO.complete/13, every text field is a
// LocalizableValue — either a plain string (legacy/single-language
// fixtures) or an array of {content, lang} records. `pickLocalizable`
// returns the requested language's text, falling back through
// lang → en → first available → ''.

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

// Pick the text in the requested language from a Localizable value.
//   pickLocalizable('Hello', 'fr')               -> 'Hello'  (string treated as raw)
//   pickLocalizable([{content, lang}], 'fr')     -> '...'
//   pickLocalizable(undefined, 'fr')              -> ''
export function pickLocalizable(value, lang = 'en', fallbackLang = 'en') {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (!Array.isArray(value) || value.length === 0) return ''
  for (const item of value) {
    if (item && item.lang === lang && typeof item.content === 'string') return item.content
  }
  if (fallbackLang && fallbackLang !== lang) {
    for (const item of value) {
      if (item && item.lang === fallbackLang && typeof item.content === 'string') return item.content
    }
  }
  const first = value.find(v => v && typeof v.content === 'string')
  return first ? first.content : ''
}

/** Return an array of {content, lang} for the requested language fallbacks. */
export function localizeRecord(value, lang = 'en') {
  if (value == null) return null
  if (typeof value === 'string') return [{ content: value, lang }]
  if (!Array.isArray(value)) return null
  return value.filter(v => v && typeof v.content === 'string')
}

export function isAcclamation(identifier) {
  return String(identifier).includes('-acclaim-')
}

/** Pull a piece of per-meeting metadata text in the row's language. */
function meetingMeta(metadata, lang) {
  const src = metadata.source_urls || []
  const urlObj = src.find(u => u && u.lang === lang) || src.find(u => u && u.lang === 'en') || src[0]
  return {
    title: pickLocalizable(metadata.title, lang),
    source_url: urlObj ? urlObj.ref : '',
  }
}

export function deriveDisplayTitle(res) {
  if (!res) return ''
  if (res.title_localized) return res.title_localized
  if (res.title) return res.title
  if (res.actions && res.actions.length > 0 && res.actions[0].message) {
    return res.actions[0].message
  }
  return ''
}

export function buildResolutionRecord(res, sourceFile, metadata, options = {}) {
  const identifier = String(res.identifier)
  const acclamation = isAcclamation(identifier)
  const datesInfo = metadata.dates || []
  const meetingDate = datesInfo.length > 0 ? datesInfo[0].start : ''
  const dateEnd = datesInfo.length > 0 ? (datesInfo[0].end || '') : ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''

  // id is the URL-safe slug (slashes -> dashes) used for routing.
  const id = String(identifier).replace(/\//g, '-')

  // Per-row language comes from the YAML; the legacy per-file fallback
  // remains so older fixtures still work.
  const language = res.language || options.defaultLanguage || ''

  // The matching per-language source PDF URL for this row.
  const langMatch = (metadata.source_urls || []).find(u => u && u.lang === language)
  const sourceUrl = (langMatch && langMatch.ref) || options.sourceUrl || ''

  // Localized text extracted once per row. Older fixtures used plain
  // strings; newer Localizable rows use {content, lang} arrays.
  const titleText = pickLocalizable(res.title, language)
  const subjectText = pickLocalizable(res.subject, language)

  return {
    id,
    identifier: String(identifier),
    language,
    title: titleText,
    title_localized: localizeRecord(res.title),
    subject: subjectText,
    subject_localized: localizeRecord(res.subject),
    year,
    venue: metadata.venue || '',
    city: metadata.city || '',
    country_code: metadata.country_code || '',
    source_file: sourceFile,
    meeting_urn: `${URN_BASE}:meeting:${sourceFile}`,
    source_title: pickLocalizable(metadata.title, language),
    source_title_en: pickLocalizable(metadata.title, 'en'),
    source_title_fr: pickLocalizable(metadata.title, 'fr'),
    meeting_date: meetingDate,
    meeting_date_end: dateEnd,
    agenda_item: res.agenda_item || '',
    source_url: sourceUrl,
    is_acclamation: acclamation,
    actions: (res.actions || []).map(a => ({ ...a, message: pickLocalizable(a.message, language) || '' })),
    considerations: (res.considerations || []).map(c => ({ ...c, message: pickLocalizable(c.message, language) || '', subject: pickLocalizable(c.subject, language) || '' })),
    approvals: res.approvals || [],
    dates: res.dates || [],
    doi: res.doi || '',
    urn: res.urn || '',
    snippet: normalizeSnippet(
      ((res.actions && res.actions.length > 0) ? pickLocalizable(res.actions[0].message, language) : '') ||
      ((res.considerations && res.considerations.length > 0) ? pickLocalizable(res.considerations[0].message, language) : '') ||
      titleText
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
    if (!isNaN(aNum) && !bNum) return bNum - aNum
    return (a.id || '').localeCompare(b.id)
  }
  if (aIsAcc !== aIsAcc) return aIsAcc ? 1 : -1
  return (a.id || '').localeCompare(b.id)
}
