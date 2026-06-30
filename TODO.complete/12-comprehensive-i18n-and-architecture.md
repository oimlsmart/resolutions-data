# 12 — Comprehensive i18n + architecture overhaul

User-reported gaps (2026-06-30), grouped into a single plan so that all
implementation sits inside one coherent refactor rather than 13 small ones.

This is a **planning + sequencing** document. Per-item deep dives live as
`TODO.complete/13-…` through `TODO.complete/25-…`. Audit notes for OOP /
MECE / DRY / OCP / single-source-of-truth are at the bottom.

---

## Items as reported

| # | Report |
| --- | --- |
| 3 | "We are missing 'The Committee' in some of the resolutions." |
| 4 | "The search filter is missing localization strings." |
| 5 | "Nothing called 'plenary' in OIML — it is either CIML or Conference, you are mixing meeting types up in a resolution." |
| 6 | "If a resolution has EN + FR versions, indicate both exist (can switch between en, fr, or en+fr together)." |
| 7 | "Dates need to be i18n." |
| 8 | "Action vocab like 'thanks', 'resolve' also need to be i18n." |
| 9 | "In encoding cities, use their city code and provide i18n names in one yaml file." |
| 10 | "When changing page, need to scroll to the top; ensure SSG fully renders." |
| 11 | "Consider SEO." |
| 12 | "On the resolutions page, the link to the meeting should show which type of meeting and the date range and location." |
| 13 | "Each of the resolutions page and the meetings page need to link back to the original PDF on the OIML site." |
| 14 | "We need to fully scrape the meeting-agendas on the CIML and Conference pages (the link is at the photo): https://www.oiml.org/en/structure/conference/sites and https://www.oiml.org/en/structure/ciml/sites . Use a YAML representation and a YAML schema to lock, and link resolutions that reference an agenda item to its title." |
| 15 | "Treat english and french both as first class citizens, not adding a yaml file just for french." |

### Additional context from followup
* Resolutions **2012 and onwards** are linked to agenda items. Pre-2012
  resolutions may have section titles but no agenda item number.
  `agenda_item` is therefore optional in `Resolution` — and the
  pre-2012 fallback title path ("The Committee took note of …" type
  narrative) needs to be detectable.

---

## Architectural principles applied

These drive every change below — and explain why the items cluster.

1. **Single source of truth.** Every piece of editor-controlled data
   lives in exactly one YAML file. UI string tables → `translations.yaml`.
   Body types & colors → `meeting-types.yaml`. Action colors →
   `action-types.yaml`. Cities (by code, with en/fr names) →
   `cities.yaml`. Agendas → `agendas.yaml` (new).
2. **No "plenary" anywhere.** A resolution is produced by exactly one
   body type (CIML or Conference). The badge that today reads
   "Plenary" / "Acclamation" must derive from `body_type` or
   `is_acclamation`, never from a literal English word that doesn't
   exist in the OIML vocabulary.
3. **Both languages are data fields, not file splits.** A city is
   `{ code, en, fr }`. An agenda item is `{ id, en_title, fr_title,
   topics: { en, fr } }`. The current
   `translations.{key}.{en|fr}` shape remains for short UI strings,
   but **entities** (cities, body types, action types, agenda items)
   carry their own i18n fields; this matches item 15 and lets a
   resource be referenced by id independently of language.
4. **MECE i18n fallbacks.** `t(key)` falls back through `lang → en →
   key` in `useI18n`. `formatDate(lang)` defaults to `'en'` if the
   language is missing.
5. **OCP for new languages.** Adding `de` to the YAML keys should
   require no code changes — only the new `de:` rows.
6. **DRY for the subject marker.** Today the parser recognizes
   `The Committee,` / `La Comité,` etc. in `extract_subject`. Each new
   verb prefix list duplicates the subject-strip logic. The "missing
   The Committee" report comes from `strip_meta_lines` removing subject
   marker text that `extract_subject` did not capture (e.g. when the
   marker is on a wrapped line or has invisible whitespace). Fix: move
   subject detection into a single `SubjectDetector` that returns the
   canonical language + body, and refactor `strip_meta_lines` to
   delegate to it.

---

## Sequencing (Phase A — this session)

High-impact, well-scoped changes that fit in a single edit pass:

