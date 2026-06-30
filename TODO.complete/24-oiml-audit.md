# 24 — OIML Resolutions browser audit (2026-07-01)

A focused audit of the OIML Resolutions browser (not edoxen). Findings
are grouped by surface; each notes impact + cost to fix.

This document is a companion to `TODO.complete/15-audit.md` which
covers the broader architecture including edoxen, edoxen-model, and
the documentation site. Items there that are still open (e.g. agenda
scraper, JSON-LD structured data) are referenced here only when they
have an OIML-specific dimension.

## Surface map

```
/meetings                      Meetings index — timeline + filters
/meetings/<slug>               Meeting detail — list of resolutions
/resolution/<id>               Resolution detail — bilingual toggle
/                              Home — search + filter + paginated results
/about                         About — committee + schema docs
```

## Findings (2026-07-01)

### F1 — Hard-coded English in views (medium impact, low cost)

Sweep through every `*.vue` and confirm every user-visible string
routes through `t()`. As of this audit the only remaining pockets
are:

- `About.vue` lines 88–118 — the Edoxen code-block example. Pure
  technical demo. Acceptable to leave English; translators can flag.
- `About.vue` lines 130–210 — the technical "lifecycle / URN /
  DOI" prose. Acceptable to leave English.

All other UI strings (header, nav, filters, chips, action vocab,
empty states, dates) are localized.

### F2 — "Plenary" vocabulary (high impact, low cost)

Removed in commit `3f6b0af`. The chip now shows body type (CIML or
CONF) and a language chip (English/French).

There is no remaining "Plenary" reference in any user-visible
surface.

### F3 — EN + FR rows on the same meeting page (high impact, low cost)

Single-file-per-meeting YAML (commit `83cac73`) + build-data.mjs
flatten produces one JSON row per (resolution × language). The
MeetingDetail page renders all rows for the meeting — which today
means each EN row and its FR counterpart appear as adjacent cards
with the language chip disambiguating them.

This satisfies the user's "English and French resolutions MUST be on
the same page" requirement.

Remaining nicety: a "group EN + FR siblings under one card" view
would halve the visible count and is tracked separately in
`TODO.complete/17-bilingual-ui.md`.

### F4 — Country names not localized in the filter (medium impact, low cost)

Fixed in commit `3f6b0af`. Country chips use `countryName(code, lang)`
via the COUNTRIES table.

### F5 — Date range on meeting-link badge (low impact, low cost)

Implemented in commit `defe9b3` via `formatDateRange(start, end, lang)`.

### F6 — Action vocab i18n (high impact, low cost)

Implemented in commit `68c8e65`. The 46 action types now have
`labels: { eng, fra }` and a `getActionLabel(type, lang)` helper.

### F7 — Glossarist-style localizations[] (high impact, high cost)

Implemented across commits `83cac73` and `953b840`.

### F8 — URL redirects for legacy /-en/-fr routes (high impact, low cost)

Implemented in commit `68c8e65`. 112 redirect stubs generated at
build time.

### F9 — Date i18n (high impact, low cost)

Implemented in commit `defe9b3`. `formatDate(d, lang)` uses
`Intl.DateTimeFormat`.

### F10 — Source PDF link (medium impact, low cost)

Implemented in commit `defe9b3`.

### F11 — Subject detection (low impact, low cost)

Implemented in commit `922cbbd`. Lenient parser now tolerates
whitespace + trailing punctuation.

### F12 — Meeting summary (low impact, low cost)

Implemented in commit `defe9b3`. `meetingSummary(sourceFile, lang, m)`
composes `{body short} · {date range} · {venue}`.

### F13 — Bilingual UI toggle (medium impact, medium cost)

Implemented in commit `922cbbd`. URL `?lang=` + localStorage
persistence.

### F14 — Branded value types (low impact, low cost)

Implemented in commit `922cbbd`. `Doi`, `Urn`, `Iso639Code`, etc.

## Still open

### O1 — Agenda scraping (item 14)

Per `TODO.complete/20-agenda-scraping.md`. The CIML-58 entry exists
in `agendas.yaml` as a hand-authored seed. Need:
- A scraper that walks each per-meeting mini-site
  (https://NNciml.oiml.org/ciml.html, etc.) and extracts the
  numbered agenda items.
- Per-site HTML adapters (different years have different layouts).
- Wire `findAgendaItem(source_file, agenda_item)` into
  `ResolutionDetail.vue` to show the agenda title next to the
  `agenda_item` field.

Estimated effort: 1–2 days.

### O2 — JSON-LD structured data (item 11 deep)

Per `TODO.complete/19-seo.md`. The `vite.config.ts onPageRendered`
hook already injects canonical URLs + hreflang. Still needed:
- `schema.org/Legislation` JSON-LD on each `/resolution/<id>` page.
- `schema.org/Event` JSON-LD on each `/meetings/<slug>` page.

Estimated effort: ½ day.

### O3 — Shared components (architecture)

Per `TODO.complete/23-architecture-improvements.md` §4. Views
duplicate `<ActionChips>`, `<MeetingLinkBadge>`, `<UrnCopyBar>`,
`<BodyTypeBadge>`, `<ResolutionRow>` markup 2–3× each. Extract to
`browser/src/components/`. Estimated effort: 1 day.

### O4 — Adoption kind enum

Per `TODO.complete/23-architecture-improvements.md` §2. Today the
field is `is_acclamation: boolean` — should be `adoption_kind:
'plenary' | 'acclamation' | 'ballot' | 'ma'` enum. Schema + parser
+ browser types coordinated change. Estimated effort: 4 hours.

### O5 — Tests (items 22 L4–L6)

Per `TODO.complete/22-specs.md`. L1 (YAML validation) + L3
(transform unit tests) done. Still open: L4 (composable specs),
L5 (component specs), L6 (e2e). Estimated effort: 14 hours.

## Architecture observations

### Good shape

- Per-meeting single-file YAMLs (glossarist localizations pattern)
- YAML data files + thin TS wrappers (cities, meeting-types,
  action-types, countries, translations)
- Branded value types in `domain/branded.ts`
- SSG pre-renders all 1,546 URLs
- 112 legacy URL redirects keep inbound links live
- Schema validation in CI (`scripts/specs/yaml_validation_spec.rb`)
- 38 unit tests pass (`npm test`)

### Areas to refactor (next-quarter investment)

- Views duplicate rendering logic; extract shared components.
- `is_acclamation: boolean` → `adoption_kind` enum.
- Type duplication between `Meeting` and `Resolution` interfaces.
- Magic-string action verbs in parser; move to YAML registry.
- ResolutionDetail chunk is 782 KB (mostly `@asciidoctor/core`);
  lazy-load when there's no rich-text content.
