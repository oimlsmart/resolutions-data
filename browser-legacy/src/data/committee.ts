// Thin TypeScript wrapper around committee.yaml.
// Editing OIML facts: edit committee.yaml, not this file.

import committeeData from './committee.yaml'

export const committee = committeeData as {
  name: string
  title: string
  tagline: string
  scope: string
  secretariat: string
  chair: string
  established: number
  memberStates: number
  correspondingMembers: number
  links: Record<string, string>
}

export type Committee = typeof committee
