# 07 — Empty-body resolutions + complete bilingual UI

## Triggers
User-reported issues on http://localhost:5173/resolutions-data/:
1. Conference-2025-07 had no preview in the index.
2. Resolution page showed raw "HAVING_REGARD_TO" as the consideration type.
3. Meetings page body-type filter crowded the search bar (no margin).
4. `conference-16-resolutions-fr` and `-en` appeared as two separate meetings.
5. French UI mode showed English text on Home, Meetings, About, footer.

## Root causes & fixes

### Parser fix: GLM-OCR markdown headers inside resolution bodies
OCR renders verbs as `## Resolves`, `## Instructs the Bureau to` etc. inside a
single resolution body. My parser was skipping all `##`-prefixed lines as
section breaks, dropping the entire action content. Fixed in `strip_meta_lines`
— leading `#{1,6}\s+` is now stripped before classification, so the verb is
recognized.

Added missing action verbs: `Appoints`, `Establishes`, `Proclaims`, `Confirms`,
`Instructs the Bureau to` (and variants). Added consideration verb `Following
the recommendation`.

Result: 532 → 458 zero-action resolutions; total actions 1,747 → 1,902 (+155).
CIML/2025/42 (`Appoints ... Members of Honour`) and CIML/2018/6 (`Appoints LG
Audits & Conseils`) now parse correctly.

### Snippet fallback (#1)
`transforms.mjs` snippet computation now falls back to the first consideration
message, then to the title, when no action is available. Conference-2025-07
now has a meaningful preview.

### Type display normalization (#2)
New `utils/actionType.ts` `formatActionType()` maps snake_case semantic types
to humanized labels (`having_regard_to` → "Having regard to", `noting` →
"Noting", etc.). Wired into ResolutionDetail for consideration + action cards.

### Body-type filter spacing (#3)
`filter.css` adds `.std-filter__field--body` margin/padding/border so the
body-type row doesn't crowd the search bar.

### Meeting dedup (#4)
`useMeetings` now groups source files by `canonicalMeetingId` (strips `-en` /
`-fr` suffix). Each group becomes one Meeting record whose primary
source_file is chosen based on the current UI language. The list now shows
27 unique meetings instead of 53 (with EN/FR duplicates).

### Full bilingual UI (#5)
- `translations.ts` expanded with `committee.{name,title,scope,tagline}`,
  `about.*`, `footer.*`, `meeting.{ciml,conference,meetingUrn,meetingDoi}`,
  `resolution.{back,subject,...}`, `meetings.*`.
- `Home.vue`: hero lines, subtitle (with interpolation), 4 stat labels,
  loading text, search placeholder.
- `Meetings.vue`: title, subtitle, search placeholder, body/year/country
  filter labels, body-type chip labels, count line.
- `MeetingDetail.vue`: body-type badge, DOI/URN bar labels, back link.
- `ResolutionDetail.vue`: back link, Subject/Considerations/Actions
  headings, language-toggle label, "Version française" secondary heading.
- `About.vue`: hero title + subtitle, "About the OIML" heading, committee
  title + scope, all four technical-information subheadings, the
  details/summary title.
- `App.vue` footer: section headings (Committee/Explore/Links), fact labels
  (Secretariat/Established/Member States/Corresponding Members), logo
  subtitle (committee title in FR), "Official website" link label.

## Verification
- Local `npm run build` exits 0 (1,696 sitemap URLs)
- CIML/2025/42 snippet: "Appoints - Dr Charles Ehrlich, ..."
- Conference-2025-07 snippet: "Resolves: a) The overall amount of credits ..."
- Meeting list: 27 unique entries (was 53)

## Outputs
- `scripts/author_yaml.rb` (## stripping + 7 new verbs + Following recommendation)
- `browser/scripts/lib/transforms.mjs` (snippet fallback)
- `browser/src/utils/actionType.ts` (new)
- `browser/src/views/{Home,Meetings,MeetingDetail,ResolutionDetail,About}.vue`
- `browser/src/App.vue`
- `browser/src/data/translations.ts` (expanded)
- `browser/src/composables/useMeetings.ts` (canonicalMeetingId dedup)
- `browser/src/assets/css/filter.css`
