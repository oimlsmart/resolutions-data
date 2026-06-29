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
  return {
    id,
    identifier: String(identifier),
    urn: `${URN_BASE}:resolution:${identifier}`,
    title: deriveDisplayTitle(res, acclamation),
    subject: res.subject || '',
    year,
    venue: metadata.venue || '',
    source_file: sourceFile,
    meeting_urn: `${URN_BASE}:meeting:${sourceFile}`,
    source_title: metadata.title || '',
    meeting_date: meetingDate,
    is_acclamation: acclamation,
    actions: res.actions || [],
    considerations: res.considerations || [],
    approvals: res.approvals || [],
    dates: res.dates || [],
    snippet: normalizeSnippet(res.actions && res.actions.length > 0 ? res.actions[0].message : '')
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
