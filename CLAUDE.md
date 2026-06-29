# OIML Resolutions Data

## Purpose
Store OIML Resolutions (CIML meeting resolutions and OIML Conference
resolutions; many bilingual EN/FR) in the [Edoxen](https://github.com/metanorma/edoxen)
format and deploy them via a resolutions browser. Mirrors the layout used by
ISO/TC 184/SC 4 Resolutions and the ISO/TC 154 site (see references below).

## Source documents
Two OIML bodies publish consolidated resolutions PDFs:

* CIML meetings, 39th (2004) → 60th (2025): index at
  https://www.oiml.org/en/structure/ciml/sites (EN) and
  https://www.oiml.org/fr/structure/ciml/sites (FR).
* OIML Conference, 12th (2004) → 17th (2025): index at
  https://www.oiml.org/en/structure/conference/sites (EN) and
  https://www.oiml.org/fr/structure/conference/sites-web-de-conferences (FR).

Earlier CIML/Conference resolutions are not published as standalone PDFs —
they live inside OIML Bulletin / meeting reports that need to be scanned
separately (out of scope for the initial fetch).

## Repository layout (target)
```
reference-docs/
  ciml/            # consolidated CIML resolution PDFs (one per meeting × lang)
  conferences/     # consolidated Conference resolution PDFs (one per session × lang)
  .ocr/
    raw/           # full GLM-OCR JSON response, one file per (pdf, page-window)
    md/            # concatenated markdown per source PDF
    index.yaml     # provenance: source pdf -> [chunk keys, page ranges, usage]
resolutions/       # Edoxen YAML files (one per meeting/session)
meetings/          # meeting reports / Bulletin scans (later phase)
browser/           # Vue/Vite web UI (mirrors isotc184sc4/resolutions/browser/)
scripts/
  manifest.yaml    # curated list of source PDFs (url, kind, year, lang, slug)
  fetch_pdfs.rb    # download reference-docs/{ciml,conferences}/*.pdf
  ocr/             # GLM-OCR driver adapted from relaton-data-oiml/backfill/glm_ocr.rb
```

## Data model (Edoxen)
YAML per the Edoxen schema:
`https://raw.githubusercontent.com/metanorma/edoxen/refs/heads/main/schema/edoxen.yaml`.
Top-level `metadata` (title, dates, source, venue) + `resolutions` list
(identifier, subject, title, dates, actions). See sibling repo
`~/src/isotc184sc4/resolutions/plenary/*.yaml` for the working pattern.

## URN scheme (proposed)
* `urn:oiml:ciml:resolution:{id}` and `urn:oiml:ciml:meeting:{slug}`
* `urn:oiml:conference:resolution:{id}` and `urn:oiml:conference:meeting:{slug}`

## OCR tooling
GLM-OCR (z.ai layout parsing) endpoint:
`POST https://api.z.ai/api/paas/v4/layout_parsing`,
`Authorization: Bearer $Z_AI_API_KEY` (key in `~/.zai-api-key`).

* Limits: PDF ≤ 100 MB, ≤ 100 pages per request.
* Body: `{ "model": "glm-ocr", "file": <url|base64>, "start_page_id": N, "end_page_id": M }`.
* Response: JSON; markdown lives under the `md_results` key.
* Caching: every API response is stored verbatim under `reference-docs/.ocr/raw/`,
  keyed by SHA-256 of (`input`, `start_page`, `end_page`). Restart-safe.

Reference implementation:
[`~/src/relaton/relaton-data-oiml/backfill/glm_ocr.rb`](../../relaton/relaton-data-oiml/backfill/glm_ocr.rb)
— same endpoint, older 30-page / 50 MB limits. Adapt to 100-page chunks and
keep full JSON (the original caches the whole response; this repo keeps it too).

## Local toolchain
* `pdfinfo` (Poppler 26.x) — page count + PDF metadata.
* `ruby` 3.4.8 + `bundle`.
* `mdls` (macOS) — fallback for page count.
* `curl` — PDF downloads.

## Reference repos
* `~/src/isotc184sc4/resolutions/` — template for `plenary/*.yaml` (Edoxen)
  + `reference-docs/` + `browser/` (Vue + Vite).
* `~/src/isotc154/www.isotc154.org/` — Jekyll-style `_data/resolutions/` and
  `_data/events/` layouts for cross-linking resolutions ↔ meetings.
* `~/src/mn/edoxen` and `~/src/mn/edoxen-model` — Edoxen gem source.
* `~/src/relaton/relaton-data-oiml/backfill/` — proven GLM-OCR + caching code.

## Workflow status (2026-06-30)
[x] Curate `scripts/manifest.yaml` — 51 sources (CIML 39→60, Conference 12→17).
[x] `fetch_pdfs.rb` → 51 PDFs downloaded (20.8 MB).
[x] Adapt `glm_ocr.rb` → 51 PDFs OCR'd, 1.3 M tokens, full JSON cached.
[x] Verify — all 51 above `pdf_in_md ≥ 0.85` (overall Jaccard 0.862).
[x] Author Edoxen YAML — **53 files / 1,640 resolutions parsed** (incl. narrative).
[x] Port browser UI from isotc184sc4 — Vue 3 + Vite, 895 pre-rendered routes.
[x] OIML logo wired (header, footer, favicon) from `~/src/mn/oiml-vocab/logos/`.
[x] README.adoc replaces README.md.
[x] Real meeting dates extracted from OCR covers — 51/51 sources dated.
[x] Narrative-format parser for CIML 39–42 + Conf 12 — all 10 previously-deferred PDFs parsed.
[x] GH Pages deployment workflow (`.github/workflows/deploy-pages.yml`).
[ ] Conference 12 joint doc body-splitting (currently single sequence).
[ ] Hand-curated titles for formal resolutions (verb-led snippets are auto-generated).
[ ] Real meeting dates from minutes PDFs (not yet fetched).
[ ] Pre-2004 resolutions from Bulletin scans (physical scanning required).

See `TODO.work/` for the full phase-by-phase build log (17 phases).
