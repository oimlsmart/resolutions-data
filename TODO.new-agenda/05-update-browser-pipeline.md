# 05 — Update browser build-data pipeline for v2 format

## Goal
Update `browser/scripts/build-data.mjs` and `browser/scripts/lib/transforms.mjs`
to read the v2-compliant YAMLs (decisions key, StructuredIdentifier,
DecisionDate shape).

## Changes
- `build-data.mjs`: read `decisions:` key instead of `resolutions:`
- `transforms.mjs`: parse StructuredIdentifier[] → display string
- `transforms.mjs`: map DecisionDate `{date, type}` → legacy `{start, kind}`
- Keep the flat JSON shape for the UI (backward compat)

## Done criteria
- [ ] `npm run build` succeeds
- [ ] Browser data has correct resolution counts
- [ ] All 86 vitest tests pass
