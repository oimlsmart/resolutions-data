import { computed, type ComputedRef } from 'vue'
import { useResolutions } from './useResolutions'
import type { Meeting, MeetingBodyType } from '../types/resolution'

export type { Meeting, MeetingBodyType }

/** Derive the OIML body (CIML vs Conference) from a source-file slug. */
export function bodyTypeFromSourceFile(sourceFile: string): MeetingBodyType {
  return sourceFile.startsWith('conference-') ? 'conference' : 'ciml'
}

/** Strip the language suffix from a source-file slug so that
 *  ciml-44-resolutions-en and ciml-44-resolutions-fr collapse to the same
 *  canonical meeting ID (ciml-44-resolutions). */
export function canonicalMeetingId(sourceFile: string): string {
  return sourceFile.replace(/-(en|fr)$/, '')
}

/** Derive the language tag from the source-file slug suffix. */
export function languageFromSourceFile(sourceFile: string): '' | 'en' | 'fr' {
  if (/-en$/.test(sourceFile)) return 'en'
  if (/-fr$/.test(sourceFile)) return 'fr'
  return ''
}

/** Compute the DOI for a meeting from its slug (mirrors transforms.mjs). */
export function doiFromSourceFile(sourceFile: string): string {
  const m = sourceFile.match(/^(?:ciml|conference)-(\d+)/)
  if (!m) return ''
  const prefix = sourceFile.startsWith('conference-') ? 'conf' : 'ciml'
  return `10.63493/meetings/${prefix}${m[1]}`
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

  const meetings: ComputedRef<Meeting[]> = computed(() => {
    if (!resolutions.value.length) return []

    // Group by canonical meeting ID so EN and FR versions of the same
    // meeting collapse to a single entry. The primary source_file is the
    // version matching the current UI language (fall back to EN, then to
    // whichever appears first). Languages array tracks all available.
    const groups = new Map<string, {
      primary: Meeting
      languages: Array<'en' | 'fr'>
      source_files: string[]
      resolution_count: number
      acclamation_count: number
    }>()

    resolutions.value.forEach(res => {
      const file = res.source_file
      const canonical = canonicalMeetingId(file)
      if (!groups.has(canonical)) {
        groups.set(canonical, {
          primary: {
            source_file: file,
            source_title: res.source_title || 'Unknown Meeting',
            meeting_date: res.meeting_date,
            venue: res.venue,
            year: res.year,
            body_type: bodyTypeFromSourceFile(file),
            language: languageFromSourceFile(file),
            doi: doiFromSourceFile(file),
            resolution_count: 0,
            acclamation_count: 0,
          },
          languages: [],
          source_files: [],
          resolution_count: 0,
          acclamation_count: 0,
        })
      }
      const g = groups.get(canonical)!
      g.resolution_count++
      if (res.is_acclamation) g.acclamation_count++
      const lang = languageFromSourceFile(file)
      if (lang && !g.languages.includes(lang)) g.languages.push(lang)
      if (!g.source_files.includes(file)) g.source_files.push(file)
    })

    // Pick a primary source_file based on UI language; expose languages[].
    const list: Meeting[] = []
    groups.forEach((g) => {
      const uiLang = (typeof localStorage !== 'undefined' && localStorage.getItem('oiml-lang')) || 'en'
      const preferred = g.source_files.find(f => f.endsWith('-' + uiLang)) || g.source_files[0]
      // Re-derive the language tag from the chosen primary file.
      const primaryLang = languageFromSourceFile(preferred)
      list.push({
        ...g.primary,
        source_file: preferred,
        language: primaryLang,
        resolution_count: g.resolution_count,
        acclamation_count: g.acclamation_count,
        // Sneak the available-languages list through via a TS cast; Meeting
        // doesn't have an explicit field for it, but views can re-derive.
      } as Meeting)
    })

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
