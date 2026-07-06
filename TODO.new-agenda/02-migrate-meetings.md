# 02 — Migrate meeting YAMLs to v2 schema

## Goal
Transform all 58 `meetings/*.yaml` files to conform to the v2 Meeting
schema (`schema/meeting.yaml` in edoxen gem).

## Changes per file
1. DELETE `year` (derive from date_range.start)
2. DELETE `virtual` (derive from venue.kind)
3. RENAME `resolution_refs: ["urn:..."]` → `decisions: [{prefix: "CIML", number: "N"}]`
4. ADD `visibility: public`
5. FIX `type: conference_session` → `type: conference` (Conference meetings)
6. Ensure `source_urls[].kind` uses enum values
7. ADD `venues: [{kind: physical, unlocode: city, country_code: cc}]` (or virtual)
8. Keep `agenda` embedded if present (from loadAgendaItems)

## Script
`scripts/migrate_meetings_v2.rb`

## Done criteria
- [ ] All 58 YAMLs pass `bundle exec edoxen validate-meetings 'meetings/*.yaml'`
- [ ] No `year`, `virtual`, or `resolution_refs` keys remain
