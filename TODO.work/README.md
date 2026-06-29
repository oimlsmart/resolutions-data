# TODO.work — Work Log

Numbered progress log for the OIML Resolutions data build-out. Each file
captures one phase: goal, inputs, what was done, outputs, issues, next step.

## Index

- [00-setup.md](00-setup.md) — Directory structure, .gitignore, scope decisions
- [01-discovery.md](01-discovery.md) — Scrape OIML index pages, extract resolution PDF URLs
- [02-manifest.md](02-manifest.md) — Curate `scripts/manifest.yaml`
- [03-fetch.md](03-fetch.md) — Download all PDFs
- [04-ocr-adapt.md](04-ocr-adapt.md) — Adapt `glm_ocr.rb`, write driver
- [05-ocr-run.md](05-ocr-run.md) — Run GLM-OCR on every PDF
- [06-verify.md](06-verify.md) — Cross-check GLM-OCR against `pdftotext`
- [07-author-plan.md](07-author-plan.md) — Plan YAML authoring (formats, verbs, multilingual)
- [08-author-impl.md](08-author-impl.md) — Write parser; 43 YAMLs / 1,241 resolutions
- [09-validate-yaml.md](09-validate-yaml.md) — Validate every YAML parses
- [10-browser-port.md](10-browser-port.md) — Port isotc184sc4 browser; rebrand for OIML
- [11-deferred-narrative.md](11-deferred-narrative.md) — Original design sketch for CIML 39–42 + Conf 12 (now implemented in Phase 15)
- [12-final-summary.md](12-final-summary.md) — First wrap-up (1,241 resolutions)
- [13-logo-and-readme.md](13-logo-and-readme.md) — OIML logo + README.adoc
- [14-real-dates.md](14-real-dates.md) — Extract real meeting dates from OCR covers
- [15-narrative-parser.md](15-narrative-parser.md) — CIML 39–42 + Conf 12 narrative format
- [16-deploy-pages.md](16-deploy-pages.md) — GH Pages deployment workflow
- [17-final-summary.md](17-final-summary.md) — Final wrap-up (1,640 resolutions)
- [18-favicons-and-polish.md](18-favicons-and-polish.md) — RealFaviconGenerator favicons, hero text, slug-safe URLs

## Scope decisions (2026-06-29 / 2026-06-30)

Per user direction:
1. **Only resolution/decision PDFs** — skip minutes and summary reports.
2. **`reference-docs/.ocr/` is gitignored** — reproducible from PDFs.
3. **Include the 12th Conference joint CIML/DC decisions PDF.**
4. **Bilingual 13th Conference PDF: keep as one OCR artifact** (no EN/FR split
   at the OCR layer; split at YAML authoring time into `-en` / `-fr` files).
5. **Multilingual resolutions**: a single logical resolution may have parallel
   EN/FR text. Edoxen has no native multilingual fields, so we emit one YAML
   per language and link via shared identifier + meeting URN.
6. **PDFs are computer-generated** (not scanned) → `pdftotext` is ground truth
   for verifying GLM-OCR output.
7. **"Fully implement ALL work"** → also do logo, README.adoc, real dates,
   narrative-format parser, and GH Pages deployment.

## Pipeline overview

```
PDFs (51)  →  OCR markdown (51)  →  Edoxen YAML (53)  →  browser JSON (1)
   ↓                ↓                     ↓                   ↓
fetch_pdfs     ocr/run.rb          author_yaml.rb       build-data.mjs
   ↓                ↓                     ↓                   ↓
20.8 MB       1.3 M tokens         1,640 resolutions     895 HTML routes
                                       ↑
                               extract_dates.rb (real meeting dates)
                                       ↑
                               validate_yaml.rb (CI gate)
```
