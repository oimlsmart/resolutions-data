# 13 — Per-meeting single-file YAML with embedded EN+FR (item 15)

## Trigger
> "This is not acceptable, we need to have ciml-39-decisions.yaml that
> contains en/fr descriptions of multilingual text."

Currently every meeting has 2 (or 3, for bilingual PDFs) sibling
YAMLs:
```
resolutions/ciml-39-decisions-en.yaml
resolutions/ciml-39-decisions-fr.yaml
resolutions/conference-12-decisions-en.yaml   # 229 KB, EN half of bilingual PDF
resolutions/conference-12-decisions-fr.yaml   # FR half split out by author_yaml.rb
```

That violates the MECE principle: a meeting is one entity; the
language is a *property* of each resolution row, not a top-level
split. Re-rendering the same meeting in two YAMLs triples the
maintenance cost (the FR half can drift from the EN half in
identifiers, ordering, agenda_item tags).

## Target shape

One YAML file per meeting carrying BOTH languages, with the language
expressed as a row-level field:

```yaml
# ciml-39-decisions.yaml
metadata:
  title:
    en: 39th CIML Meeting — Decisions (EN)
    fr: 39e réunion du CIML — Décisions (FR)
  dates:
    - { start: '2004-10-26', end: '2004-10-29', kind: meeting }
  source: OIML CIML Secretariat (BIML)
  venue: Berlin, Germany
  city: BER
  country_code: DE
  language: en+fr
resolutions:
  - identifier: CIML/2004/1
    language: en
    title: Agenda item 1
    doi: 10.63493/resolutions/ciml200401
    urn: urn:oiml:doc:ciml:resolution:2004-1
    agenda_item: "1"
    subject: CIML
    actions:
      - type: notes
        message: |
          ...
        dates: [ { start: '2004-10-26', kind: effective } ]
  - identifier: CIML/2004/1
    language: fr
    title: "Point 1 de l'ordre du jour"
    ...
```

For narrative CIML 39–42, the section heading is the title for both
language versions (verbatim from the PDF).

For bilingual PDFs (CIML 43 and Conference 13), the YAML still ships
as one file with both EN and FR rows. The `metadata.language`
field annotates the source as `en+fr`; the OCR pipeline no longer
needs to split at the "# Résolutions" header.

## Routes / URLs

Currently the router carries the language in the path:
```
/meetings/ciml-39-decisions-en
/meetings/ciml-39-decisions-fr
/meetings/conference-12-decisions-en   # only EN half pre-rendered
/meetings/conference-12-decisions-fr
```

After this change, the path is language-free and the language is a
runtime UI preference stored in localStorage:
```
/meetings/ciml-39-decisions
/meetings/conference-12-decisions
```

The per-resolution UI on this page has a toggle to switch language
(en / fr / both) — that's item 6 work.

## Source-of-truth implications

| Touched | Change |
| --- | --- |
| `scripts/author_yaml.rb` | Single per-meeting emit; metadata.title becomes `{en, fr}`; resolutions carry `language` |
| `scripts/lib/transforms.mjs` | Emit flattened EN+FR rows; the JSON mirror reads one YAML per meeting |
| `scripts/build-data.mjs` | Iterate the new file list; key meetings by slug (no `-{en\|fr\|bilingual}` suffix) |
| `browser/src/composables/useMeetings.ts` | drop the `languageFromSourceFile` suffix logic; canonicalize by removing language |
| `browser/src/composables/useResolutions.ts` | Resolution.language becomes a row-level field, not a source-file property |
| `browser/src/router/index.ts` | `/meetings/:slug` (no language) |
| `browser/src/views/MeetingDetail.vue` | Render EN/FR resolution lists side-by-side or via toggle |
| `browser/src/views/ResolutionDetail.vue` | Resolve a single logical resolution across languages; add EN/FR/both toggle |

## Risks & sequencing

1. **External links break.** Any URL pointing to
   `resolutions/ciml-39-decisions-en` must redirect to
   `resolutions/ciml-39-decisions`. Either set up a static HTML
   redirect or commit 301 from old URLs. For SPA this is via
   vite-ssg `onPageRendered` hook or a route-level `redirect:`.
2. **Bilingual PDF authors.** Currently `author_yaml.rb` splits a
   bilingual PDF into two YAMLs. It now emits one YAML. The OCR
   markdown is already the source, so re-running it produces the
   new shape directly.
3. **`useResolutions` aggregation.** EN+FR resolutions of the same
   identifier are now sibling rows in the same source_file (matched
   by `language`). Use already does similar logic; just collapse the
   `languageFromSourceFile` indirection.
4. **Edoxen schema.** A resolution is a single document; we are
   hoisting language to row-level. The schema for en+fr resolutions
   needs to be reviewed.

## Migration plan

| Step | Owner | Risk |
| --- | --- | --- |
| 1. Update `author_yaml.rb` to emit the new shape | code | low — drop in next re-author |
| 2. Add redirects from old URLs to new URLs | router | medium — affects SEO |
| 3. Re-author all 51 source PDFs | scripts | medium — OCR is cached, so re-author is fast |
| 4. Delete the old `*-en.yaml` / `*-fr.yaml` files | cleanup | low |
| 5. Regenerate `public/data/{resolutions,meetings}.json` from the new YAMLs | build | low |
| 6. Update browser types and router to the single-slug model | code | medium |
| 7. ResolutionDetail language toggle | code | medium |
| 8. SEO: canonical URL per resolution (language may vary) | code | medium |

## Out of scope (for now)

* The EDOXEN schema validation against the new shape. The Edoxen
  schema at `https://raw.githubusercontent.com/metanorma/edoxen/...`
  uses a flat `resolutions` list; multiple languages per logical
  resolution are not in the schema. We're still schema-conformant if
  we treat each (identifier × language) pair as a separate Edoxen
  resolution.
* The site-wide language switcher in the header. Adding
  `language_from_url` to the meeting list will happen during step 7.
