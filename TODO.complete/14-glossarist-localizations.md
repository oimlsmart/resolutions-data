# 14 — Glossarist-style localizations[] for OIML Resolutions

User direction (2026-06-30): adopt glossarist's multilingual pattern.

## Decisions confirmed

* **Option 2** — one file per meeting, each resolution carries a
  `localizations: [...]` array (rather than per-row `language:` tag +
  Localizable text arrays).
* **ISO 639-3** language codes (`eng`, `fra`) instead of ISO 639-1
  (`en`, `fr`). Three-letter codes match ISO/TC 37 terminology
  standards and remove ambiguity (e.g. `fr` could be French or Farsi).
* **ISO 15924** script codes (`Latn`, `Cyrl`, `Hant`, `Arab`) on each
  localization row. Today every OIML document is `Latn` but the schema
  accommodates Cyrillic/Arabic translations later without restructure.

## Target YAML shape

```yaml
# resolutions/ciml-39-decisions.yaml
metadata:
  identifier: ciml-39
  dates:
    - { start: '2004-10-26', end: '2004-10-29', kind: meeting }
  venue: Berlin, Germany
  city: BER
  country_code: DE
  source_urls:
    - { ref: "...english.pdf", format: pdf, language_code: eng }
    - { ref: "...french.pdf",  format: pdf, language_code: fra }
resolutions:
  - identifier: CIML/2004/1
    doi: 10.63493/resolutions/ciml200401
    urn: urn:oiml:doc:ciml:resolution:2004-1
    agenda_item: "1"
    dates: [{ start: '2004-10-26', kind: effective }]
    localizations:
      - language_code: eng
        script: Latn
        title: Approval of the minutes of the 38th CIML Meeting
        subject: CIML
        considerations:
          - type: having_regard_to
            message: Having regard to...
        actions:
          - type: approves
            message: Approves the minutes...
      - language_code: fra
        script: Latn
        title: Approbation du procès-verbal de la 38e réunion du CIML
        subject: CIML
        considerations: [...]
        actions: [...]
```

## Compared to the previous `{content, lang}` approach

| Aspect | Old (committed in 83cac73) | New (glossarist-style) |
|---|---|---|
| Language tag location | Per-resolution row | Per-localization row |
| Text encoding | `title: [{content, lang}, ...]` | `title: "English text"` (plain) |
| Number of rows per resolution | 1 per language | 1 canonical + N localizations |
| Action/consideration text | `{content, lang}` per row | Plain string per localization |
| Schema complexity | Localizable everywhere | Plain strings; Localization is the multi-language envelope |

## Schema changes (~/src/mn/edoxen/schema/edoxen.yaml)

1. **Resolution** keeps language-agnostic fields: `identifier`,
   `doi`, `urn`, `agenda_item`, `dates`, plus a new
   `localizations: [Localization]` array.
2. **New `Localization` def**: `{language_code, script, title,
   subject, message, considering, considerations[], actions[],
   approvals[]}` — all text fields are plain strings because each
   Localization is monolingual.
3. **Localizable** `$def` removed — no longer needed.
4. **Metadata.title** becomes plain string again (the meeting's
   canonical title); language-specific titles live inside each
   Localization (e.g. as the first action's preamble).

## Parser changes (scripts/author_yaml.rb)

* For each meeting, group resolutions by `identifier` across all
  source PDFs (EN, FR).
* For each unique identifier, emit ONE Resolution with multiple
  Localization rows (one per language found).
* Each action/consideration's `message` becomes a plain string inside
  the appropriate Localization.

## Build pipeline (browser/scripts/lib/transforms.mjs)

* `buildResolutionRecord` flattens each `(resolution, localization)`
  pair into a JSON row keyed by `(source_file, identifier,
  language_code)` so the browser still gets one JSON record per
  resolution × language.
* `pickLocalizable` removed — plain strings everywhere.

## Browser code

* `Resolution` type: title/subject/actions/considerations back to
  plain strings (per-row language tag from the JSON record).
* `useResolutions` lookup unchanged.
* The "EN / FR / both" toggle on the detail page reads the row's
  language from the `language` field.
