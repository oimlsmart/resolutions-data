// Thin TypeScript wrapper around action-types.yaml.
// Editing colors: edit action-types.yaml, not this file.

import data from './action-types.yaml'

export const actionTypeColors: Record<string, { bg: string; text: string }> =
  data.actionTypeColors || {}

export function getActionColor(type: string): { bg: string; text: string } {
  const normalized = type.toLowerCase().trim()
  return actionTypeColors[normalized] || actionTypeColors._default
}
