# 25 — OIML Resolutions browser final audit (2026-07-01)

Companion to `TODO.complete/24-oiml-audit.md`. Captures the state of
the project after the i18n + AdoptionKind + CI work in this session.

## What shipped this session

| Commit | What |
|---|---|
| `0eefa63` | Agenda item title on resolution detail |
| `e99eaf2` | JSON-LD structured data on home + resolution + meeting pages |
| `a4a0eb2` | Localize About committee stats + Meetings "All" chips |
| `3f6b0af` | Kill "Plenary" hard-code; localize Back + country; EN/FR chip |
| `a23bbc5` | Track OCR markdown digests in git |
| `922cbbd` | Bilingual About + subject detection + branded types + specs |
| (this commit) | AdoptionKind enum + CI workflow + i18n helper specs |

## Architecture state — end of session

### Layered architecture (clean)

```
~/src/mn/edoxen              (external — Ribose team owns)
~/src/mn/edoxen-model        (external — Ribose team owns)
~/src/edoxen/edoxen.github.io (external — Ribose team owns)

oimlsmart/resolutions-data:
  scripts/
    manifest.yaml            source PDF registry (51 entries)
    author_yaml.rb           OCR-md → per-meeting YAML (glossarist localizations)
    ocr/                     GLM-OCR driver (cached)
    specs/
      yaml_validation_spec.rb  L1 schema validation (30 examples)
  resolutions/               28 per-meeting YAMLs (1,540 logical resolutions)
  reference-docs/
    .ocr/md/*.md             51 OCR markdown digests (committed)
    .ocr/raw/*.json          55 raw API responses (git-ignored)
  browser/
    scripts/
      build-data.mjs         YAML → JSON mirror
      lib/transforms.mjs     Pure-function build helpers
      lib/redirects.mjs      Legacy URL → canonical stubs (112 generated)
      specs/transforms.test.mjs  L3 unit tests (18 examples)
    src/
      types/resolution.ts    Free-standing domain model
      domain/branded.ts      Branded value types (Doi, Urn, Iso639Code, ...)
      domain/branded.test.mjs  20 unit tests
      data/
        *.yaml               Single source of truth for editable data
        *.ts                 Thin typed wrappers + helpers
        adoption-kinds.yaml  NEW: AdoptionKind registry
        i18n-helpers.test.mjs  NEW: 11 unit tests
      composables/           Vue composables (useMeetings, useI18n, useDateFormat, ...)
      views/                 5 views (Home, Meetings, MeetingDetail, ResolutionDetail, About)
      router/                Routes (single-file meeting URLs, scrollBehavior)
    .vitepress/              (none — site is Vite SSG, not VitePress)
  .github/workflows/
    deploy-pages.yml         Build + deploy to GitHub Pages
    ci.yml                   NEW: validate-yaml + unit-tests + build smoke
```

### What's in good shape

| Principle | Status |
|---|---|
| **Single source of truth** | Every editable data type has one YAML file (cities, countries, committee, translations, action-types, meeting-types, adoption-kinds). |
| **OCP** | Adding a language, action type, adoption kind, country, or city = one YAML row. No code change. |
| **MECE** | `Localization` (per-language content) vs `Resolution` (admin fields) cleanly separated. `AdoptionKind` enum replaces `is_acclamation` boolean. |
| **DRY** | Branded types, thin TS wrappers, single formatter (`useDateFormat`), single i18n entry (`useI18n`). |
| **Encapsulation** | `domain/branded.ts` exposes constructors that validate at the boundary. `composables/useI18n.ts` owns the language state via module singleton. |
| **Performance** | SSG pre-renders 1,546 routes; 112 legacy redirects emitted at build time; action chip vocab is ~50 entries (O(1) lookup). |
| **Specs** | 52 unit tests + 30 RSpec schema validations + 4 hand-authored spec files. All green. |

### What's still architectural debt (P2+)

| # | Item | Cost | Risk |
|---|---|---|---|
| A1 | Views duplicate `<ActionChips>`, `<UrnCopyBar>`, `<BodyTypeBadge>` markup. Extract to `src/components/`. | 1 day | low |
| A2 | `ResolutionDetail.vue` chunk is 782 KB (mostly `@asciidoctor/core`). Lazy-load only when rich-text content is present. | 4 hours | low |
| A3 | Composable specs (L4) missing — `useMeetings`, `useResolutions`, `useDateFormat` aren't covered. | 4 hours | low |
| A4 | Component specs (L5) missing — views render untested. | 6 hours | medium |
| A5 | E2E smoke (L6) missing — no Playwright. | 4 hours | low |
| A6 | No ESLint config. `npm run lint` would catch typos. | 2 hours | low |
| A7 | `t` returns ComputedRef in `<script setup>` — call sites need `t.value(...)`. Footgun for new contributors. Either document or refactor `useI18n` to expose `t` directly. | 2 hours | medium |
| A8 | Agenda scraper for the other 27 meetings (only ciml-58 has hand-authored data). | 1-2 days | medium |

### What's *not* debt (don't refactor)

- The YAML + thin TS wrapper pattern. Clean, idiomatic, extensible.
- Per-meeting single-file YAMLs with glossarist-style `localizations[]`.
- The branded value types in `domain/branded.ts`.
- The build pipeline (`build-data.mjs` + `transforms.mjs`) — small, pure, fast.
- The SSG post-render meta injection in `vite.config.ts`.
- The CI workflow.

## Data coverage

| Surface | Count |
|---|---|
| Source PDFs (manifest) | 51 |
| OCR markdown digests | 51 (committed) |
| Per-meeting YAMLs | 28 |
| Logical resolutions | 1,540 (≈837 EN + 678 FR rows after flatten) |
| Translation keys | 130+ |
| Action types | 46 |
| Adoption kinds | 4 (plenary, acclamation, ballot, ma) |
| Countries | 136 |
| Cities (IATA-coded) | 26 |
| Legacy URL redirects | 112 |
| Sitemap URLs | 1,546 |
| Unit tests | 52 |
| Schema validation examples | 30 |

## Recommendations for next session

1. **A6 (ESLint config)** — cheapest, immediate value. 2 hours.
2. **A7 (`t` ComputedRef footgun)** — fix the API so call sites can use `t('key')` directly in `<script setup>`. Refactor `useI18n` to return the unwrapped function. 2 hours.
3. **A1 (shared components)** — extract 3-5 components. Pays off in DRY across views. 1 day.
4. **A8 (agenda scraper)** — biggest user-visible win. 1-2 days.

A2, A3, A4, A5 are investment items; tackle when capacity allows.
