# 02 — Ruby script: convert to new edoxen-model format

## Goal
Write `scripts/convert_to_edoxen_model.rb` that reads our current
`meetings/*.yaml` + `resolutions/*.yaml` + `agendas/*.yaml` and emits
the new edoxen-model `MeetingCollection` format with embedded
`Agenda` + `Decision[]`.

## Input
- `meetings/*.yaml` (58 meeting YAMLs in current format)
- `resolutions/*.yaml` (56 merged resolution YAMLs with localizations[])
- `agendas/*.yaml` (from phase 01)

## Output
`edoxen-data/meetings/ciml-{N}.yaml` and
`edoxen-data/meetings/conference-{N}.yaml` in the new format:

```yaml
identifier:
- prefix: CIML
  number: '44'
urn: urn:oiml:ciml:meeting:ciml-44
ordinal: 44
type: plenary
status: completed
date_range:
  start: '2009-10-27'
  end: '2009-10-30'
venues:
- kind: physical
  unlocode: KEMBA
  country_code: KE
  room: ''
general_area: Mombasa, Kenya
city: KEMBA
country_code: KE
committee: CIML
source_urls:
- ref: https://...
  format: pdf
  language_code: eng
  kind: decisions_pdf
agenda:
  status: final
  items:
  - label: '1'
    kind: opening
    title: Opening of the meeting
    outcome: adopted
decisions:
- identifier:
  - prefix: CIML
    number: '2009/1'
  kind: resolution
  status: decided
  doi: 10.63493/resolutions/ciml200901
  urn: urn:oiml:doc:ciml:resolution:2009-01
  agenda_item: '1'
  dates:
  - date: '2009-10-27'
    type: decided
  localizations:
  - language_code: eng
    title: The Committee instructed...
    subject: CIML
    actions:
    - type: instructs
      message: |
        The Committee instructed...
localizations:
- language_code: eng
  title: 44th CIML Meeting — Resolutions (EN)
  general_area: Mombasa, Kenya
- language_code: fra
  title: 44e réunion du CIML — Résolutions (FR)
  general_area: Mombasa, Kenya
```

## Key mappings (old → new)
| Old field | New field |
|---|---|
| `resolutions[]` (per-YAML) | `decisions[]` (per-meeting) |
| `metadata.title` | `localizations[].title` |
| `metadata.title_localized[]` | `localizations[].title` |
| `resolution.identifier` (string) | `decision.identifier[]` (StructuredIdentifier) |
| `resolution.localizations[]` | `decision.localizations[]` (same shape) |
| `meeting.resolution_refs[]` | (embedded — no refs needed) |

## Done criteria
- [ ] Script runs cleanly on all 58 meetings
- [ ] Output validates against the new edoxen gem schema
- [ ] No data loss (resolution count matches)