| Item | File(s) | Effort |
| --- | --- | --- |
| 5 | `Home.vue`, `MeetingDetail.vue`, `ResolutionDetail.vue` — replace "Plenary" with `meetingTypes.short` / `meetingTypes.label` | S |
| 7 | `utils/format.ts` — `Intl.DateTimeFormat(lang)` based on `useI18n`; update call sites | S |
| 9 | `data/cities.yaml` — restructure to `cities: {CODE: {en, fr}}`; `venues.ts` reads by code | M |
| 10 | `router/index.ts` + `App.vue` — `scrollBehavior` to top on push; verify SSG renders all routes | S |
| 12 | `ResolutionDetail.vue` meeting-link badge — show `{body-type short} · {date range} · {venue}` | S |
| 13 | `meeting-types.ts` exposes `pdfUrl(id)`; link in `MeetingDetail.vue` and `ResolutionDetail.vue` | S |

Plus a final comprehensive localization sweep for any straggler UI
strings (item 4 follow-up).

## Sequencing (Phase B — follow-up sessions)

Larger architectural work that needs its own planning doc each:

| Item | Doc | Why deferred |
| --- | --- | --- |
| 3 | `TODO.complete/13-subject-detection.md` | Touches the parser; needs dry-run against the full 53 YAML corpus |
| 6 | `TODO.complete/14-bilingual-ui.md` | Touches `ResolutionDetail` `languageVersions` and EN/FR/EN+FR toggle; needs review of how `both` mode rendering interacts with the language persisted in localStorage |
| 8 | `TODO.complete/15-action-vocab-i18n.md` | 30+ action types × 2 langs; needs a translation table and `formatActionType()` rewrite |
| 11 | `TODO.complete/16-seo.md` | Per-page `<title>`, `<meta>`, OG, Twitter card, JSON-LD (`schema.org/legislation`); sitemap already exists; needs `@unhead/vue` audit |
| 14 | `TODO.complete/17-agenda-scraping.md` | Mini-site scraper (CIML 17 → 60 + Conf 4 → 17), YAML schema, agenda_item linkage |

## Sequencing (Phase C — model restructure)

Idempotent fixes to the data model that surface as cleaner code in A & B:

* Replace `subject` strings ("The Committee", "OIML Conference", "CIML", "Conférence OIML")
  with a `subject_kind: 'committee'|'conference'|'unknown'` enum +
  optional `subject_text` for prose ("The Bureau,"). Documented in
  `TODO.complete/18-subject-model.md`.
* Replace the `is_acclamation: boolean` field with an
  `adoption_kind: 'plenary'|'acclamation'|'ballot'|...` enum so the UI
  badges map directly to model fields without hard-coded English.
* Date ranges on meetings: `metadata.date_start` / `date_end` already
  exist; surface as `formatDateRange(start, end, lang)`.

---

## Per-item target state (so Phase A work is unambiguous)

### Item 5 — eliminate "Plenary" hard-coding
* Today: `Home.vue` line ~178 `<span class="std-results__type">Plenary</span>`,
  `ResolutionDetail.vue` template selector for `source_type === 'plenary'`.
* Target: every "type" badge on a resolution card / detail page derives
  from the **CIML/Conference body type** and the **adoption kind**
  (acclamation vs ordinary vote), not from a string. The badge text
  comes from YAML (`meetingTypes.short[lang]`, plus a new
  `resolution.adoptionKinds.{plenary,acclamation,ballot}.{en,fr}` map).

### Item 7 — date i18n
* `utils/format.ts` exports `formatDate(dateStr, lang)` and
  `formatDateRange(start, end, lang)`. Uses
  `Intl.DateTimeFormat(lang, …)`. `useI18n().lang` is passed in by
  every call site. Verified for both `'en'` and `'fr'`.

### Item 9 — cities by code
* New `cities.yaml`:
  ```yaml
  cities:
    BJS:
      en: Beijing
      fr: Pékin
    CPT:
      en: Cape Town
      fr: Le Cap
    # …
  ```
* Use **IATA city codes** as the natural id (3-letter; covers every
  OIML meeting venue in `manifest.yaml`). `manifest.yaml`'s
  `city:` field changes from "Cape Town" to "CPT".
* `venues.ts` looks up `citiesByCode[cityCode].lang` first, falls back
  to the raw string if the code is unknown.

### Item 10 — scroll-to-top + SSG render
* `router/index.ts` adds `scrollBehavior(to, from, savedPosition)`
  that returns `{ top: 0 }` for new routes and `savedPosition` for
  back/forward navigation.
* `App.vue` already calls `vite-ssg` render at build time; verify by
  checking that `dist/index.html` is non-empty and `dist/resolution/*`
  counts match the sitemap count. (After this work: 1696 URLs.)

