/**
 * URN construction for OIML archive resources.
 *
 * OIML manages its own URN namespace for CIML and Conference resolutions:
 *   urn:oiml:{ciml|conference}:resolution:{id}
 *   urn:oiml:{ciml|conference}:meeting:{slug}
 *
 * Meeting URNs are sourced directly from meetings/*.yaml via the JSON
 * build pipeline (see browser/scripts/build-data.mjs) — there is no
 * client-side URN construction for meetings.
 */

const URN_BASE = 'urn:oiml'

export function buildResolutionUrn(id: string): string {
  return `${URN_BASE}:resolution:${id}`
}
