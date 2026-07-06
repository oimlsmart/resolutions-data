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

export interface Resolution {
  id: string
  identifier?: string
  language?: '' | 'en' | 'fr'
  doi?: string
  city?: string
  country_code?: string
  title: string
  subject: string
  year: string
  venue: string
  source_file: string
  meeting_slug: string
  source_title: string
  source_type?: string
  group_id?: string
  meeting_date: string
  is_acclamation: boolean
  actions: Action[]
  considerations: Consideration[]
  approvals: Approval[]
  categories?: string[]
  dates: any[]
  snippet: string
  urn?: string
  meeting_urn?: string
  agenda_item?: string
  agenda_item_urn?: string
}

export type MeetingBodyType = 'ciml' | 'conference'

export interface MeetingLocalization {
  language_code: string
  script?: string
  title: string
  general_area?: string
}

export interface MeetingMinutesRef {
  urn: string
  language_code: string
}

export interface Meeting {
  // Canonical slug derived from the meeting URN — the URL identifier
  // (e.g. "ciml-15", "conference-13"). Replaces the legacy source_file
  // as the routing key.
  meeting_slug: string
  // All resolution source PDFs that contributed to this meeting
  // (e.g. ["ciml-43-en", "ciml-43-fr"]).
  source_files: string[]
  source_title: string
  meeting_date: string
  venue: string
  city: string
  country_code: string
  year: string
  body_type: MeetingBodyType
  language: '' | 'en' | 'fr'
  doi: string
  resolution_count: number
  acclamation_count: number
  urn: string
  virtual?: boolean
  committee?: string
  localizations?: MeetingLocalization[]
  minutes?: MeetingMinutesRef[]
  agenda_items?: AgendaItem[]
}

export interface AgendaItem {
  label: string
  kind: string
  title: string
  outcome: string
  urn?: string
}
