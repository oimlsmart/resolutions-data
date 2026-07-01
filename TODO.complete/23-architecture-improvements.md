# 23 — Architectural improvements (beyond the listed items)

A list of structural changes that would pay off across all future
features. None is urgent; each is independent.

## 1. Domain value objects

Today the codebase uses `string` for DOI, URN, AgendaItemId,
Iso639Code, Iso3166Code, IataCityCode. Typos slip through.

```ts
// browser/src/domain/branded.ts
export type Brand<T, B> = T & { readonly __brand: B }
export type Doi      = Brand<string, 'Doi'>
export type Urn      = Brand<string, 'Urn'>
export type AgendaItemId = Brand<string, 'AgendaItemId'>
export type Iso639Code = Brand<string, 'Iso639Code'>
export type Iso3166Code = Brand<string, 'Iso3166Code'>
export type IataCityCode = Brand<string, 'IataCityCode'>

// constructors validate at the boundary
export const asDoi = (s: string): Doi => {
  if (!/^10\.\d{4,9}\/.+$/.test(s)) throw new Error(`Invalid DOI: ${s}`)
  return s as Doi
}
```

Files: `browser/src/domain/`. Adoption incremental — start with Doi
and Urn on Resolution.

## 2. Enum registries via YAML

Today `ActionType`, `AdoptionKind`, `SubjectKind` are either
free-form strings or hard-coded unions. They should be data files:

```yaml
# browser/src/data/adoption-kinds.yaml
adoptionKinds:
  plenary:
    label: { eng: Plenary, fra: Plénière }
  acclamation:
    label: { eng: Acclamation, fra: Acclamation }
  ballot:
    label: { eng: Ballot, fra: Scrutin }
  ma:
    label: { eng: MA resolution, fra: Résolution MA }
```

TS wrapper:
```ts
export const adoptionKinds = (data.adoptionKinds) as Record<
  'plenary' | 'acclamation' | 'ballot' | 'ma',
  { label: { eng: string; fra: string } }
>
export type AdoptionKind = keyof typeof adoptionKinds
```

Replaces the current `is_acclamation: boolean` with
`adoption_kind: AdoptionKind`.

## 3. Resource abstraction

Today `useMeetings` and `useResolutions` are sibling composables
that both read the same JSON. They could share a `Resource` pattern:

```ts
// browser/src/composables/useResource.ts
export function useResource<T extends { id: string }>(
  url: string,
  options: { sortBy?: (a: T, b: T) => number } = {},
) {
  const items = ref<T[]>([])
  const isLoaded = ref(false)
  // ...fetch + cache + lookup helpers
  return { items, isLoaded, loadData, getById, where }
}
```

Then:
```ts
export const useResolutions = () => useResource<Resolution>('/data/resolutions.json')
export const useMeetings    = () => useResource<Meeting>('/data/meetings.json')
```

Removes ~80 lines of duplication.

## 4. Shared component library

Views duplicate rendering logic. Extract:

| Component | Used in |
|---|---|
| `<ActionChips :actions :lang>` | Home, MeetingDetail, ResolutionDetail |
| `<MeetingLinkBadge :sourceFile :lang>` | ResolutionDetail |
| `<UrnCopyBar :value :label>` | MeetingDetail, ResolutionDetail |
| `<ResolutionRow :resolution :lang>` | Home, MeetingDetail |
| `<BodyTypeBadge :bodyType :lang>` | MeetingDetail, Meetings |

Each component owns its styling + i18n; views compose them.

## 5. Build-time schema validation

Wire the edoxen validator into `npm run build`:

```js
// browser/scripts/build-data.mjs (extend)
import { validateYamlDir } from './lib/validate.mjs'

const errors = validateYamlDir(RESOLUTIONS_DIR, EDOXEN_SCHEMA_PATH)
if (errors.length) {
  console.error('Schema validation failed:')
  errors.forEach(e => console.error(`  ${e.file}: ${e.message}`))
  process.exit(1)
}
```

Catches regressions before they hit production.

## 6. YAML data mirror in TS

The browser imports YAML directly via vite-plugin-yaml. This means
the YAML is bundled into JS — editors don't see the data unless they
load the file. Alternative: build a typed TS module per data file at
build time:

```ts
// generated/action-types.ts
export const actionTypeColors = {
  _default: { bg: '#64748b', text: '#ffffff' },
  accepts: { bg: '#16a34a', text: '#ffffff' },
  // ...
} as const
```

Tradeoff: lose the editor YAML preview; gain type safety + smaller
bundle.

## 7. Performance: route-level code splitting for AsciiDoc

`ResolutionDetail.vue` imports `@asciidoctor/core` (782KB chunk).
Lazy-load only when the resolution has rich-text actions:

```ts
const asciidocify = computed(() => {
  if (!resolution.value?.actions?.some(a => a.message.includes('|'))) return null
  return lazy(() => import('@asciidoctor/core'))
})
```

Saves ~600KB on initial load for most resolutions.

## 8. Document the data flow

A single `ARCHITECTURE.md` at the repo root describing:
- The 7 layers (OCR → manifest → parser → YAML → build → JSON → browser)
- Which file owns what
- Where to add a new meeting / resolution / agenda / UI string
- How to run validation + tests

Today this knowledge is scattered across CLAUDE.md, TODO.work/,
TODO.cleanups/, TODO.complete/. One canonical doc would help.

## 9. Lint + format

Add ESLint + Prettier configs. Cheap; catches many bugs.

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@vue/eslint-config-typescript",
    "plugin:vue/vue3-recommended"
  ],
  "rules": {
    "no-console": "warn",
    "vue/multi-word-component-names": "off"
  }
}
```

`npm run lint` enforces on CI.

## 10.observability

Add a tiny telemetry helper that logs:
- Page view (route name + params)
- Language toggle
- Search query (no PII — just the term length and result count)
- PDF link clicks

For a documentation site this is overkill. Mention only because the
audit is supposed to be exhaustive.
