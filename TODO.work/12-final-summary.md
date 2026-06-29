# 12 — Final Summary

## What got built (across phases 00–10)

### Data pipeline
1. **51 OIML resolution PDFs** downloaded into `reference-docs/{ciml,conferences}/`
   (20.8 MB total).
2. **OCR via GLM-OCR** for every PDF — 501 pages, 1.32 M tokens, full JSON
   responses cached under `reference-docs/.ocr/raw/` (gitignored).
3. **Cross-verification** against `pdftotext` text layer — every PDF above
   `pdf_in_md ≥ 0.85`, overall Jaccard 0.862.

### Resolutions data
4. **43 Edoxen YAML files** in `resolutions/` (one per source PDF × language;
   bilingual PDFs split into `-en` / `-fr` pairs).
5. **1,241 resolutions parsed** — identifier, subject, title, agenda item,
   considerations, actions, dates.
6. **10 PDFs deferred** for narrative-format parser (CIML 39–42, Conf 12) —
   see `TODO.work/11-deferred-narrative.md`.

### Browser
7. **`browser/`** — Vue 3 + Vite 6 + Tailwind 4 + vite-ssg 28 SPA, ported
   from `~/src/isotc184sc4/resolutions/browser/` and rebranded for OIML.
8. **714 routes pre-rendered** as static HTML.
9. **Live data**: home page reports "1,241 resolutions of OIML — Legal Metrology".

## Repository layout (final)

```
resolutions-data/
├── CLAUDE.md                          project overview
├── README.md                          public-facing readme
├── .gitignore                         ignores .ocr/, *.bak, etc.
├── TODO.work/                         13 work-log files (this dir)
├── scripts/
│   ├── manifest.yaml                  51 sources
│   ├── fetch_pdfs.rb                  PDF downloader (Phase 03)
│   ├── author_yaml.rb                 OCR → Edoxen YAML parser (Phase 08)
│   ├── verify_ocr.rb                  GLM-OCR vs pdftotext (Phase 06)
│   └── ocr/
│       ├── glm_ocr.rb                 GLM-OCR driver (Phase 04)
│       └── run.rb                     batch driver
├── reference-docs/
│   ├── ciml/                          41 CIML resolution PDFs
│   ├── conferences/                   10 Conference resolution PDFs
│   └── .ocr/                          (gitignored)
│       ├── raw/                       51 full GLM-OCR JSON responses
│       ├── md/                        51 markdown files
│       └── text/                      51 pdftotext ground-truth files
├── resolutions/                       43 Edoxen YAML files
│   ├── ciml-*.yaml                    CIML meetings 43 → 60 (per language)
│   ├── conference-*.yaml              Conferences 13 → 17 (per language)
│   └── _pending_review.txt            10 deferred slugs
└── browser/                           Vue 3 + Vite UI
    ├── package.json
    ├── vite.config.ts
    ├── src/                           Vue components, views, composables
    ├── scripts/                       build-data.mjs, transforms.mjs
    ├── public/data/resolutions.json   built data (1.5 MB, 1,241 entries)
    └── dist/                          pre-rendered static site (714 routes)
```

## Test commands (cheat sheet)

```bash
ruby scripts/fetch_pdfs.rb           # re-fetch PDFs (idempotent)
ruby scripts/ocr/run.rb              # re-OCR (idempotent — chunks cached)
ruby scripts/verify_ocr.rb           # verify OCR vs pdftotext
ruby scripts/author_yaml.rb          # re-parse OCR markdown → YAML
cd browser && npm run build          # build data + static site
cd browser && npm run preview        # serve at http://localhost:4173/resolutions-data/
```

## What's left for a future iteration

1. **Narrative-format parser** (Phase 11 design sketched) for CIML 39–42 + Conf 12.
2. **Hand-review pass** on the 1,241 auto-parsed resolutions — titles are
   verb-led first-clause snippets, dates are `YYYY-01-01` placeholders.
3. **Real meeting dates** sourced from the meeting minutes PDFs (not yet
   downloaded).
4. **Cross-reference edges** — currently "Noting Resolution CIML/2024/08" lives
   in consideration text only; could be promoted to first-class relation edges.
5. **OIML logo asset** for the browser header (currently text-only).
6. **Pre-2004 resolutions** hidden in Bulletin scans — needs physical scanning.

## Cost & scale summary

| Resource | Value |
|---|---|
| PDFs fetched | 51 (20.8 MB) |
| GLM-OCR tokens consumed | 1,316,548 (~1.3 M) |
| OCR cache on disk | 4.7 MB (gitignored) |
| YAML files emitted | 43 |
| Resolutions parsed | 1,241 |
| Pre-rendered HTML routes | 714 |
| Sitemap URLs | 1,287 |
| Source-code lines (Ruby + TypeScript + Vue) | ~2,500 |
| Wall-clock for full pipeline (after deps installed) | ~5 min |
