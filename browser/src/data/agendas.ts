// Bilingual-free helpers around the per-meeting agenda table.
//
// The agenda is stored as an array of items keyed by canonical meeting
// slug (no -en/-fr suffix). Each item has a `number` field that matches
// the agenda_item string on a resolution. Lookups are O(items) —
// fine for the 20–80 item range seen on real agendas.

import data from './agendas.yaml'
import type { AgendaItem, MeetingAgenda } from '../types/agenda'

const AGENDAS: MeetingAgenda[] = (data.agendas as MeetingAgenda[]) || []

export function getAgenda(sourceFile: string): MeetingAgenda | undefined {
  return AGENDAS.find(a => a.source_file === sourceFile)
}

/**
 * Find an agenda item by its canonical number on a meeting's agenda.
 * Searches the top-level items first, then dives into each item's
 * sub_items (matching against the full dotted number "11.2", "16.2").
 */
export function findAgendaItem(
  sourceFile: string,
  number: string,
): AgendaItem | undefined {
  const agenda = getAgenda(sourceFile)
  if (!agenda) return undefined
  return walk(agenda.items, number)
}

function walk(items: AgendaItem[], target: string): AgendaItem | undefined {
  for (const item of items) {
    if (item.number === target) return item
    if (item.sub_items && item.sub_items.length) {
      const found = walk(item.sub_items, target)
      if (found) return found
    }
  }
  return undefined
}
