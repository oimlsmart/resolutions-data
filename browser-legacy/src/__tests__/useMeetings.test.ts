import { describe, it, expect } from 'vitest'
import { bodyTypeFromSlug, groupMeetingsByDecade, type Meeting } from '../composables/useMeetings'

// ---------------------------------------------------------------------------
// bodyTypeFromSlug
// ---------------------------------------------------------------------------

describe('bodyTypeFromSlug', () => {
  it('identifies CIML meetings', () => {
    expect(bodyTypeFromSlug('ciml-44')).toBe('ciml')
    expect(bodyTypeFromSlug('ciml-15')).toBe('ciml')
  })

  it('identifies Conference meetings', () => {
    expect(bodyTypeFromSlug('conference-13')).toBe('conference')
    expect(bodyTypeFromSlug('conference-17')).toBe('conference')
  })
})

// ---------------------------------------------------------------------------
// groupMeetingsByDecade
// ---------------------------------------------------------------------------

function mkMeeting(year: string, slug: string, resCount = 0): Meeting {
  return {
    meeting_slug: slug,
    source_files: [],
    source_title: '',
    meeting_date: `${year}-10-01`,
    venue: '',
    city: '',
    country_code: '',
    year,
    body_type: 'ciml',
    language: 'en',
    doi: '',
    resolution_count: resCount,
    acclamation_count: 0,
    urn: '',
  }
}

describe('groupMeetingsByDecade', () => {
  it('groups meetings by decade', () => {
    const meetings = [
      mkMeeting('2024', 'ciml-60', 44),
      mkMeeting('2023', 'ciml-59', 36),
      mkMeeting('2019', 'ciml-54', 37),
      mkMeeting('2009', 'ciml-44', 27),
    ]
    const decades = groupMeetingsByDecade(meetings)
    expect(decades).toHaveLength(3)
    expect(decades[0].label).toBe('2020s')
    expect(decades[1].label).toBe('2010s')
    expect(decades[2].label).toBe('2000s')
  })

  it('sums resolution counts per decade', () => {
    const meetings = [
      mkMeeting('2024', 'a', 44),
      mkMeeting('2023', 'b', 36),
      mkMeeting('2019', 'c', 37),
    ]
    const decades = groupMeetingsByDecade(meetings)
    expect(decades[0].resCount).toBe(80) // 44 + 36
    expect(decades[1].resCount).toBe(37)
  })

  it('sorts decades most-recent first', () => {
    const meetings = [
      mkMeeting('1990', 'old'),
      mkMeeting('2020', 'new'),
      mkMeeting('2000', 'mid'),
    ]
    const decades = groupMeetingsByDecade(meetings)
    expect(decades[0].label).toBe('2020s')
    expect(decades[1].label).toBe('2000s')
    expect(decades[2].label).toBe('1990s')
  })

  it('sorts meetings within decade by year descending', () => {
    const meetings = [
      mkMeeting('2009', 'ciml-44'),
      mkMeeting('2004', 'ciml-39'),
      mkMeeting('2007', 'ciml-42'),
    ]
    const decades = groupMeetingsByDecade(meetings)
    expect(decades[0].meetings[0].year).toBe('2009')
    expect(decades[0].meetings[1].year).toBe('2007')
    expect(decades[0].meetings[2].year).toBe('2004')
  })

  it('skips meetings with non-numeric year', () => {
    const meetings = [
      mkMeeting('2024', 'a'),
      mkMeeting('', 'skeleton'),
    ]
    const decades = groupMeetingsByDecade(meetings)
    // Only the 2024 meeting should be grouped; the empty-year skeleton is skipped.
    expect(decades).toHaveLength(1)
    expect(decades[0].meetings).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    expect(groupMeetingsByDecade([])).toEqual([])
  })
})
