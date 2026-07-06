import { computed, ref, onMounted, type ComputedRef, type Ref } from 'vue'
import { useResolutions } from './useResolutions'
import type { Meeting, MeetingBodyType } from '../types/resolution'

export type { Meeting, MeetingBodyType }

/** Derive the OIML body (CIML vs Conference) from a canonical meeting slug. */
export function bodyTypeFromSlug(slug: string): MeetingBodyType {
  return slug.startsWith('conference-') ? 'conference' : 'ciml'
}

export interface DecadeGroup {
  label: string
  resCount: number
  accCount: number
  meetings: Meeting[]
}

// Module-level store so all callers of useMeetings() share the same
// meetings list. Without this, every component that calls
// useMeetings() would get its own empty ref and the SSG-rendered
// meetings page would always show "0 meetings".
const meetings = ref<Meeting[]>([]) as Ref<Meeting[]>
let meetingsLoaded = false

export function groupMeetingsByDecade(meetings: Meeting[]): DecadeGroup[] {
  const decades: Record<string, { meetings: Meeting[]; resCount: number; accCount: number }> = {}

  meetings.forEach(m => {
    const year = parseInt(m.year)
    if (isNaN(year)) return
    const decade = Math.floor(year / 10) * 10 + 's'
    if (!decades[decade]) {
      decades[decade] = { meetings: [], resCount: 0, accCount: 0 }
    }
    decades[decade].meetings.push(m)
    decades[decade].resCount += (m.resolution_count || 0)
    decades[decade].accCount += (m.acclamation_count || 0)
  })

  return Object.keys(decades)
    .sort((a, b) => b.localeCompare(a))
    .map(key => ({
      label: key,
      resCount: decades[key].resCount,
      accCount: decades[key].accCount,
      meetings: decades[key].meetings.sort((a, b) => b.year.localeCompare(a.year))
    }))
}

export function useMeetings() {
  const { resolutions, isLoaded, loadData } = useResolutions()

  async function loadMeetings() {
    if (meetingsLoaded) return
    meetingsLoaded = true
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/meetings.json?t=${Date.now()}`)
      if (res.ok) meetings.value = await res.json()
    } catch (e) {
      console.error('Failed to load meetings.json', e)
    }
  }

  // SSR / SSG entry hook: pre-populate the meetings store from a
  // server-side file read so the rendered HTML includes the meetings
  // list (otherwise SSG emits "0 meetings" / empty-state).
  function setMeetings(data: Meeting[]) {
    meetings.value = data
    meetingsLoaded = true
  }

  const allMeetings: ComputedRef<Meeting[]> = computed(() => meetings.value)

  const getMeeting = (slug: string): Meeting | undefined =>
    allMeetings.value.find(m => m.meeting_slug === slug)

  // Resolutions belonging to a meeting: filter by meeting_slug (the
  // canonical identifier emitted by build-data.mjs). Collapse EN+FR
  // duplicates of the same canonical identifier into a single entry so
  // the meeting page doesn't show two cards for CIML/2007/9.1 (one
  // from ciml-42-decisions-en, one from ciml-42-decisions-fr). The
  // preferred language wins (falls back to whatever is available).
  const getMeetingResolutions = (slug: string, preferredLang: 'en' | 'fr' = 'en') => {
    const byKey = new Map<string, typeof resolutions.value[number]>()
    for (const r of resolutions.value) {
      if (r.meeting_slug !== slug) continue
      const key = r.identifier || r.id
      const prev = byKey.get(key)
      if (!prev) {
        byKey.set(key, r)
        continue
      }
      // Prefer the record matching preferredLang; otherwise keep what's
      // already there.
      if (prev.language !== preferredLang && r.language === preferredLang) {
        byKey.set(key, r)
      }
    }
    return Array.from(byKey.values())
  }

  onMounted(() => {
    loadMeetings()
  })

  return {
    isLoaded,
    loadData,
    meetings: allMeetings,
    getMeeting,
    getMeetingResolutions,
    setMeetings,
  }
}
