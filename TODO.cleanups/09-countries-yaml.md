# 09 — ISO 3166 country codes + YAML-driven bilingual rendering

## Trigger
User feedback: *"Don't you think we should support this bilingual system
when we add additional locations? i.e. use iso 3166 codes, then render in
english/french in code (defined in some YAML file)."*

The hardcoded venue strings + ad-hoc venue-translation tables weren't
scalable. Refactored to a canonical-code-based data model.

## Design

### Data model
- Manifest stores `city` (free text) + `country_code` (ISO 3166-1 alpha-2).
- The `venue` field is kept for backward compatibility but is now derived
  from `city + ", " + countryName(country_code, 'en')` at build time.
- Adding a new meeting venue: pick the city + ISO code, both fields update
  automatically. No per-language string edits.

### Country table
- `browser/src/data/countries.ts` — comprehensive ISO 3166-1 list with
  English and French names for 136 countries. (Started as a YAML file but
  TypeScript imports more cleanly with Vite's default config — no extra
  loader needed.)
- Adding a new country is a one-line table edit.

### Rendering
`browser/src/data/venues.ts` `venueForLang()`:
- Preferred form: `venueForLang(city, countryCode, lang)` returns
  `"Berlin, Allemagne"` for FR.
- Legacy form: `venueForLang("Berlin, Germany", lang)` for any old
  string-shaped venues still in the data — country name is matched
  against the EN side of the table and translated.
- Small `CITY_FR` map handles the handful of cities whose names actually
  differ in FR (Vienna → Vienne, Cape Town → Le Cap, etc.). Most don't.

## Changes

### Manifest
- All 51 sources now carry `city` and `country_code` derived from their
  existing venue string via the existing `countryFlags.ts` map. Online
  meetings get empty city + country_code.

### YAML metadata
`author_yaml.rb` emits both fields in the metadata block:
```yaml
metadata:
  venue: "Mombasa, Kenya"   # legacy/display
  city: Mombasa
  country_code: KE
```

### Browser pipeline
- `transforms.mjs`: passes `city` + `country_code` through to resolutions JSON.
- `build-data.mjs`: same for meetings.json.
- `resolution.ts`: Meeting and Resolution interfaces gain `city` and
  `country_code` fields.
- `useMeetings.ts`: primary record carries the new fields.
- `Meetings.vue` + `MeetingDetail.vue`: call
  `venueForLang(city, country_code, lang)` with a fallback to the legacy
  string form for any source that doesn't yet have structured data.

## Verification
- 136 country EN/FR pairs in the built venues JS chunk (Allemagne, Chine,
  Thaïlande, République tchèque, Viêt Nam, Roumanie, etc.)
- Local build exits 0
- EN: "Chiang Mai, Thailand", "Prague, Czech Republic"
- FR (runtime): "Chiang Mai, Thaïlande", "Prague, République tchèque"

## Future
- When the country table needs to grow (rare), edit
  `browser/src/data/countries.ts` — one place, both languages.
- Cities are still mostly free-text. If a city needs EN/FR variants,
  add it to `CITY_FR` in venues.ts. (Could be promoted to its own table
  if the list grows.)
