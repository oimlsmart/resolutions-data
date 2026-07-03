import { computed, onMounted, ref, type ComputedRef, type Ref } from 'vue'
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

  // The canonical meetings list is loaded from /data/meetings.json so
  // that meetings with zero resolutions (skeleton-only, e.g. CIML 4-14
  // for which we have no Bulletin scans) still appear in the listing.
  // The source of truth is meetings/*.yaml, not the resolution
  // collection.
  const meetings = ref<Meeting[]>([]) as Ref<Meeting[]>
  let meetingsLoaded = false

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

  const allMeetings: ComputedRef<Meeting[]> = computed(() => meetings.value)

  const getMeeting = (slug: string): Meeting | undefined =>
    allMeetings.value.find(m => m.meeting_slug === slug)

  // Resolutions belonging to a meeting: filter by meeting_slug (the
  // canonical identifier emitted by build-data.mjs).
  const getMeetingResolutions = (slug: string) =>
    resolutions.value.filter(r => r.meeting_slug === slug)

  onMounted(() => {
    loadMeetings()
  })

  return {
    isLoaded,
    loadData,
    meetings: allMeetings,
    getMeeting,
    getMeetingResolutions,
  }
}
