// Thin TypeScript wrapper around countries.yaml.
// Editing country names: edit countries.yaml, not this file.

import countriesData from './countries.yaml'

export type CountryNames = { en: string; fr: string }
export const COUNTRIES: Record<string, CountryNames> = countriesData.countries || {}
