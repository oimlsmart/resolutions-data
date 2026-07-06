# 04 — Refactor Ruby scripts to use Edoxen model classes

## Goal
Replace raw `YAML.load` / `YAML.dump` in our scripts with model-backed
builders that construct `Edoxen::Agenda` and `Edoxen::DecisionCollection`
instances.

## Status

### Done in this PR
- ✅ `lib/oiml/resolutions_data/agenda_builder.rb` — wraps `Edoxen::Agenda`
- ✅ `lib/oiml/resolutions_data/decision_collection_builder.rb` — wraps `Edoxen::DecisionCollection`
- ✅ `scripts/parse_agenda_pdfs.rb` — refactored to use `AgendaBuilder`
- ✅ `scripts/parse_agendas.rb` — refactored to use `AgendaBuilder`
- ✅ `scripts/parse_dc_decisions.rb` — refactored to use `DecisionCollectionBuilder`
- ✅ Specs for `AgendaBuilder` and `DecisionCollectionBuilder`

### Deferred to a future PR
**`scripts/author_yaml.rb` and `scripts/parse_minutes.rb`**

#### Why deferred
- `author_yaml.rb` is 1021 lines of OCR-parsing logic that emits
  v1-format YAML (uses `resolutions:` key, `start/kind` dates, single
  language). The downstream `migrate_resolutions_v2.rb` and
  `fix_v2_dates.rb` scripts already convert that output to valid v2.
  So the v2 data on disk is correct.
- The parsing logic (OCR → resolution hashes) is the bulk of the
  file and is correct. Only the OUTPUT rendering (`render_collection`,
  `render_resolution`) would change in a refactor.
- Rewriting the output to use `DecisionCollectionBuilder` is
  straightforward in isolation but risky in this PR because:
  - All 57 resolution YAMLs would need re-generation
  - Each must round-trip through edoxen validation
  - The downstream migration scripts would become dead code (need to
    be removed or marked as historical)
  - Touching 57 files of generated data inside a refactor PR makes
    review harder
- `parse_minutes.rb` is similar: 400 lines of regex-heavy Bulletin
  parsing. Output is a custom format (not edoxen) but matches what
  `parse_agendas.rb` consumes. Refactoring to use Edoxen models
  would require defining a custom `Edoxen::Minutes` model that
  doesn't exist in the gem today.

#### When to revisit
- When we need to add a new meeting/decision format (e.g. when a
  new body type or new metadata field is added that the v1→v2
  migration doesn't handle)
- When we want to eliminate the migration scripts

#### What the refactor would look like
1. Add `lib/oiml/resolutions_data/decision_collection_renderer.rb` that
   takes the existing parsed-hash output of `parse()` and builds a
   `DecisionCollectionBuilder`-shaped input.
2. Replace `render_collection` and `render_resolution` in
   `author_yaml.rb` with a single call to the new renderer.
3. Re-run `author_yaml.rb` over all source PDFs.
4. Delete `migrate_resolutions_v2.rb` and `fix_v2_dates.rb` (now
   unneeded) or keep them as historical scripts in `scripts/legacy/`.
5. Add integration spec that round-trips a known Bulletin/decisions
   PDF through the new pipeline.

## Done criteria
- [x] AgendaBuilder + DecisionCollectionBuilder exist
- [x] Specs for both
- [x] Three smaller scripts use them
- [ ] `author_yaml.rb` refactor (future PR)
- [ ] `parse_minutes.rb` refactor (future PR)
