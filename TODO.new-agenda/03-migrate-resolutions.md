# 03 — Migrate resolution YAMLs to v2 schema

## Goal
Transform all 56 `resolutions/*.yaml` files to conform to the v2
DecisionCollection schema (`schema/edoxen.yaml`).

## Changes per file
1. RENAME top-level `resolutions` key → `decisions`
2. RESHAPE each decision's `identifier` from string → StructuredIdentifier[]
3. RENAME `dates[].start` → `dates[].date`
4. RENAME `dates[].kind` → `dates[].type`
5. DELETE `metadata.language` (language is per-localization)
6. Ensure `metadata.title_localized[]` exists (already in merged YAMLs)

## Script
`scripts/migrate_resolutions_v2.rb`

## Done criteria
- [ ] All 56 YAMLs pass `bundle exec edoxen validate 'resolutions/*.yaml'`
- [ ] No `resolutions:` key remains (renamed to `decisions:`)
- [ ] All identifiers are StructuredIdentifier[] shape
