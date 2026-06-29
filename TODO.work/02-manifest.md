# 02 — Manifest

## Goal
Produce a single source of truth for fetch + OCR drivers.

## Input
- `TODO.work/01-discovery.md` (full URL inventory + naming patterns)

## Done
Wrote `scripts/manifest.yaml` with **51 entries**, every source as a one-line
flow-mapping for compactness:

```yaml
- { kind: ciml, meeting: 39, year: 2004, venue: "Berlin, Germany",
    doc_kind: decisions, lang: en,
    title: "39th CIML Meeting — Decisions (EN)",
    url: "https://www.oiml.org/en/structure/ciml/pdf/39-ciml-decisions-english.pdf",
    slug: ciml-39-decisions-en }
```

Field semantics documented in the file header. Slug pattern:
- CIML 39–42: `ciml-{N}-decisions-{lang}`
- CIML 43: `ciml-43-resolutions-bilingual`
- CIML 44–60: `ciml-{N}-resolutions-{lang}` (normalized for 60)
- Conf 12: `conference-12-decisions-{lang}` (EN tagged `decisions-joint-ciml-dc`)
- Conf 13: `conference-13-resolutions-bilingual`
- Conf 14–17: `conference-{N}-resolutions-{lang}` (normalized for 17)

## Counts
```
entries: 51
ciml: 41       (22 meetings; 39–42 decisions, 43 bilingual, 44–58 pairs, 59–60 EN-only)
conference: 10 (6 sessions; 12 asymmetric pair, 13 bilingual, 14–16 pairs, 17 EN-only)
by lang: {"en" => 26, "fr" => 23, "bilingual" => 2}
```

## Multilingual note
The `lang` field describes the *source PDF*. The user noted that "a resolution
can be multilingual" — meaning a single logical resolution (identified in the
future Edoxen YAML by an URN + identifier) may have parallel EN/FR text that
needs to live together in one record. This is a downstream concern; for the
OCR phase, each PDF produces one OCR artifact (per user direction #4).

## Issues / notes
- CIML 59 and 60: no FR published. Will be re-checked if a FR version surfaces.
- Conf 12 EN/FR: asymmetric content (EN is broader, joint with 39th CIML + DC).
  Both kept; `doc_kind: decisions-joint-ciml-dc` flags the EN side.
- Slug normalization: original filenames like `60ciml_resolutions.pdf` and
  `17conference_resolutions.pdf` (newer Plone naming) are normalized to
  `ciml-60-resolutions-en` / `conference-17-resolutions-en` for repo consistency.
  The original URL is preserved in the `url` field.

## Outputs
- `scripts/manifest.yaml` (51 sources)

## Next
Phase 03 — write `scripts/fetch_pdfs.rb` and run.
