# 05 — OCR Run

## Goal
Run GLM-OCR on every downloaded PDF; produce one markdown file per source.

## Input
- `reference-docs/{ciml,conferences}/*.pdf` (51 files, 501 pages)
- `scripts/ocr/glm_ocr.rb` + `scripts/ocr/run.rb` (Phase 04)

## Done
Ran `ruby scripts/ocr/run.rb`. **All 51 PDFs OCR'd, 0 errors.**

```
Summary: 51 PDFs OCR'd, 501 pages, 813787 chars, 0 errors
```

### Aggregate stats (from cached JSON `usage` blocks)

| Metric | Value |
|---|---|
| Chunks cached | 51 |
| Input (prompt) tokens | 1,052,698 |
| Output (completion) tokens | 263,850 |
| **Total tokens** | **1,316,548** (~1.3 M, under the 1.5 M estimate) |
| Total markdown chars | 813,787 |
| Raw JSON on disk | 2.70 MB |
| Markdown on disk | 0.79 MB |
| Wall-clock | ~3 min |

### Coverage check
- 51 PDFs in `reference-docs/{ciml,conferences}/`
- 51 markdown files in `reference-docs/.ocr/md/`
- 0 PDFs missing markdown
- 0 markdown files without a source PDF

### Size extremes
- Largest: `conference-12-decisions-en.md` — 70 KB (joint CIML-39 + DC decisions, 32 pages)
- Smallest: `conference-17-resolutions-en.md` — 7 KB (5 pages)

### Per-file timing sample (last 5 of the run)
```
ok   conference-16-resolutions-en  (5p, 7490 chars,  6.6s)
ok   conference-16-resolutions-fr  (5p, 7976 chars,  4.9s)
ok   conference-17-resolutions-en  (5p, 6948 chars,  3.4s)
```

### Full run log
`/tmp/ocr-full.log` (51 lines + summary).

## Issues / notes
- No retries needed on any call — z.ai returned 200 on the first attempt for
  every chunk.
- All PDFs fit in a single chunk (max was 32 pages). Multi-chunk path remains
  untested on real data; the 100-page windowing logic is exercised by the
  `(1..num_pages).each_slice(PAGES_PER_CHUNK)` enumeration.
- Cache is restart-safe: re-running the driver reports `cache hit` for every
  chunk and exits without making API calls.

## Outputs
- `reference-docs/.ocr/raw/*.json` (51 files, 2.70 MB)
- `reference-docs/.ocr/md/*.md` (51 files, 0.79 MB)
- `/tmp/ocr-full.log`

## Next
Phase 06 — cross-check GLM-OCR markdown against `pdftotext` text layer.
