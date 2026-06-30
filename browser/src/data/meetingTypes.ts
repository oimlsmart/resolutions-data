// Thin TypeScript wrapper around meeting-types.yaml.
// Editing CIML/Conference colors or short chip labels: edit
// meeting-types.yaml, not this file.
//
// CSS reads the per-body-type colors via custom properties
// (--mt-bg, --mt-fg, --mt-accent) that templates set with :style
// bindings on each meeting-type element.

import data from './meeting-types.yaml'

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
