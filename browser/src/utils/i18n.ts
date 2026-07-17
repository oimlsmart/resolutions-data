import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

type Lang = 'en' | 'fr'

const translationsPath = join(process.cwd(), 'src', 'data', 'translations.yaml')
const raw = readFileSync(translationsPath, 'utf-8')
const parsed = parse(raw) as { translations?: Record<string, { en: string; fr: string }> }
const translations = parsed.translations ?? {}

export function t(lang: string, key: string, vars?: Record<string, string | number>): string {
  const entry = translations[key]
  if (!entry) return key
  let value = entry[lang as Lang] ?? entry.en ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return value
}

export function tObj(lang: string) {
  return (key: string, vars?: Record<string, string | number>) => t(lang, key, vars)
}
