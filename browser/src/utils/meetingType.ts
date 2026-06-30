// Shared utility: derive the OIML body type from a source_file slug.
// Pure function — no Vue/reactivity dependencies, safe to import from
// data/*.ts wrappers and from composables.
import type { MeetingBodyType } from '../types/resolution'

export function bodyTypeFromSourceFile(sourceFile: string): MeetingBodyType {
  return sourceFile.startsWith('conference-') ? 'conference' : 'ciml'
}
