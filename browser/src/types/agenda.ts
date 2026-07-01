// agendaItems — a single meeting's agenda, scraped from the per-meeting
// mini-site (e.g. https://58ciml.oiml.org/ciml.html).
//
// Top-level items may be flat (e.g. "1. Opening remarks and roll call"),
// numbered with decimal sub-items (e.g. "11.1 Publication for approval by
// the CIML"), or have a multi-line description (line-broken in the
// source HTML; preserved verbatim).
//
// Sub-items are scoped by their parent number prefix (item 11.2 belongs
// under 11, not toplevel). The schema stores them in subItems[] on
// the parent — flat. Resolution agenda_item strings are matched
// against the canonical `number` (e.g. "11.2" → array.find { item =>
// item.number === '11.2' }).

export interface AgendaItem {
  /** Canonical number as printed on the agenda site, e.g. "11.2", "16.2". */
  number: string
  /** Description as printed on the agenda site (may be multi-line). */
  description: string
  /** Whether the description continues on a subsequent row in the
   *  source table; just a UI hint, callers don't need it. */
  has_addenda?: boolean
  /** Child agenda items like 11.1, 11.2 under parent 11. */
  sub_items: AgendaItem[]
}

export interface MeetingAgenda {
  /** Source-file slug (e.g. "ciml-58-resolutions"), without -en/-fr. */
  source_file: string
  /** Mini-site URL the agenda was scraped from (e.g.
   *  https://58ciml.oiml.org/ciml.html). */
  source_url: string
  items: AgendaItem[]
}
