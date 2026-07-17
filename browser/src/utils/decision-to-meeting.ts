import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

interface CollectionFile {
  readonly metadata?: { meeting_urn?: string }
  readonly decisions?: readonly { urn?: string }[]
}

const DECISIONS_DIR = join(process.cwd(), '..', 'resolutions')
let cache: Map<string, string> | null = null

export async function meetingUrnByDecisionUrn(): Promise<Map<string, string>> {
  if (cache) return cache
  const files = await readdir(DECISIONS_DIR)
  const yamls = files.filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
  const map = new Map<string, string>()
  for (const f of yamls) {
    const raw = await readFile(join(DECISIONS_DIR, f), 'utf-8')
    const data = parse(raw) as CollectionFile
    const meetingUrn = data?.metadata?.meeting_urn
    if (!meetingUrn || !data?.decisions) continue
    for (const d of data.decisions) {
      if (d?.urn) map.set(d.urn, meetingUrn)
    }
  }
  cache = map
  return map
}

export async function loadMeetingForDecision(decisionUrn: string): Promise<any | null> {
  const map = await meetingUrnByDecisionUrn()
  const meetingUrn = map.get(decisionUrn)
  if (!meetingUrn) return null
  const { loadMeetings } = await import('./meetings.js')
  const meetings = await loadMeetings()
  return meetings.find((m: any) => m.urn === meetingUrn) ?? null
}
