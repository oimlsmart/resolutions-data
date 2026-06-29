# 07 — Edoxen YAML Authoring Plan

## Goal
Convert OCR markdown → Edoxen YAML, one file per source PDF, in `resolutions/`.

## Input
- `reference-docs/.ocr/md/*.md` (51 files from Phase 05)
- `scripts/manifest.yaml` (51 sources with kind, year, lang, slug, venue)

## Reference points
- Edoxen model: `~/src/mn/edoxen-model/models/*.lutaml` — Resolution has
  `subject`, `title`, `type`, `identifier`, `meeting`, `dates`,
  `considerations`, `actions`, `approvals`, `agendaItem`.
- Edoxen OIML reference: `~/src/mn/edoxen-model/references/oiml.adoc` —
  shows OIML's "Resolution no. YYYY/N (Agenda item N) / The Conference, /
  Having regard to... / Resolves:" idiom.
- 184sc4 working examples: `~/src/isotc184sc4/resolutions/plenary/*.yaml`.

## OCR format variants observed

### A. Modern (CIML 44+, Conference 14+, ~2014+)
```
## Resolution Conference/2025/01
Agenda item 2
The Conference,
[considerations...]
[action(s)...]
```
Identifier embedded in header. Cleanest.

### B. Older (Conference 13, CIML 43, ~2008–2013)
```
## Resolution no.1
The Conference,
[body...]
```
Plain sequence number; year inferred from meeting.

### C. CIML "decisions" era (39–42, 2004–2007)
```
## 1 Approval of the minutes of the 38th CIML Meeting
The Committee approved the minutes...
```
Narrative minutes style — each numbered section is a decision point but
not a formal "Resolution". Different parser mode required.

### D. Bilingual (CIML 43, Conference 13)
EN section first (`# Resolutions` → `## Resolution no.N`), then FR section
(`# Résolutions` → `## Résolution n° N`). Split at the `# Résolutions` header.

## Multilingual handling
Per user directive: a single logical resolution may have parallel EN/FR
text. Edoxen has no native multilingual fields, so:
- **One YAML file per (source PDF × language)** — e.g.
  `conference-16-resolutions-en.yaml` and `conference-16-resolutions-fr.yaml`.
- **Shared identifier** across languages (e.g. `Conference/2021/01`) so the
  same logical resolution can be cross-referenced.
- **`urn`** uses the identifier + meeting year, language-agnostic:
  `urn:oiml:conference:resolution:2021:01`.
- **`lang`** field at the metadata level documents the language of each file.
- **Bilingual PDFs** are split at the `# Résolutions` header into EN and FR
  markdown streams before parsing; output is two YAML files
  (`<slug>-en.yaml`, `<slug>-fr.yaml`).

## Action / consideration verb mapping (OIML → Edoxen `type`)

Considerations (mapped to lowercase type):
- "Having regard to" → `having_regard_to`
- "Noting" / "Noting that" → `noting`
- "Recalling" → `recalling`
- "Considering" / "Considering that" → `considering`

Actions:
- "Approves" → `approves`
- "Elects" → `elects`
- "Endorses" → `endorses`
- "Resolves" / "Resolves that" → `resolves`
- "Gives its definitive discharge" → `gives_discharge`
- "Thanks" → `thanks`
- "Instructs" → `instructs`
- "Requests" → `requests`
- "Decides" → `decides`
- "Charges" → `charges`
- "Supports" → `supports`
- "Re-affirms" / "Reaffirms" → `reaffirms`
- "Rescinds" → `rescinds`

## Title synthesis
OIML resolutions have no explicit title in source. Synthesize from the
first action: take the verb stem + first ~10 words of the message,
title-cased. Example: "Approves the agenda for the 17th International
Conference on Legal Metrology (OIML Conference)."
→ title: "Approve the agenda for the 17th International Conference".

## Tables
HTML `<table>` blocks in OCR markdown → AsciiDoc `|===` tables (matches
184sc4 convention). Cell content preserved verbatim.

## Parser scope for this phase
- Modern format (A): full auto-parse.
- Older Conference/CIML (B): full auto-parse (identifier = `<meeting-year>/<seq>`).
- Bilingual (D): split + parse each half; emit two YAMLs.
- CIML 39–42 decisions (C): different narrative format. **Deferred** —
  flagged in `resolutions/_pending_review.txt` for manual authoring.

## Outputs
- `resolutions/<slug>.yaml` (per non-bilingual source PDF)
- `resolutions/<slug>-en.yaml` + `resolutions/<slug>-fr.yaml` (per bilingual)
- `scripts/author_yaml.rb` (the parser)

## Next
Phase 08 — write `scripts/author_yaml.rb`, run on all 51 PDFs.
