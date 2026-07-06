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
  // identifier is now a StructuredIdentifier[] in v2 format:
  // [{prefix: "CIML", number: "2009/1"}]. Reconstruct the display string.
  const identArray = Array.isArray(res.identifier)
    ? res.identifier
    : [{ prefix: '', number: String(res.identifier || '') }]
  const identifier = identArray.map(i => {
    const num = i.number || ''
    return i.prefix ? `${i.prefix}/${num}` : num
  }).join(' / ')

  const acclamation = isAcclamation(identifier)
  // v2 metadata uses `date` (single string) or legacy `dates` (array).
  // v2 decision-level dates use {date, type} instead of {start, kind}.
  const datesInfo = metadata.dates || (metadata.date ? [{ start: metadata.date }] : [])
  const meetingDate = datesInfo.length > 0
    ? (datesInfo[0].date || datesInfo[0].start || '')
    : ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''
  const id = identifier.replace(/\//g, '-')
  const localizations = res.localizations || []

  const base = {
    identifier,
    doi: res.doi || '',
    urn: res.urn || `${URN_BASE}:resolution:${identifier}`,
    year,
    venue: metadata.venue || metadata.general_area || '',
    city: metadata.city || '',
    country_code: metadata.country_code || '',
    source_file: sourceFile,
    source_title: '',
    meeting_date: meetingDate,
    is_acclamation: acclamation,
    dates: (res.dates || []).map(d => ({ start: d.date || d.start, kind: d.type || d.kind })),
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
    // Normalize v2 actions: convert date_effective back to dates[] for
    // UI backward compat.
    const rawActions = loc.actions || []
    const actions = rawActions.map(a => {
      if (a.date_effective && !a.dates) {
        return { ...a, dates: [a.date_effective] }
      }
      return a
    })
    // Normalize v2 considerations similarly.
    const rawCons = loc.considerations || []
    const considerations = rawCons.map(c => {
      if (c.date_effective && !c.dates) {
        return { ...c, dates: [c.date_effective] }
      }
      return c
    })
    const snippet = normalizeSnippet(
      (actions.length > 0 ? actions[0].message : '') ||
      (considerations.length > 0 ? considerations[0].message : '') ||
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
      considerations,
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
