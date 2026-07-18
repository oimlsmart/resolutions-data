import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

interface MeetingFile {
  readonly urn: string
  readonly identifier: readonly { prefix: string; number: string }[]
  readonly title: readonly { spelling: string; value: string }[]
  readonly scheduled_date_range?: { start?: string; end?: string }
  readonly city?: string
  readonly country_code?: string
  readonly body_type?: string
  readonly status?: string
  readonly committee?: string
  readonly agenda?: {
    items?: readonly {
      urn?: string
      label: string
      title?: readonly { spelling: string; value: string }[]
      kind?: string
      outcome?: string
    }[]
  }
}

const MEETINGS_DIR = join(process.cwd(), '..', 'edoxen-data', 'meetings')

let cache: MeetingFile[] | null = null

export async function loadMeetings(): Promise<MeetingFile[]> {
  if (cache) return cache
  const files = await readdir(MEETINGS_DIR)
  const yamls = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
  const out: MeetingFile[] = []
  for (const f of yamls) {
    const raw = await readFile(join(MEETINGS_DIR, f), 'utf-8')
    const data = parse(raw) as MeetingFile
    if (data && data.urn) out.push(data)
  }
  cache = out.sort((a, b) => (b.scheduled_date_range?.start ?? '').localeCompare(a.scheduled_date_range?.start ?? ''))
  return out
}
