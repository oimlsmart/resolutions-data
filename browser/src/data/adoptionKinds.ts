// Thin TypeScript wrapper around adoption-kinds.yaml.
//
// Replaces the legacy `is_acclamation: boolean` field on Resolution
// with a richer `adoption_kind: AdoptionKind` enum. Each kind carries
// a per-language label (ISO 639-3 keyed) and an optional
// `identifier_pattern` that the build pipeline uses to derive the
// kind from the resolution identifier.

import data from './adoption-kinds.yaml'

export type Iso639Code = 'eng' | 'fra'

export interface AdoptionKindConfig {
  id: string
  label: Partial<Record<Iso639Code, string>>
  description?: Partial<Record<Iso639Code, string>>
  /** Substring (or regex source) that, when present in the resolution
   *  identifier, marks the row as this kind. Used by the build pipeline
   *  to derive the kind from the identifier. */
  identifier_pattern?: string
}

export const adoptionKinds = (data.adoptionKinds || {}) as Record<
  'plenary' | 'acclamation' | 'ballot' | 'ma',
  AdoptionKindConfig
>

export type AdoptionKind = keyof typeof adoptionKinds

/** Default kind for resolutions without a recognizable identifier
 *  pattern. Plenary is the catch-all for everything that's not
 *  explicitly acclamation, ballot, or MA. */
export const DEFAULT_ADOPTION_KIND: AdoptionKind = 'plenary'

/** Map an ISO 639-1 code (en/fr) to the canonical ISO 639-3 used by
 *  the YAML registry. */
export function toIso6393(lang: string | undefined | null): Iso639Code {
  return lang === 'fr' ? 'fra' : 'eng'
}

/** Return the localized label for an adoption kind. Falls back through
 *  requested lang → English → raw kind id. */
export function getAdoptionKindLabel(
  kind: string | undefined | null,
  lang: string | undefined | null,
): string {
  if (!kind) return ''
  const cfg = adoptionKinds[kind as AdoptionKind]
  if (!cfg) return kind
  const iso = toIso6393(lang)
  return cfg.label[iso] || cfg.label.eng || kind
}

/** Derive the adoption kind from a resolution identifier by matching
 *  against the `identifier_pattern` declared on each kind. Returns
 *  the default kind when no pattern matches. */
export function deriveAdoptionKind(identifier: string | undefined | null): AdoptionKind {
  if (!identifier) return DEFAULT_ADOPTION_KIND
  for (const key of Object.keys(adoptionKinds) as AdoptionKind[]) {
    const pattern = adoptionKinds[key].identifier_pattern
    if (pattern && identifier.includes(pattern)) return key
  }
  return DEFAULT_ADOPTION_KIND
}

/** Convenience for the legacy `is_acclamation: boolean` callers —
 *  returns true when the kind is acclamation. Prefer comparing the
 *  kind enum directly in new code. */
export function isAcclamation(kind: string | undefined | null): boolean {
  return kind === 'acclamation'
}
