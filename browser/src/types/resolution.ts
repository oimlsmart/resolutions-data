/**
 * Domain model for the OIML resolutions archive.
 *
 * These interfaces describe the Edoxen resolution format as loaded by the
 * browser SPA. They are free-standing (no runtime imports) so that any
 * module — composable, view, or build script — can reference the domain
 * model without dragging in FlexSearch, Vue, or fetch machinery.
 *
 * The shape mirrors the JSON emitted by scripts/build-data.mjs.
 */

export interface Action {
  type: string
  subject?: string
  message: string
  dates?: any[]
}

export interface Consideration {
  type: string
  message: string
  dates?: any[]
}

export interface Approval {
  type: string
  degree: string
  message?: string
}

export type MeetingBodyType = 'ciml' | 'conference'

export interface Meeting {
  source_file: string
  source_title: string
  meeting_date: string
  /** ISO 8601 inclusive start day, derived from the Edoxen metadata.date. */
  date_start?: string
  /** ISO 8601 inclusive end day. Empty when the meeting is a single-day session. */
  date_end?: string
  /** IATA city code (3 letters) when the manifest entry uses the code
   *  instead of the raw English city name. Empty otherwise. */
  city: string
  city_code?: string
  country_code: string
  year: string
  body_type: MeetingBodyType
  language: '' | 'en' | 'fr'
  doi: string
  /** Canonical OIML URL for the source PDF. Empty when not yet listed
   *  in scripts/manifest.yaml. */
  source_url?: string
  resolution_count: number
  acclamation_count: number
}

export interface Resolution {
  id: string
  identifier?: string
  language?: '' | 'en' | 'fr'
  doi?: string
  city?: string
  city_code?: string
  country_code?: string
  title: string
  subject: string
  year: string
  source_file: string
  source_title: string
  source_type?: string
  group_id?: string
  meeting_date: string
  /** ISO 8601 meeting end day. Empty when single-day. */
  meeting_date_end?: string
  agenda_item?: string
  /** Canonical OIML URL for the source PDF containing this resolution. */
  source_url?: string
  /** How the resolution was formally adopted. Replaces the legacy
   *  `is_acclamation: boolean` field with a richer enum that also
   *  covers ballot / MA resolution kinds. See AdoptionKind in
   *  data/adoptionKinds.ts for the canonical list. */
  adoption_kind?: string
  /** @deprecated use adoption_kind === 'acclamation' instead.
   *  Kept for backwards compatibility with call sites that haven't
   *  migrated yet; always derivable from adoption_kind. */
  is_acclamation: boolean
  actions: Action[]
  considerations: Consideration[]
  approvals: Approval[]
  categories?: string[]
  dates: any[]
  /** Edoxen ResolutionType: resolution / recommendation / decision / declaration. */
  type?: string
  snippet: string
  urn?: string
  meeting_urn?: string
}
