# 08 — Author YAML Implementation

## Goal
Parse OCR markdown into Edoxen YAML, one file per source PDF (or per language
for bilingual PDFs).

## Input
- `reference-docs/.ocr/md/*.md` (51 files)
- `scripts/manifest.yaml`
- `scripts/author_yaml.rb` (~500 lines)

## Done

### `scripts/author_yaml.rb` — single-pass parser
Pipeline:
1. Read manifest entry, read OCR markdown.
2. Bilingual: split at first `# Résolutions` (with é) header → EN + FR halves.
3. Slice into resolution blocks by header detection
   (markdown `## Resolution …` OR plain-text `Resolution …`).
4. For each block:
   - Parse identifier: `Conference/YYYY/NN` | `CIML/YYYY/NN` | `<year>/<seq>`
   - Extract agenda item (`Agenda item N` EN, `[Point N …]` FR)
   - Detect subject (`The Conference,` / `The Committee,` / `La Conférence,`)
   - Classify body lines into considerations vs actions by leading verb
   - Synthesize title from first action (first 14 words, sub-items stripped)
   - Convert HTML tables → AsciiDoc `|===`
5. Render Edoxen YAML with metadata block + resolutions list.

### Verb dictionaries (EN + FR)
- EN considerations: Having regard to, Noting, Recalling, Considering
- EN actions: Approves, Elects, Endorses, Resolves, Gives discharge, Thanks,
  Instructs, Requests, Decides, Charges, Supports, Re-affirms, Rescinds,
  Acknowledges, Notes, Takes note, Welcomes
- FR considerations: Vu, Attendu, Notant, Prenant note, Rappelant, Considérant
- FR actions: Approuve, Élit, Soutient, Décide, Charge, Demande, Remercie,
  Résout, Notes, Prend note, Accueille

### Bilingual handling
For `ciml-43-resolutions-bilingual` and `conference-13-resolutions-bilingual`:
split at the `# Résolutions` (French) header. Emit two YAMLs:
- `<slug>-en.yaml` from the EN half
- `<slug>-fr.yaml` from the FR half

Both halves share identifier space (same `Conference/YYYY/NN` etc.), so a
single logical resolution can be cross-referenced across languages.

### Multilingual note (per user directive)
A resolution may have parallel EN/FR text. Edoxen has no native multilingual
field, so we emit **one YAML per language** and link them via the shared
identifier + meeting URN. Future tooling can join on identifier.

## Result

```
Summary:
  YAML files emitted:    43
  Resolutions parsed:    1241
  Decisions deferred:    3   (parser blocks that didn't yield an identifier)
  Pending-review notes:  10  → resolutions/_pending_review.txt
```

### Coverage
- **43/51 source PDFs** have YAML (84%).
- **1,241 resolutions** parsed across CIML (39→60) and Conference (12→17).
- **8 PDFs deferred**: CIML 39, 40, 41, 42 × {en, fr} — these use a narrative
  "decisions" format (numbered sections like `## 1`, `## 2.1` with prose
  starting "The Committee ...") that needs a different parser mode.
- **2 PDFs deferred**: conference-12 × {en, fr} — joint CIML-39 + DC + Conf-12
  document with multi-body structure; needs a dedicated splitter.

## Bugs hit & fixed during development
1. ROOT path off-by-one (`__dir__` is `scripts/`, repo root is `..`).
2. Multi-line `/x` regex broke Ruby parser → compacted to single line.
3. `#{1,6}` parsed as Ruby interpolation → escaped to `\#{1,6}`.
4. Bilingual split matched EN `# Resolutions` first → tightened regex to
   require literal `é`.
5. `parse_identifier` missed 3 header variants:
   - `Resolution YYYY/N` (no body prefix, e.g. CIML 55)
   - `Resolution no.YYYY/N` (e.g. CIML 50–53, Conf 15)
   - `Resolution N` bare (e.g. CIML 45, 54)
   → added three regex passes; bare digits fall back to manifest year.
6. Plain-text "Resolution" lines (no `##` prefix) weren't detected as headers
   → added a second regex pass for non-markdown lines with an identifier tail.
7. `render_resolution` used `lines << "X" << "Y"` which mutated the array
   element instead of pushing two → rewrote as two `lines <<` calls.
8. Title synthesis truncated at "M." (abbrev split as sentence end) →
   switched to word-count-based truncation.

## Outputs
- `scripts/author_yaml.rb`
- `resolutions/*.yaml` (43 files)
- `resolutions/_pending_review.txt`

## Next
Phase 09 — validate every YAML parses + sanity-check structure.
Phase 10 — port the resolutions browser from isotc184sc4.
Phase 11 — handle the 10 deferred narrative-format PDFs.
