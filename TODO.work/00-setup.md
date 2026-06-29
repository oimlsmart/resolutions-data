# 00 — Setup

## Goal
Stand up the repository skeleton before any fetching or OCR.

## Done
- Created directories:
  - `TODO.work/` — this log
  - `scripts/`, `scripts/ocr/` — Ruby drivers
  - `reference-docs/ciml/`, `reference-docs/conferences/` — source PDF archive
  - `reference-docs/.ocr/{raw,md,text}/` — OCR cache (gitignored)
- Wrote `.gitignore` ignoring `reference-docs/.ocr/`, `*.tmp`, `.DS_Store`,
  `node_modules/`, `.bundle/`, `vendor/`, `*.log`.
- Wrote `CLAUDE.md` (project overview, target layout, OCR tooling, references).

## Tooling verified
- `pdfinfo` (Poppler 26.03.0) — page counts
- `pdftotext` (Poppler) — text-layer extraction for verification
- `ruby` 3.4.8 + `bundle`
- `mdls` (macOS) — fallback page count
- `curl` 8.1.2 — downloads
- `~/.zai-api-key` — present

## Outputs
- `.gitignore`, `CLAUDE.md`, `TODO.work/README.md`, this file
- Empty `scripts/`, `reference-docs/{ciml,conferences}/`, `reference-docs/.ocr/{raw,md,text}/`

## Next
Phase 01 — discovery (scrape index pages for resolution PDF URLs).
