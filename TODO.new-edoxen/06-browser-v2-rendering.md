# 06 — Browser rendering updates for v2 edoxen data

## Goal
Update the browser to render v2 edoxen Decision/Localization data
cleanly without redundant or awkward display.

## Done in this PR

### Title display cleanup
- `ResolutionDetail.vue` adds a `displayTitle` computed that strips
  the `"Agenda Item N: "` prefix from titles when an agenda badge is
  already shown next to the title. The title in the data layer still
  carries the full prefix (for search/SSG), but the user sees only
  the substantive part.

  Before: `<h1>Agenda Item 9: Other business</h1>` + badge `Agenda item 9`
  After:  `<h1>Other business</h1>` + badge `Agenda item 9`

### DC meeting type
- `Meetings.vue` shows a third filter chip + third body section for DC
- DC color tokens (amber) for badge + timeline node + section border
- EN/FR labels in `translations.yaml`

### Language availability badge
- Per-meeting `languages: string[]` field in meetings.json (CIML/Conf/DC)
- Timeline entry shows EN / FR / EN+FR badge with tooltip

### Agenda item deeplink with parent fallback
- `ResolutionDetail.vue` walks the agenda-item label hierarchy
  ("14.2" → "14" → "") until it finds a label that exists on the
  target meeting page. Badge text shows the fallback explicitly.

## Deferred

### Native v2 localization rendering
Currently `transforms.mjs` flattens v2 `localizations[]` into one
record per language. The UI then toggles between them via the
EN/FR/both switch. A more v2-native approach would keep a single
decision record per identifier and have the Vue component iterate
`localizations[]` directly. This is a larger refactor of the data
model and several components — better as a standalone PR.

### DecisionDate type-aware rendering
V2 `DecisionDate` carries a `type` (decided, effective, drafted,
proposed, …). The UI currently shows just the date. Surfacing the
type (e.g. "Decided: 2025-10-13") would improve clarity for
multi-event decisions.

## Done criteria
- [x] Title display strips "Agenda Item N:" when badge is shown
- [x] DC filter chip + body section renders
- [x] Language availability badge on meetings page
- [x] Agenda item deeplink resolves to parent
- [ ] Native localization-aware rendering (future)
- [ ] DecisionDate type labels (future)
