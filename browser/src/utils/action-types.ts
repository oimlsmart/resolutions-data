import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

interface ActionTypeColor {
  bg: string
  text: string
}

const path = join(process.cwd(), 'src', 'data', 'action-types.yaml')
const raw = readFileSync(path, 'utf-8')
const parsed = parse(raw) as { actionTypeColors: Record<string, ActionTypeColor> }
const actionTypeColors = parsed.actionTypeColors ?? {}

const actionTypeLabels: Record<string, { en: string; fr: string }> = {
  accepts: { en: 'Accepts', fr: 'Accepte' },
  acknowledges: { en: 'Acknowledges', fr: 'Constate' },
  adopts: { en: 'Adopts', fr: 'Adopte' },
  agrees: { en: 'Agrees', fr: 'Conviendra' },
  appoints: { en: 'Appoints', fr: 'Nomme' },
  appreciates: { en: 'Appreciates', fr: 'Apprécie' },
  approves: { en: 'Approves', fr: 'Approuve' },
  asks: { en: 'Asks', fr: 'Demande' },
  assigns: { en: 'Assigns', fr: 'Attribue' },
  confirms: { en: 'Confirms', fr: 'Confirme' },
  considers: { en: 'Considers', fr: 'Considère' },
  decides: { en: 'Decides', fr: 'Décide' },
  directs: { en: 'Directs', fr: 'Charge' },
  disbands: { en: 'Disbands', fr: 'Dissout' },
  encourages: { en: 'Encourages', fr: 'Encourage' },
  endorses: { en: 'Endorses', fr: 'Soutient' },
  establishes: { en: 'Establishes', fr: 'Établit' },
  instructs: { en: 'Instructs', fr: 'Informe' },
  nominates: { en: 'Nominates', fr: 'Désigne' },
  notes: { en: 'Notes', fr: 'Prend note' },
  recognises: { en: 'Recognises', fr: 'Reconnaît' },
  recognizes: { en: 'Recognizes', fr: 'Reconnaît' },
  recommends: { en: 'Recommends', fr: 'Recommande' },
  replaces: { en: 'Replaces', fr: 'Remplace' },
  requests: { en: 'Requests', fr: 'Demande' },
  resolves: { en: 'Resolves', fr: 'Décide' },
  supports: { en: 'Supports', fr: 'Soutient' },
  thanks: { en: 'Thanks', fr: 'Remercie' },
  welcomes: { en: 'Welcomes', fr: 'Salue' },
  withdraws: { en: 'Withdraws', fr: 'Retire' },
}

export function getActionColor(type: string): ActionTypeColor {
  return actionTypeColors[type] ?? actionTypeColors._default ?? { bg: '#64748b', text: '#ffffff' }
}

export function formatActionType(type: string, lang: string): string {
  const entry = actionTypeLabels[type]
  if (!entry) return type
  return lang === 'fr' ? entry.fr : entry.en
}

export function listActionTypes(): string[] {
  return Object.keys(actionTypeLabels).sort()
}
