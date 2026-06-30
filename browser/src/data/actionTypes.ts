// Thin TypeScript wrapper around action-types.yaml.
// Editing action type colors or labels: edit action-types.yaml,
// not this file.

import data from './action-types.yaml'

export type Iso639Code = 'eng' | 'fra'

export interface ActionTypeConfig {
  bg: string
  text: string
  labels?: Partial<Record<Iso639Code, string>>
}

export const actionTypeColors = (data.actionTypeColors || {}) as Record<string, ActionTypeConfig>

/** Map an ISO 639-1 code (en/fr) to the canonical ISO 639-3 (eng/fra)
 *  used by action-types.yaml. Unknown codes fall back to English. */
export function toIso6393(lang: string | undefined | null): Iso639Code {
  if (lang === 'fr' || lang === 'fra') return 'fra'
  return 'eng'
}

/** Return the color set for an action type. Falls back to `_default`
 *  for unknown types. */
export function getActionColor(type: string): { bg: string; text: string } {
  const normalized = type.toLowerCase().trim()
  const cfg = actionTypeColors[normalized] || actionTypeColors._default
  return { bg: cfg.bg, text: cfg.text }
}

/** Return the localized display label for an action type. Falls back
 *  through: requested lang → English → the raw type string. */
export function getActionLabel(type: string, lang: string | undefined | null): string {
  const normalized = type.toLowerCase().trim()
  const cfg = actionTypeColors[normalized] || actionTypeColors._default
  const iso639_3 = toIso6393(lang)
  return cfg.labels?.[iso639_3] || cfg.labels?.eng || normalized
}
