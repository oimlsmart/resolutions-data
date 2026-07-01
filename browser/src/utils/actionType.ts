// Display helpers for action / consideration types.
//
// Delegates to the YAML-backed action-types registry so the label
// table is data-driven (single source of truth). The legacy
// snake_case → Title-Case fallback remains for any type the YAML
// hasn't registered yet.

import { getActionLabel } from '../data/actionTypes'
import { useI18n } from '../composables/useI18n'

export function formatActionType(type: string | undefined | null): string {
  if (!type) return ''
  // Inside <script setup>, useI18n().lang is reactive. For callers
  // outside of a Vue component context (build scripts), fall back to
  // English.
  try {
    const { lang } = useI18n()
    return getActionLabel(type, lang.value)
  } catch {
    return getActionLabel(type, 'en')
  }
}

/** Pure-English variant for non-Vue callers (build scripts, tests). */
export function formatActionTypeEn(type: string | undefined | null): string {
  if (!type) return ''
  return getActionLabel(type, 'en')
}
