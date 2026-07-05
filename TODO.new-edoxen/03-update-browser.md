# 03 — Update browser for new edoxen-model format

## Goal
Update the browser data pipeline (`build-data.mjs`) and Vue components
to consume the new edoxen-model meeting format (embedded Agenda +
Decisions) and render:

1. **Meeting detail page** (`/<lang>/meetings/<slug>`):
   - Meeting metadata (dates, venue, committee)
   - Agenda section (list of agenda items with labels + titles)
   - Decisions section (list of resolutions, each linked to its
     agenda_item if one is recorded)
   - Minutes section (if available)

2. **Agenda detail view** (inline on meeting page or dedicated):
   - Full agenda item list
   - Per-item: label, kind, title, outcome, linked decision
   - Cross-link from decision → agenda item

3. **Resolution detail page** (`/<lang>/resolution/<id>`):
   - Existing layout
   - NEW: "Agenda item" badge/link if `decision.agenda_item` is set,
     linking back to the agenda section of the parent meeting

## Data pipeline changes (`build-data.mjs`)
- Read new edoxen-model YAMLs (one per meeting, with embedded
  decisions[])
- Flatten decisions into the existing resolution JSON shape (for
  backward compat with search + meeting cards)
- Add `agenda_items[]` to the meeting JSON (for rendering)
- Add `agenda_item` to each resolution JSON record (for cross-linking)

## Component changes
- `MeetingDetail.vue`: add Agenda section above Resolutions
- `ResolutionDetail.vue`: add Agenda Item link badge
- New `AgendaItem` component: renders a single agenda item row

## Done criteria
- [ ] build-data.mjs reads new format
- [ ] MeetingDetail renders agenda
- [ ] ResolutionDetail links to agenda item
- [ ] All existing functionality still works
