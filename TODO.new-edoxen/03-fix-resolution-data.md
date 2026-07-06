# 03 — Fix resolution data: subject, agenda_item, title format

## Goal
Three related data fixes across all 56 resolution YAMLs:

1. **`subject` field bug**: Conference/2004/* has `subject: CIML` (wrong). Should reflect the meeting body or be empty.
2. **`agenda_item` field**: Every resolution that maps to a numbered agenda item should carry `agenda_item: '<label>'`. Conference/2004/* and CIML/2025/* have no `agenda_item` set even though their identifiers (`/9`, `/14.2`) clearly map to agenda items.
3. **Title format**: When a resolution is about an agenda item, the title should read `"Agenda Item N: <agenda_item_title>"` — not just `"<agenda_item_title>"` (the current state) or `"Agenda item N"` (placeholder).

## Strategy

### 3.1 Derive `agenda_item` from identifier
The identifier `prefix/year/N` or `prefix/year/N.M` carries the agenda item number in its last segment. Examples:
- `Conference/2004/9` → `agenda_item: '9'`
- `CIML/2025/14.2` → `agenda_item: '14.2'`
- `CIML/2009/1-acclaim-1` → acclamation, no agenda item

Implementation: `scripts/fix_resolution_agenda_items.rb` walks every `decisions[].identifier[].number`, extracts the trailing `/\d+(\.\d+)*` segment, and sets `agenda_item:` if missing.

### 3.2 Fix `subject` field
- Conference/2004/* → drop `subject: CIML` (or set to the meeting's body — "Conference")
- Generalize: don't hardcode `subject` in `author_yaml.rb`. If the source OCR has a clear subject (e.g., the agenda item title), use that. Otherwise, leave empty.

### 3.3 Title format
For every decision with both `agenda_item` AND a matching agenda item title in the meeting's agenda:
```
title = "Agenda Item <label>: <agenda_item_title>"
```
Where the agenda item title comes from `agendas/<meeting_slug>.yaml`. If no matching agenda item, keep existing title.

Examples:
- `Conference/2004/9` + agenda item 9 "Other business" → `"Agenda Item 9: Other business"`
- `CIML/2025/1` + agenda item 1 "Opening remarks and roll call" → `"Agenda Item 1: Opening remarks and roll call"`
- `CIML/2009/1-acclaim-1` → unchanged (acclamation, no agenda mapping)

### 3.4 Browser: hide redundant title display
The `MeetingDetail.vue` agenda table already shows the agenda item title. The `ResolutionDetail.vue` agenda badge shows the agenda item number. After this fix, the resolution title *also* carries "Agenda Item N:". To avoid repeating, the resolution detail page shows the title as-is (no transformation) — the title now stands on its own.

## Implementation

### Script: `scripts/fix_resolution_data.rb`
Single pass over `resolutions/*.yaml`:
1. For each decision, set `agenda_item` from identifier (if missing).
2. For each localization, if `subject` matches the meeting body name (`CIML`, `Conference`), remove it.
3. For each localization, look up the agenda item title in `agendas/<meeting_slug>.yaml` and prepend `"Agenda Item <N>: "` to the title.

Idempotent — re-running produces no further changes.

### Validation
- `bundle exec edoxen validate 'resolutions/*.yaml'` → all 56+ pass
- `bundle exec ruby scripts/check_meeting_join.rb` → 0 problems
- Manual spot-check on `/en/resolution/Conference-2004-9/` and `/en/resolution/CIML-2025-1/`

## Done criteria
- [ ] `subject: CIML` no longer appears on any Conference/2004/* decision
- [ ] Every Conference/2004/* decision carries `agenda_item: '<N>'`
- [ ] Every CIML/2025/* decision title is `"Agenda Item <N>: <title>"`
- [ ] Re-running the fix script is a no-op
- [ ] All 56+ resolution YAMLs still validate
