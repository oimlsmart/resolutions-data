// src/data/committee.ts
// SINGLE SOURCE OF TRUTH for OIML metadata not derivable from resolution data.

export const committee = {
  // Identity
  name: 'OIML',
  title: 'International Organization of Legal Metrology',
  tagline: 'Resolutions of the CIML and the OIML Conference',
  scope: 'Legal metrology — the practice and science of measurement that affects trade, health, safety, and the environment.',

  // Organization facts (from oiml.org as of 2025-06)
  // Member States: https://www.oiml.org/en/structure/members/memberslist_view?varMember=1
  // Corresponding Members: https://www.oiml.org/en/structure/members/memberslist_view?varCorresponding=1
  secretariat: 'BIML — Paris, France',
  chair: 'CIML President',
  established: 1955,
  memberStates: 63,
  correspondingMembers: 66,

  // External links
  links: {
    iso: 'https://www.iso.org',
    isoCommittee: 'https://www.iso.org/committee/54158.html',
    committeeSite: 'https://www.oiml.org/members',
    linkedin: 'https://www.linkedin.com/company/organisation-internationale-de-métrologie-légale',
    oiml: 'https://www.oiml.org',
    ciml: 'https://www.oiml.org/en/structure/ciml/sites',
    conference: 'https://www.oiml.org/en/structure/conference/sites',
    bulletin: 'https://www.oiml.org/en/publications/oiml-bulletin',
    github: 'https://github.com/oimlsmart',
  },
} as const

export type Committee = typeof committee