### Item 12 — meeting-link badge shows type + date + venue
* `ResolutionDetail.vue` meeting-link badge displays:
  `CIML · 18–22 Oct 2016 · Strasbourg, France` (FR variant).
* Data shape: derived in `meetingTypes` helper
  `meetingSummary(sourceFile, lang)` → returns string.

### Item 13 — link back to original PDF
* `scripts/manifest.yaml` already carries `url:` per source. Surface
  in UI:
  * `MeetingDetail.vue` — "Original PDF" link in the header strip.
  * `ResolutionDetail.vue` — link in the source-urn bar.
* Long URLs use `committee.links.ciml` /
  `committee.links.conference` when the canonical PDF lives inside
  the meeting's mini-site rather than at the flat `pdf/*.pdf` path.

### Item 4 (closeout) — search filter strings
* `Home.vue` filter UI is mostly localized after commit 6671b84.
  Remaining: sort dropdown `<select>` `<option>` text, search hint,
  clear-search `×` aria-label, the `{{ searchQuery }}` chip quote.
* Add: `home.sortAriaLabel`, `home.clearSearchAriaLabel`.

---

## Audit — OOP / MECE / DRY / OCP / single source of truth

### MECE
* **Meeting type** and **adoption kind** are conceptually orthogonal
  but currently conflated: a "plenary" badge on a CIML meeting is
  redundant with the body-type badge (both color the same chip).
  Splitting them is the cleanup.
* `subject` strings are a single field carrying three different things:
  a body (`CIML`/`OIML Conference`), a vote (`The Committee`), or a
  context (`La Conférence,`). Either typed enum or a discriminated
  union fixes this.

### DRY
* `formatDate` and `formatDateShort` share a try/catch on `new Date()`
  construction. Lift into one helper.
* `useI18n` is implemented as module-singleton. `useMeetings` /
  `useResolutions` instances reach into localStorage directly. The
  singleton import pattern is correct here (one UI language, many
  consumers) but the precedent should be applied if more language-aware
  utilities are added later (e.g. `useDateFormat`).
* `mtStyle(id)` returns the same dict shape every call; could be
  memoized but the cost is negligible and the indirection helps
  reasoning.

### OCP
* Every YAML data file already follows OCP (add a row, don't edit
  code). Goal: extend that to agenda items and city codes — adding
  a 2017 CIML meeting with a new venue should not require code edits.

### Single source of truth
* `meeting-types.yaml` is the only owner of body colors. ✓
* `action-types.yaml` is the only owner of action colors. ✓
* `committee.yaml` is the only owner of OIML facts. ✓
* `countries.yaml` is the only owner of ISO 3166-1 codes + names. ✓
* `cities.yaml` is the only owner of city code → name (post-refactor). ✓
* Agendas will get `agendas.yaml` as their only owner. (Phase B.)

### Performance
* All YAML files are imported at build time through Vite's YAML
  plugin, so there's no runtime fetch. Bundle cost is the YAML size
  + JSON serialization. No hot-path concern.
* The `actions.data` is bounded (~30 types). A `Map<type, color>`
  lookup is O(1); no memoization needed.

### Architecture — what to extract
* `useDateFormat(lang)` composable that wraps `formatDate` /
  `formatDateShort` / `formatDateRange` with the current `lang`. Then
  `Home.vue`, `Meetings.vue`, `ResolutionDetail.vue` no longer need
  to import `formatDate` directly.
* `usePdfUrl(sourceFile)` composable returning the canonical OIML PDF
  URL. Keeps `committee.links` and the manifest `url:` field in one
  place.

---

## Verification plan

* `npm run build` exits 0.
* `dist/index.html` non-empty; sitemap URL count unchanged or grows.
* Per-page check (EN + FR):
  - Home shows "Browse Resolutions" / "Parcourir les résolutions".
  - MeetingDetail shows "Original PDF" link.
  - ResolutionDetail shows agenda item title (when present in 2012+).
  - Mobile breakpoint: scroll-to-top works.
* `vue-tsc -b` exits 0.
* Specs: add `specs/` directory with `vitest` if not present; cover
  the date formatter, meeting-summary helper, PDF URL composer, and
  YAML data correctness.

---

## Out of scope for this session

* Agenda mini-site scraper (item 14).
* Per-page SEO meta + structured data (item 11).
* Full action-vocab translation table (item 8) — this needs a
  linguist review by someone fluent in OIML terminology.
* Subject-detection rewrite (item 3) — the OCP/DRY refactor touches
  the parser and needs a dry-run against the full 1640-resolution
  corpus.
