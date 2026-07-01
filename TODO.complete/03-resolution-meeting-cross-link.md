# 03 — Resolution ↔ meeting cross-link

## Problem

The meeting YAMLs carry `resolution_refs[]` that point at URNs like
`urn:oiml:ciml:resolution-collection:ciml-39-resolutions`, and the
resolution YAMLs carry a comment-only `# Meeting URN: urn:oiml:ciml:meeting:ciml-39-decisions-en`
on line 3. Nothing on either side is machine-readable:

- Resolution YAMLs have no `metadata.meeting_urn` field; downstream
  consumers can't join the two without string-matching the source slug.
- The meeting YAMLs' `resolution_refs` URN suffix
  (`ciml-39-resolutions`) doesn't actually match any per-language
  source_file slug in `resolutions/` (which is `ciml-39-decisions-en`,
  `ciml-39-decisions-fr`, etc.). The browser already special-cases
  this in `sourceFileFromResolutionRefUrn()`; other consumers won't.

## Plan

1. Update `scripts/author_yaml.rb` (or write a one-shot migration) to
   add `metadata.meeting_urn` to every resolution YAML. The value is
   derived from the source slug: `ciml-39-decisions-en` →
   `urn:oiml:ciml:meeting:ciml-39` (strip the per-language suffix and
   the `-decisions|resolutions` middle).
2. Keep the comment line as a human hint; the new field is the
   machine-readable contract.
3. The `resolution_refs[]` URN in `meetings/*.yaml` is canonical for
   the *collection* — the per-language source files join via
   `meeting_urn` ↔ `urn` of the meeting, not via collection URN. That
   keeps the linking unambiguous when there are 1, 2, or N language
   files per meeting.
4. Validate the join: every `metadata.meeting_urn` in `resolutions/`
   resolves to a `urn` in `meetings/`. Add a script
   `scripts/check_meeting_join.rb` that exits non-zero on dangling
   refs.

## Acceptance

- [x] Every `resolutions/*.yaml` carries `metadata.meeting_urn`
- [x] Every meeting_urn resolves to a meeting YAML
- [x] `scripts/check_meeting_join.rb` exits 0
