# 04 — OCR Adaptation

## Goal
Port `~/src/relaton/relaton-data-oiml/backfill/glm_ocr.rb` into this repo with
the changes the new API limits require, plus a driver that walks every PDF.

## Inputs
- `~/src/relaton/relaton-data-oiml/backfill/glm_ocr.rb` (reference impl)
- `~/.zai-api-key` (API key — turns out to be an `export Z_AI_API_KEY=...` snippet)
- `reference-docs/{ciml,conferences}/*.pdf` (51 PDFs from Phase 03)

## Done

### `scripts/ocr/glm_ocr.rb` (adapted)
Minimal diff from upstream — four changes only:

| What | Upstream | Here |
|---|---|---|
| `PAGES_PER_CHUNK` | `30` | `100` |
| `http.read_timeout` | `180` | `600` |
| `Net::HTTP.new(host, port, use_ssl: true)` | (worked in older Ruby) | `Net::HTTP.new(...)` + `http.use_ssl = true` (Ruby 3.4 strict) |
| `CACHE_DIR` | `backfill/cache` | `reference-docs/.ocr/raw` |
| API key file format | raw string only | raw OR `export VAR=value` snippet |
| Module name | `BulletinBackfill` | `ResolutionsData` |

Plus: API call retry on non-2xx (3 attempts, exponential backoff) and a
`MAX_BYTES = 100 MB` guard.

### `scripts/ocr/run.rb` (driver)
- Walks `reference-docs/{ciml,conferences}/*.pdf` in sorted order
- `pdfinfo` for page count; `mdls` fallback
- Per-PDF: writes `reference-docs/.ocr/md/<slug>.md`
- `ONLY=<slug>` env var to process one PDF (smoke testing)
- Final summary: PDF count, total pages, total chars, errors

### Bugs hit and fixed (2026-06-29)
1. `File.expand_path("../../../", __dir__)` was one level too far. `__dir__` is
   `scripts/ocr/`, repo root is `../..`.
2. `Net::HTTP.new(host, port, use_ssl: true)` raises `TypeError` on Ruby 3.4 —
   `use_ssl` is a property, not a constructor kwarg. Fixed via two-line setter.
3. `ONLY=` (empty string) was treated as truthy → `targets.empty?` raised.
   Guarded with `ONLY && !ONLY.empty?`.
4. `~/.zai-api-key` is an `export Z_AI_API_KEY=...` snippet, not a raw key.
   Added `read_key_file` that strips the `export VAR=` wrapper if present.

### Smoke test — `ciml-39-decisions-en` (5 pages)
```
OCR        ciml-39-decisions-en.pdf pages 1-5: 14971 tokens
ok   ciml-39-decisions-en  (5p, 10747 chars,  4.9s)
```

Cached JSON shape (one chunk):
```
top-level keys: created, data_info, id, layout_details, layout_visualization,
                md_results, model, request_id, usage
usage:  { "completion_tokens": 2655, "prompt_tokens": 12316, "total_tokens": 14971 }
md_results: 10747 chars
full JSON on disk: 32603 bytes
```

Markdown output preserves:
- Document title (centered via `<div align="center">`)
- Heading hierarchy (## DECISIONS, ## 1, ## 2.1, …)
- Bulleted and numbered lists
- Annex structure

## Issues / notes
- The 51 failed 401 calls from before the auth-key fix did **not** write any
  cache files (the script raises before `write_cache`). Cache is clean.
- Z.ai `prompt_tokens` for a 5-page PDF was 12,316 — about 2,500 tokens/page
  of input. Estimated full-batch cost: ~500 pages × ~3K tokens/page ≈
  **~1.5 M tokens total** (input + output).
- Smoke test caches one chunk (~33 KB JSON). The full run will produce ~51
  chunk files in `reference-docs/.ocr/raw/`.

## Outputs
- `scripts/ocr/glm_ocr.rb` (~140 lines, stdlib only)
- `scripts/ocr/run.rb` (~60 lines)
- `reference-docs/.ocr/raw/255c764f15637db1.json` (smoke-test cache)
- `reference-docs/.ocr/md/ciml-39-decisions-en.md` (smoke-test output)

## Next
Phase 05 — run OCR on the remaining 50 PDFs (~8–15 min wall-clock).
