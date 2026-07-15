// Thin TypeScript wrapper around action-types.yaml.
//
// Editing labels or colors: edit action-types.yaml, not this file.

import data from './action-types.yaml'
import type { Language } from './translations'

type Labels = Record<string, { en: string; fr: string }>

export const actionTypeColors: Record<string, { bg: string; text: string }> =
  data.actionTypeColors || {}

export const actionTypeLabels: Labels = data.actionTypeLabels || {}

export function getActionColor(type: string): { bg: string; text: string } {
  const normalized = type.toLowerCase().trim()
  return actionTypeColors[normalized] || actionTypeColors._default
}

/** Format an action / consideration semantic type for display in the
 *  active UI language. Falls back to a Title-Case rendering of the
 *  snake_case identifier when no translation exists. */
export function formatActionType(
  type: string | null | undefined,
  lang: Language = 'en',
): string {
  if (!type) return ''
  const entry = actionTypeLabels[type]
  if (entry) return entry[lang] ?? entry.en
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
