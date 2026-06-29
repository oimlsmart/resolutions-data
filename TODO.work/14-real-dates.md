# 14 — Real Meeting Dates

## Goal
Replace the `YYYY-01-01` placeholder dates with the actual meeting dates,
sourced from the OCR cover pages.

## Input
- `reference-docs/.ocr/md/*.md` — every cover page prints the meeting date in
  a human-readable form ("Berlin, 26-29 October 2004", "Paris, France 14 October 2025").
- `scripts/manifest.yaml` — to receive `date_start` / `date_end` fields.

## Done

### `scripts/extract_dates.rb` (new, ~130 lines)
For each manifest entry, scans the first 60 lines of its OCR markdown for one
of these date patterns:

1. Range: `DD-DD Month YYYY`, `DD & DD Month YYYY`, `DD and DD Month YYYY`
2. Single: `DD Month YYYY`

Both English and French month names are recognized (`October` / `octobre`,
`February` / `février`, etc.).

The script writes `date_start` and `date_end` back into `manifest.yaml` as
**quoted** ISO 8601 strings (so `psych` doesn't auto-convert them to `Date`
objects on subsequent reads).

### `scripts/author_yaml.rb` updates
- `meeting_date(src)` now reads `src["date_start"]` instead of synthesizing
  `YYYY-01-01`.
- `render_collection` emits an `end:` field in the metadata `dates` block
  when the meeting spans multiple days.

## Result
```
51 updated, 0 unchanged, 0 missing
```

Every manifest entry now has a real meeting date. Examples:
- `conference-17-resolutions-en`: 2025-10-14 (single day)
- `ciml-58-resolutions-en`: 2023-10-17 → 2023-10-19 (range)
- `ciml-39-decisions-en`: 2004-10-26 → 2004-10-29 (range)

## Bugs hit & fixed
1. FR month names (octobre, etc.) weren't recognized → added a parallel
   `MONTHS_FR` list and a unified `MONTH_INDEX` map.
2. `YAML.load_file` rejected the manifest because psych tried to auto-convert
   `2025-10-14` to a `Date` object → switched to `safe_load(..., permitted_classes: [Date])`.
3. Existing manifest had unpadded months like `2005-6-18` from the first buggy
   run → re-ran with proper `pad()` formatting.

## Outputs
- `scripts/extract_dates.rb`
- Updated `scripts/manifest.yaml` (51 entries with dates)
- Updated `resolutions/*.yaml` (real dates everywhere)

## Next
Phase 15 — narrative parser for CIML 39–42 + Conf 12 (the 10 deferred PDFs).
