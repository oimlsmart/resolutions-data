# 17 — Final Summary (post-Phase 16)

## What changed across phases 13–16

| Phase | Result |
|---|---|
| 13 — OIML logo + README.adoc | Logos copied from `~/src/mn/oiml-vocab/logos/`, wired into `App.vue`, AsciiDoc README replaces the throwaway `.md` |
| 14 — Real meeting dates | `scripts/extract_dates.rb` populates `date_start` / `date_end` in the manifest from OCR cover pages (EN + FR month names). All 51 entries dated. |
| 15 — Narrative parser | CIML 39–42 + Conference 12 (10 PDFs) now parsed via `parse_narrative`. **0 pending**. |
| 16 — Deploy to GitHub Pages | `.github/workflows/deploy-pages.yml` validates + builds + deploys. `scripts/validate_yaml.rb` is the CI gate. |

## Final corpus

| Metric | Value |
|---|---|
| Source PDFs | 51 (20.8 MB) |
| GLM-OCR tokens consumed | 1.32 M |
| Edoxen YAML files | **53** (51 sources + 2 bilingual splits) |
| Total resolutions | **1,640** |
| CIML resolutions | 1,377 |
| Conference resolutions | 263 |
| Languages | EN + FR + bilingual (one YAML per language) |
| Real meeting dates | 51 / 51 (extracted from OCR covers) |
| Pre-rendered HTML routes | 895 |
| Sitemap URLs | 1,696 |
| OIML logo | wired (header + footer + favicon) |

## Repository layout (final)

```
resolutions-data/
├── README.adoc                      canonical readme (AsciiDoc)
├── CLAUDE.md                        project status
├── .gitignore
├── .github/
│   ├── workflows/deploy-pages.yml   validate → build → deploy
│   └── dependabot.yml
├── TODO.work/                       17 phase logs + README
├── scripts/
│   ├── manifest.yaml                51 sources with real dates
│   ├── fetch_pdfs.rb
│   ├── extract_dates.rb             NEW: dates from OCR covers
│   ├── author_yaml.rb               UPDATED: handles narrative format + real dates
│   ├── verify_ocr.rb
│   ├── validate_yaml.rb             NEW: CI YAML gate
│   └── ocr/{glm_ocr.rb, run.rb}
├── reference-docs/
│   ├── ciml/                        41 PDFs
│   ├── conferences/                 10 PDFs
│   └── .ocr/                        gitignored cache (raw JSON + md + text)
├── resolutions/                     53 YAML files, 1,640 resolutions
└── browser/
    ├── public/
    │   ├── assets/
    │   │   ├── oiml-logo.svg        NEW
    │   │   ├── oiml-logo-icon-light.svg  NEW
    │   │   └── oiml-logo-icon-dark.svg   NEW
    │   └── data/resolutions.json    1,640 entries
    └── src/...                      Vue 3 + Vite UI
```

## Live verification

```
HOME:         <title>OIML Resolutions</title>
              description: "Search and browse 1640 resolutions of OIML — Legal Metrology."
              logo refs: 1 (in header)

CI build:     validate → 53 files / 0 issues
              build → 895 routes pre-rendered, 1696 sitemap URLs
              deploy → github-pages environment

Sample narrative resolution:
  CIML/2004/1 meeting_date: 2004-10-26   (was deferred; now in browser)
```

## Test commands (cheat sheet)

```bash
# Full pipeline (idempotent at every stage)
ruby scripts/fetch_pdfs.rb
ruby scripts/ocr/run.rb
ruby scripts/verify_ocr.rb
ruby scripts/extract_dates.rb        # NEW
ruby scripts/author_yaml.rb
ruby scripts/validate_yaml.rb        # NEW (CI gate)

# Browser
cd browser
npm install
npm run dev                          # http://localhost:5173/resolutions-data/
npm run build                        # 895 routes
npm run preview                      # http://localhost:4173/resolutions-data/
```

## Remaining gaps (deferred or out-of-scope)

1. **Conference 12 joint doc body-splitting** — the parser treats the joint
   `12-conf-39-ciml-dc-decisions.pdf` as a single sequence tagged
   `Conference/2004/N`. A future iteration could split at the body boundaries
   and tag each resolution with the correct subject (Conference / CIML /
   Development Council).
2. **Hand-curated titles** — auto-generated titles for formal resolutions are
   verb-led first-clause snippets. The narrative format leverages section
   titles (better), but formal Resolution titles are still mechanical.
3. **Cross-reference edges** — "Noting Resolution CIML/2024/08" stays in
   consideration text; not yet promoted to first-class relation edges.
4. **Pre-2004 resolutions** — Bulletin-bound; needs physical scanning.
