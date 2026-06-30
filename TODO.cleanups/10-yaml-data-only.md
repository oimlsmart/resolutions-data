# 10 — YAML for all editable data; agenda_item as title

## Trigger 1: YAML-only data
User direction: *"For data/user input we ONLY WANT YAML."*

The `browser/src/data/*.ts` files were a mix of data and logic. Refactored
to enforce the separation: pure data → YAML; code/logic → TypeScript.

## Trigger 2: agenda_item as title
User direction: for `60ciml_resolutions.pdf`, every resolution has an
`Agenda item N` line. *"'Agenda item 1' should be considered the title."*

`author_yaml.rb` now uses `Agenda item N` as the resolution title when
`agenda_item` is present, falling back to the verb-led synthesis only when
no agenda item is recorded.

## YAML files added (source of truth for data)

| File | Content | Entries |
|---|---|---|
| `countries.yaml` | ISO 3166-1 alpha-2 → {en, fr} | 136 |
| `committee.yaml` | OIML identity facts + links | 11 fields |
| `translations.yaml` | UI string table EN/FR | 73 keys |
| `action-types.yaml` | semantic type → {bg, text} colors | 31 types |
| `country-flags.yaml` | legacy country-name → ISO code map | 33 names |
| `cities.yaml` | city EN → FR overrides (only where they differ) | 13 cities |

## TypeScript wrappers (logic + types only)

Each `*.ts` file now does nothing but:
1. Import the YAML module
2. Re-export with proper TypeScript types
3. Provide any functions that operate on the data

| File | Keeps |
|---|---|
| `countries.ts` | `CountryNames` type, `COUNTRIES` constant |
| `committee.ts` | `Committee` type |
| `translations.ts` | `Language`, `TranslationKey`, `interpolate()` |
| `actionTypes.ts` | `getActionColor()` function |
| `countryFlags.ts` | `venueToCountryCode()`, `venueToFlag()`, `countryCodeToFlag()` |
| `venues.ts` | `countryName()`, `venueForLang()` |

## Vite plugin

- Installed `@modyfi/vite-plugin-yaml` (Vite 6-compatible; the older
  `vite-plugin-yaml` only supports Vite ≤5).
- Wired into `vite.config.ts` plugins.
- Added `browser/src/yaml.d.ts` so TypeScript accepts `import x from '*.yaml'`.

## Agenda item as title

`author_yaml.rb parse()` now computes the title as:
```ruby
title = agenda_item ? "Agenda item #{agenda_item}" : synthesize_title(acts)
```

Example: `CIML/2025/01` → title `Agenda item 1` (was previously a verb-led
snippet like "Thanks His Excellency Fahad M. Al Ruwaily ...").

## Verification
- Local build exits 0 (1,696 sitemap URLs)
- `Agenda item 1` confirmed as title on the resolution detail page
- Committee data (OIML name, FR title) loaded from YAML at runtime
- Country FR translations still bundled correctly (Allemagne, Chine, etc.)
