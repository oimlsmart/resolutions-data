# 10 — Browser Port

## Goal
Stand up a Vue 3 + Vite + vite-ssg web UI that serves the parsed resolutions,
mirroring the architecture of `~/src/isotc184sc4/resolutions/browser/` but
rebranded for OIML.

## Input
- `resolutions/*.yaml` (43 files, 1,241 resolutions from Phase 08)
- `~/src/isotc184sc4/resolutions/browser/` (template — Vue 3, Vite 6,
  Tailwind 4, vite-ssg 28, FlexSearch, vue-router 4)

## Done

### Copy
Copied `index.html`, `package.json`, `vite.config.ts`, `postcss.config.js`,
`tsconfig.json`, `src/`, `scripts/`, `public/`. Excluded `node_modules/`,
`dist/`, `.git/`, `test-results/`, debug scripts.

### Adaptations
| File | Change |
|---|---|
| `package.json` | `name`: `oiml-resolutions-browser`; `version`: `0.1.0` |
| `scripts/build-data.mjs` | `PLENARY_DIR` → `RESOLUTIONS_DIR = ../../resolutions` |
| `scripts/lib/transforms.mjs` | `URN_BASE`: `urn:iso:tc:184:sc:4` → `urn:oiml` |
| `scripts/post-build.mjs` | sitemap `baseUrl` → `oiml.org/resolutions` |
| `src/utils/urn.ts` | URN_BASE → `urn:oiml` |
| `src/data/committee.ts` | Full rewrite for OIML (name, title, scope, BIML secretariat, 1955 established, links). Legacy `iso`/`committeeSite`/`linkedin` keys retained with OIML URLs to satisfy TS checks. |
| `src/views/About.vue` | All ISO/TC 184/SC 4 examples → OIML examples (17th Conference, identifier `Conference/2025/01`) |
| `src/views/Home.vue` | Hero text → "Twenty Years of OIML Resolutions" |
| `src/views/Meetings.vue` | Subtitle → "Browse resolutions by CIML meeting or OIML Conference." |
| `src/views/ResolutionDetail.vue` | "Plenary resolution" → "Resolution" |
| `src/App.vue` | Dropped ISO logo `<img>` tags; footer/mobile-menu link labels → OIML-appropriate |
| `index.html` | `<title>` → `OIML Resolutions` |
| `vite.config.ts` | SSG meta-tag injection: every `ISO/TC 184/SC 4` → `OIML`; `Industrial data` → `Legal Metrology`; count regex tightened to skip "184" in attribution comment |

### Install + build
```
npm install --no-audit --no-fund  →  209 packages in 2s
npm run build                     →  1241 resolutions built; 1287 sitemap URLs
```

### Page-level verification (vite preview)
| Route | Title | Size |
|---|---|---|
| `/` (home) | `OIML Resolutions` | 92 KB |
| `/meetings/` | `Meetings | OIML` | 49 KB |
| `/meetings/conference-17-resolutions-en/` | `Meeting: Paris, France | OIML` | 37 KB |
| `/about/` | `About | OIML` | 22 KB |
| `/resolution/Conference/2025/01/` | `Approves the agenda… | OIML` | 7.5 KB |

Home meta description: `Search and browse 1241 resolutions of OIML — Legal Metrology.`

### Global checks
- **714 routes pre-rendered** as static HTML.
- **0 stale `ISO/TC 184` strings** in any built HTML (only retained in an attribution comment).
- **All TypeScript type-checks pass**.

## Bugs hit & fixed
1. Missing `node_modules` → `npm install`.
2. `App.vue` referenced removed `committee.links.*` keys → added them back with OIML URLs.
3. SSG meta description hardcoded `ISO/TC 184/SC 4 — Industrial data` in `vite.config.ts` `onPageRendered` → replaced.
4. Count regex captured "4" from attribution comment's "184" → tightened regex.

## Outputs
- `browser/` — full Vue 3 + Vite project
- `browser/public/data/resolutions.json` (1.5 MB, 1,241 entries)
- `browser/dist/` — pre-rendered static site (714 routes)

## How to run
```bash
cd browser
npm install
npm run dev       # http://localhost:5173/resolutions-data/
npm run build     # production build to dist/
npm run preview   # serve dist/ at http://localhost:4173/resolutions-data/
```
