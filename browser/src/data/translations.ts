// Thin TypeScript wrapper around translations.yaml.
// Editing translations: edit translations.yaml, not this file.

import translationsData from './translations.yaml'

export type Language = 'en' | 'fr'
export type TranslationKey = string

export const translations: Record<string, { en: string; fr: string }> =
  translationsData.translations || {}

// Helper to interpolate {placeholder} strings.
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}
