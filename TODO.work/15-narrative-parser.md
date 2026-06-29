# 15 — Narrative Parser (CIML 39–42 + Conference 12)

## Goal
Cover the 10 PDFs whose OCR uses a narrative "DECISIONS" format instead of
formal "## Resolution ..." headers.

## Inputs
- `reference-docs/.ocr/md/ciml-{39,40,41,42}-decisions-{en,fr}.md`
- `reference-docs/.ocr/md/conference-12-decisions-{en,fr}.md`

## OCR format variants

### CIML 39–42 (2004–2007)
Numbered sections like `## 1 Approval of the minutes of the 38th CIML Meeting`
followed by paragraphs starting with "The Committee [verb] ..." (EN) or
"Le Comité a [verb] ..." (FR). FR files use `## DÉCISIONS` (with é) and
sometimes a single-hash `# DECISIONS`.

### Conference 12 (2004)
Joint document containing 12th Conference + 39th CIML + Development Council
decisions, in EN then FR halves.

## Done

### New `parse_narrative` method in `scripts/author_yaml.rb`
1. Slice from `## DÉCISIONS` / `## DECISIONS` (any header level) to either
   the next `# ANNEX` block or end of file.
2. Iterate lines, splitting on `## N` or `## N.M` headers.
3. For each numbered section:
   - `identifier` = `<CIML|Conference>/<year>/<section-number>`
     (e.g. `CIML/2004/2.1`)
   - `title` = section title from the header (more meaningful than
     verb-led synthesis)
   - `subject` = `CIML`
   - Body paragraphs classified into actions by leading verb.

### Verb classifier (`classify_narrative_verb`)
- English: "took note", "approved", "instructed", "endorsed", "thanked",
  "decided", "renewed", "welcomed", "wished", "set the deadline",
  "requested", "gave its approval", "expressed its appreciation" → mapped
  to standard types (`notes`, `approves`, `instructs`, …).
- French: `a approuvé`, `a noté`, `a chargé`, `a adopté`, `a remercié`,
  `a décidé`, `a renouvelé`, `a accueilli`, `a prié`, etc. — accents
  matched with character classes (`[ée]`).

### Dispatch logic in `emit_one`
If `parse()` returns 0 resolutions AND the markdown contains a `DÉCISIONS`
header, fall back to `parse_narrative`. The dispatch regex matches any
header level (`#`, `##`, `###`, …) and any case of "DECISIONS" / "DÉCISIONS".

## Result
```
Summary:
  YAML files emitted:    53     (was 43)
  Resolutions parsed:    1640   (was 1241 — added 399 from narrative)
  Decisions deferred:    0      (was 3)
  Pending-review notes:  0      (was 10)
```

All 53 PDFs (51 sources + 2 bilingual splits) now have YAML. **0 pending.**

## Bugs hit & fixed
1. The first regex used `\A##\s+(\d+(?:\.\d+)?)\.?\s+(.*)\z` — the `\z`
   anchor doesn't match lines with trailing `\n`. Switched to no anchor
   (Ruby `~` already constrains to single-line when iterating `each_line`).
2. FR files used `## DÉCISIONS` (accented) — extended regex to `D[ÉE]CISIONS`.
3. CIML 40 and 42 FR files used `# DECISIONS` (single hash) — relaxed
   regex from `##` to `#*`.
4. Body section boundaries in narrative docs were inconsistent — handled
   by also detecting ANNEX sections and stopping there.

## Notable: Conference 12 joint doc
The Conf 12 EN file bundles decisions from 3 bodies (12th Conf + 39th CIML +
Development Council). The current parser treats it as a single CIML-style
sequence — i.e. all numbered sections become `Conference/2004/N` resolutions
regardless of which body adopted them. A future improvement would split the
doc at the body boundaries (`TWELFTH INTERNATIONAL CONFERENCE` /
`THIRTY-NINTH MEETING` / `DEVELOPMENT COUNCIL`) and tag each resolution with
the correct subject.

## Outputs
- 10 new YAML files in `resolutions/`:
  `ciml-{39,40,41,42}-decisions-{en,fr}.yaml`, `conference-12-decisions-{en,fr}.yaml`
- Updated `scripts/author_yaml.rb` (~120 new lines for narrative support)
