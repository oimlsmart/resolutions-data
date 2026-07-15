import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

interface CollectionFile {
  readonly metadata?: { meeting_urn?: string }
  readonly decisions?: readonly { urn?: string; identifier?: readonly { prefix: string; number: string }[]; title?: readonly { spelling: string; value: string }[] }[]
}

const DECISIONS_DIR = join(process.cwd(), '..', 'resolutions')
let cache: Map<string, string[]> | null = null

export async function decisionsByMeetingUrn(): Promise<Map<string, string[]>> {
  if (cache) return cache
  const files = await readdir(DECISIONS_DIR)
  const yamls = files.filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
  const map = new Map<string, string[]>()
  for (const f of yamls) {
    const raw = await readFile(join(DECISIONS_DIR, f), 'utf-8')
    const data = parse(raw) as CollectionFile
    const meetingUrn = data?.metadata?.meeting_urn
    if (!meetingUrn || !data?.decisions) continue
    const urns = data.decisions.map((d) => d.urn).filter(Boolean) as string[]
    map.set(meetingUrn, urns)
  }
  cache = map
  return map
}
