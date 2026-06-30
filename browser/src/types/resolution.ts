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
  doi?: string
  title: string
  subject: string
  year: string
  venue: string
  source_file: string
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
}

export type MeetingBodyType = 'ciml' | 'conference'

export interface Meeting {
  source_file: string
  source_title: string
  meeting_date: string
  venue: string
  year: string
  body_type: MeetingBodyType
  resolution_count: number
  acclamation_count: number
}
