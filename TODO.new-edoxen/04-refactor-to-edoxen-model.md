# 04 — Refactor Ruby scripts to use Edoxen model classes

## Goal
Replace raw `YAML.load` / `YAML.dump` in our scripts with model-backed
builders that construct `Edoxen::Agenda`, `Edoxen::Minutes`, and
`Edoxen::DecisionCollection` instances.

## Status: DONE

### lib builders
- ✅ `lib/oiml/resolutions_data/agenda_builder.rb` — wraps `Edoxen::Agenda`
- ✅ `lib/oiml/resolutions_data/decision_collection_builder.rb` — wraps `Edoxen::DecisionCollection`
- ✅ `lib/oiml/resolutions_data/minutes_builder.rb` — wraps `Edoxen::Minutes`
- All autoload-wired from `lib/oiml/resolutions_data.rb`

### Refactored scripts
- ✅ `scripts/parse_agenda_pdfs.rb` — uses `AgendaBuilder`
- ✅ `scripts/parse_agendas.rb` — uses `AgendaBuilder`
- ✅ `scripts/parse_dc_decisions.rb` — uses `DecisionCollectionBuilder`
- ✅ `scripts/parse_minutes.rb` — uses `MinutesBuilder`
- ✅ `scripts/author_yaml.rb` — uses `DecisionCollectionBuilder` for
  output (parsing logic unchanged). Emits v2 edoxen YAML directly,
  eliminating the v1→v2 migration step.
- ✅ `scripts/merge_resolution_yamls.rb` — updated to read `decisions:`
  key (was `resolutions:`) and merge v2 localizations.

### Obsolete migration scripts (kept as historical, idempotent no-ops)
- `scripts/migrate_resolutions_v2.rb` — was for v1→v2 rename. New
  pipeline emits v2 directly, so this is a no-op on current data.
- `scripts/migrate_meetings_v2.rb` — same, for meetings.
- `scripts/fix_v2_dates.rb` — was for action dates[] → date_effective.
  New pipeline emits date_effective directly.

### Specs
- ✅ `agenda_builder_spec.rb`
- ✅ `decision_collection_builder_spec.rb`
- ✅ `minutes_builder_spec.rb`
- ✅ `fix_resolution_data_spec.rb` (integration)
- ✅ `body_type_spec.rb`, `identifier_parser_spec.rb`,
  `markdown_reader_spec.rb`, `text_extractor_spec.rb`
- 52 examples, 0 failures, no doubles

## Done criteria — all met
- [x] All agenda/decision/minutes output goes through Edoxen model classes
- [x] No `require_relative` (autoload only)
- [x] No `send` to private methods, no `instance_variable_set/get`, no `respond_to?`
- [x] Specs cover all new lib classes
- [x] All 59 meetings + 57 resolutions validate via edoxen gem
