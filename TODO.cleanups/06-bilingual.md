# 06 — Bilingual UI (EN/FR) + per-resolution language toggle

## Goal
Make the site bilingual English/French at the UI level, and add a per-resolution
language toggle that lets users switch between EN, FR, or EN/FR when both
versions are available.

## Done

### i18n infrastructure
- `browser/src/composables/useI18n.ts`: manages current language (`'en' | 'fr'`),
  persisted to `localStorage`, defaulting to the browser's preferred language.
  Exposes `t(key)`, `lang`, `setLang`, and `toggleLang`.
- `browser/src/data/translations.ts`: bilingual string table covering nav,
  hero, search, filters, about, footer. Includes an `interpolate()` helper
  for `{placeholder}` templates.

### Header language toggle
`App.vue`: an EN / FR pill toggle sits in the site-header actions area
(before the theme toggle). Selecting a language persists the choice and
re-renders all translated strings. The HTML `lang` attribute is updated
on the root element for accessibility / search engines.

### Nav labels translated
Nav links (desktop + mobile) switched from hardcoded English to `t('nav.*')` calls.

### Meeting type badges + DOI (related cleanup)
- `Meeting.doi` + `Meeting.language` fields added to the type + computed
  in `useMeetings` from the source-file slug.
- `transforms.mjs` exports `bodyTypeFromSourceFile`, `languageFromSourceFile`,
  and `buildMeetingDoi` (parses slug → `10.63493/meetings/ciml<N>` or
  `conf<N>`).
- `build-data.mjs` now emits a separate `public/data/meetings.json` with
  body_type, language, and doi per meeting.
- `Meetings.vue` (timeline list): each row shows a body-type chip
  (CIML blue / Conference teal).
- `MeetingDetail.vue`: prominent body-type badge in the header, plus a
  DOI bar (linked to doi.org) above the existing URN bar.

### Per-resolution language toggle
- `transforms.mjs`: each resolution record now carries a `language` field
  derived from the source-file slug suffix.
- `ResolutionDetail.vue`:
  - Detects all language versions of the current resolution by grouping
    on `identifier`.
  - Shows an EN / FR / EN-FR toggle pill at the top of the page when
    both languages are available.
  - Defaults to the current UI language.
  - In EN-FR mode, the French version is rendered as a secondary section
    below the primary English content (with a teal FR badge).

## Verification
- Local `npm run build` exits 0 (1,696 sitemap URLs, 895 routes).
- Sample: CIML/2008/1 has EN+FR versions → toggle appears.
- Sample: Conference/2025/01 only EN → no toggle.

## Outputs
- `browser/src/composables/useI18n.ts` (new)
- `browser/src/data/translations.ts` (new)
- `browser/src/types/resolution.ts` (Meeting.doi/language, Resolution.language)
- `browser/src/composables/useMeetings.ts` (language/DOI helpers)
- `browser/scripts/lib/transforms.mjs` (body/language/DOI helpers)
- `browser/scripts/build-data.mjs` (now emits meetings.json)
- `browser/src/App.vue` (header lang toggle, translated nav)
- `browser/src/views/{Meetings,MeetingDetail,ResolutionDetail}.vue`
- `browser/src/assets/css/{header,resolution}.css` (toggle + badge styles)
