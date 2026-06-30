export const URN_BASE = 'urn:oiml'

const PUA_BULLET_REPLACEMENTS = [
  [/\uf0b7/g, '•'],
  [/\uf0be/g, '‣'],
  [/\uf0d8/g, '▸'],
  [/\uf020/g, ' '],
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
// CIML: ciml<meeting-number> (e.g. ciml60)
// Conference: conf<session-number> (e.g. conf17)
// The meeting/session number is parsed from the source_file slug because
// the YAML metadata block doesn't carry it.
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

export function deriveDisplayTitle(res, acclamation) {
  if (res.title) return res.title
  if (acclamation && res.actions && res.actions.length > 0) return 'Acclamation'
  return ''
}

export function buildResolutionRecord(res, sourceFile, metadata) {
  const identifier = String(res.identifier)
  const acclamation = isAcclamation(identifier)
  const datesInfo = metadata.dates || []
  const meetingDate = datesInfo.length > 0 ? datesInfo[0].start : ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''

  // id is the URL-safe slug (slashes -> dashes) used for routing.
  // identifier preserves the canonical slash form (e.g. 'CIML/2025/44') for display.
  const id = String(identifier).replace(/\//g, '-')

  // Language is derived from the source_file slug suffix
  // (ciml-44-resolutions-en -> 'en'; bilingual-PDF halves also end in -en/-fr).
  let language = ''
  if (/-en$/.test(sourceFile)) language = 'en'
  else if (/-fr$/.test(sourceFile)) language = 'fr'

  return {
    id,
    identifier: String(identifier),
    language,
    doi: res.doi || '',
    urn: res.urn || `${URN_BASE}:resolution:${identifier}`,
    title: deriveDisplayTitle(res, acclamation),
    subject: res.subject || '',
    year,
    venue: metadata.venue || '',
    city: metadata.city || '',
    country_code: metadata.country_code || '',
    source_file: sourceFile,
    meeting_urn: `${URN_BASE}:meeting:${sourceFile}`,
    source_title: metadata.title || '',
    meeting_date: meetingDate,
    is_acclamation: acclamation,
    actions: res.actions || [],
    considerations: res.considerations || [],
    approvals: res.approvals || [],
    dates: res.dates || [],
    snippet: normalizeSnippet(
      (res.actions && res.actions.length > 0 ? res.actions[0].message : '') ||
      (res.considerations && res.considerations.length > 0 ? res.considerations[0].message : '') ||
      res.title ||
      ''
    )
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
    return (b.id || '').localeCompare(a.id)
  }
  if (aIsAcc !== bIsAcc) return aIsAcc ? 1 : -1
  return (a.id || '').localeCompare(b.id)
}
