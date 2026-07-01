// Thin TypeScript wrapper around meeting-types.yaml.
// Editing CIML/Conference colors or short chip labels: edit
// meeting-types.yaml, not this file.
//
// CSS reads the per-body-type colors via custom properties
// (--mt-bg, --mt-fg, --mt-accent) that templates set with :style
// bindings on each meeting-type element.

import data from './meeting-types.yaml'
import { formatDateRange } from '../utils/format'
import type { Meeting, Resolution } from '../types/resolution'
import { bodyTypeFromSourceFile } from '../utils/meetingType'
import { venueForLang } from './venues'

export interface MeetingTypeConfig {
  id: string
  short: { en: string; fr: string }
  bg: string
  fg: string
  accent: string
}

export const meetingTypes = (data.meetingTypes || {}) as Record<
  'ciml' | 'conference',
  MeetingTypeConfig
>

export type MeetingTypeKey = keyof typeof meetingTypes

export type MeetingTypeColors = Pick<MeetingTypeConfig, 'bg' | 'fg' | 'accent'>

/** Look up a meeting type config by id. Falls back to the `conference` entry
 *  for unrecognized ids, matching how action-types.yaml handles unknown
 *  action types via _default. */
export function getMeetingType(id: string): MeetingTypeConfig {
  if (id === 'ciml' || id === 'conference') return meetingTypes[id]
  return meetingTypes.conference
}

/** Short chip label for the given body type in the current UI language. */
export function getMeetingTypeShort(id: string, lang: 'en' | 'fr'): string {
  return getMeetingType(id).short[lang] || getMeetingType(id).short.en
}

/** Return the color set for a meeting body type, suitable for binding
 *  to a CSS custom-property style object (`:style="mtStyle(id)"`). */
export function mtStyle(id: string): Record<`--mt-${string}`, string> {
  const cfg = getMeetingType(id)
  return {
    '--mt-bg': cfg.bg,
    '--mt-fg': cfg.fg,
    '--mt-accent': cfg.accent,
  }
}

/** Inline-language label for the body type — full "CIML Meeting" /
 *  "OIML Conference" / "Réunion du CIML" / "Conférence OIML". */
export function getMeetingTypeLabel(id: string, lang: 'en' | 'fr'): string {
  if (id === 'ciml') return lang === 'fr' ? 'Réunion du CIML' : 'CIML Meeting'
  return lang === 'fr' ? 'Conférence OIML' : 'OIML Conference'
}

/**
 * Compose a one-line meeting summary for the meeting-link badge:
 *   "{CIML|CONF} · {date range} · {city, country}"
 *
 * Pulls venue/city/dates from the meeting record; falls back to the
 * resolution's own venue/city if the meeting record isn't supplied.
 */
export function meetingSummary(
  sourceFile: string | undefined,
  lang: 'en' | 'fr',
  meetingOrResolution?: Meeting | Resolution | null,
): string {
  const id = bodyTypeFromSourceFile(sourceFile || '')
  const parts: string[] = []
  parts.push(getMeetingTypeShort(id, lang))

  const start = meetingOrResolution?.meeting_date || ''
  const end   =
    (meetingOrResolution as Resolution | undefined)?.meeting_date_end ||
    (meetingOrResolution as Meeting | undefined)?.date_end ||
    ''
  if (start) parts.push(formatDateRange(start, end || undefined, lang))

  const venueCity = renderMeetingVenue(meetingOrResolution, lang)
  if (venueCity) parts.push(venueCity)
  return parts.filter(Boolean).join(' · ')
}

function renderMeetingVenue(m: Meeting | Resolution | null | undefined, lang: 'en' | 'fr'): string {
  if (!m) return ''
  const city = (m as Meeting).city || ''
  const code = (m as Meeting).country_code || ''
  if (city || code) {
    return venueForLang(city, code, lang)
  }
  return ''
}
