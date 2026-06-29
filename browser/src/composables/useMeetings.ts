import { computed, type ComputedRef } from 'vue'
import { useResolutions } from './useResolutions'
import type { Meeting } from '../types/resolution'

export type { Meeting }

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

  const meetings: ComputedRef<Meeting[]> = computed(() => {
    if (!resolutions.value.length) return []

    const map = new Map<string, Meeting>()

    resolutions.value.forEach(res => {
      const file = res.source_file
      if (!map.has(file)) {
        map.set(file, {
          source_file: file,
          source_title: res.source_title || 'Unknown Meeting',
          meeting_date: res.meeting_date,
          venue: res.venue,
          year: res.year,
          resolution_count: 0,
          acclamation_count: 0
        })
      }
      const m = map.get(file)!
      m.resolution_count++
      if (res.is_acclamation) {
        m.acclamation_count++
      }
    })

    const list = Array.from(map.values())
    // Sort by meeting date descending
    list.sort((a, b) => {
      if (a.meeting_date === b.meeting_date) return 0
      return a.meeting_date > b.meeting_date ? -1 : 1
    })

    return list
  })

  const getMeeting = (sourceFile: string): Meeting | undefined => {
    return meetings.value.find(m => m.source_file === sourceFile)
  }

  const getMeetingResolutions = (sourceFile: string) => {
    return resolutions.value.filter(r => r.source_file === sourceFile)
  }

  return {
    isLoaded,
    loadData,
    meetings,
    getMeeting,
    getMeetingResolutions
  }
}
