# 04 — Vitest tests for new edoxen-model functionality

## Goal
Add vitest tests covering:
1. Agenda parsing script (phase 01)
2. Conversion script (phase 02)
3. Updated build-data pipeline (phase 03)
4. New UI components (agenda rendering, cross-linking)

## Tests to write
- `src/__tests__/agenda-parser.test.ts` — verify agenda items extracted
  from HTML have correct labels, titles, kinds
- `src/__tests__/edoxen-model.test.ts` — verify conversion output has
  correct Decision shape, embedded Agenda, MeetingLocalization
- `src/__tests__/build-data-model.test.ts` — verify flattened JSON has
  agenda_items on meetings + agenda_item on resolutions
- `src/__tests__/MeetingDetail.test.ts` — verify agenda section renders
- `src/__tests__/ResolutionDetail.test.ts` — verify agenda-item badge

## Done criteria
- [ ] All new tests pass
- [ ] Test count ≥ 100 (up from 84)
- [ ] CI green
