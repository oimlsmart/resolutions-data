/**
 * URN construction for OIML archive resources.
 *
 * OIML manages its own URN namespace for CIML and Conference resolutions:
 *   urn:oiml:{ciml|conference}:resolution:{id}
 *   urn:oiml:{ciml|conference}:meeting:{source_file}
 */

const URN_BASE = 'urn:oiml'

export function buildResolutionUrn(id: string): string {
  return `${URN_BASE}:resolution:${id}`
}

export function buildMeetingUrn(sourceFile: string): string {
  return `${URN_BASE}:meeting:${sourceFile}`
}
