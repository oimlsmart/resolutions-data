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

// Each meeting gets a DOI under 10.63493/meetings/. The slug is the
// canonical meeting slug derived from the meeting URN.
export function buildMeetingDoi(_meta, slug) {
  const m = String(slug).match(/^(ciml|conference)-(\d+)/);
  if (!m) return '';
  const prefix = m[1] === 'conference' ? 'conf' : 'ciml';
  return `10.63493/meetings/${prefix}${m[2]}`;
}

export function isAcclamation(identifier) {
  return String(identifier).includes('-acclaim-')
}

export function deriveDisplayTitle(res, acclamation) {
  if (res.title) return res.title
  if (acclamation && res.actions && res.actions.length > 0) return 'Acclamation'
  return ''
}

// Expand a merged resolution record (with localizations[]) into one or
// more flat resolution records for the UI. Each language produces one
// record so the EN/FR/both toggle on the detail page can flip between
// them. All records for the same logical resolution share the same
// `identifier` and `id`.
export function buildResolutionRecords(res, sourceFile, metadata) {
  const identifier = String(res.identifier)
  const acclamation = isAcclamation(identifier)
  const datesInfo = metadata.dates || []
  const meetingDate = datesInfo.length > 0 ? datesInfo[0].start : ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''
  const id = identifier.replace(/\//g, '-')
  const localizations = res.localizations || []

  const base = {
    identifier,
    doi: res.doi || '',
    urn: res.urn || `${URN_BASE}:resolution:${identifier}`,
    year,
    venue: metadata.venue || '',
    city: metadata.city || '',
    country_code: metadata.country_code || '',
    source_file: sourceFile,
    source_title: '',
    meeting_date: meetingDate,
    is_acclamation: acclamation,
    dates: res.dates || [],
    agenda_item: res.agenda_item || '',
  }

  // Pick the meeting collection title from metadata.title_localized[]
  // per language (fall back to metadata.title when no per-language
  // variants exist).
  const titleLocalized = metadata.title_localized || []
  const defaultTitle = metadata.title || ''

  if (localizations.length === 0) {
    // Defensive: shouldn't happen, but emit one record anyway.
    return [{
      ...base,
      id,
      language: '',
      title: '',
      subject: '',
      actions: [],
      considerations: [],
      approvals: [],
      categories: res.categories || [],
      snippet: '',
      source_title: defaultTitle,
    }]
  }

  return localizations.map((loc) => {
    const langCode = loc.language_code === 'fra' ? 'fr' : 'en'
    const titleEntry = titleLocalized.find(t => t.language_code === loc.language_code)
      || titleLocalized.find(t => t.language_code === 'eng')
      || titleLocalized[0]
    const sourceTitle = titleEntry?.title || defaultTitle
    const actions = loc.actions || []
    const snippet = normalizeSnippet(
      (actions.length > 0 ? actions[0].message : '') ||
      (loc.considerations && loc.considerations.length > 0 ? loc.considerations[0].message : '') ||
      loc.title ||
      '',
    )
    return {
      ...base,
      id,
      language: langCode,
      title: loc.title || '',
      subject: loc.subject || '',
      actions,
      considerations: loc.considerations || [],
      approvals: loc.approvals || [],
      categories: res.categories || [],
      snippet,
      source_title: sourceTitle,
    }
  })
}

// Legacy single-record export kept for any caller that hasn't migrated
// to the new buildResolutionRecords (plural). Returns the first record.
export function buildResolutionRecord(res, sourceFile, metadata) {
  return buildResolutionRecords(res, sourceFile, metadata)[0]
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
    return (b.id || '').localeCompare(a.id)
  }
  if (aIsAcc !== bIsAcc) return aIsAcc ? 1 : -1
  return (a.id || '').localeCompare(b.id)
}
