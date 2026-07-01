# 05 — Schema enum sync

## Problem

`schemas/edoxen-meeting.yaml` is a mirror of the gem's
`schema/meeting.yaml`. The gem's spec suite has
`spec/edoxen/schema_meeting_enum_sync_spec.rb` that asserts every enum
in the schema is character-for-character identical to the corresponding
`Edoxen::Enums::*` constant — but that spec lives in the gem, not in
this repo. Drift between this repo's mirror and the gem is undetected
here.

## Plan

Add `scripts/check_schema_sync.rb` that compares every enum-list in
our local `schemas/edoxen-meeting.yaml` against the gem's
`schema/meeting.yaml`. The gem is reachable on the runner via
`gem install edoxen` (already required by TODO.complete/01).

The check walks both YAMLs, extracts every node whose `enum:` key is a
sequence (top-level enums under `$defs`), and asserts they match
element-for-element between the two files.

Run it in CI after `edoxen validate-meetings`.

## Acceptance

- [x] `scripts/check_schema_sync.rb` exits 0 when local mirror == gem
- [x] CI runs the check after meeting validation
- [x] Drift between `schemas/edoxen-meeting.yaml` and the gem is
      detectable before deploy
