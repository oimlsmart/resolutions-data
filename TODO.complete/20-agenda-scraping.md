# 20 — Item 14: agenda scraping + cross-link

## Symptom
"We need to fully scrape the meeting-agendas on the CIML and Conference
pages (the link is at the photo):
https://www.oiml.org/en/structure/conference/sites
https://www.oiml.org/en/structure/ciml/sites
Use a YAML representation and a YAML schema to lock, and link
resolutions that reference an agenda item to its title."

## Sample agenda
CIML 58th (https://58ciml.oiml.org/ciml.html):

```
Item | Description | Addenda | PowerPoints
1    | Opening remarks and roll call
2    | Adoption of the agenda
3    | Approval of the minutes of the 57th CIML Meeting
4    | Report by the CIML President
...
11   | OIML publications and technical activities
11.1 | Publications for approval by the CIML
11.2 | Project proposals for approval by the CIML
...
16   | Election and decisions on the renewal of contracts (secret ballots)
16.1 | Election of the CIML Second Vice-President (2023–2029)
16.2 | Decision on the renewal of the contract of Mr Anthony Donnellan, BIML Director
16.3 | Decision on the renewal of the contract of Mr Ian Dunmill, BIML Assistant Director
...
```

User direction: "we don't need the links to the documents."

## Domain model

```yaml
# browser/src/data/agendas.yaml
agendas:
  - source_file: ciml-58-resolutions
    source_url: https://58ciml.oiml.org/ciml.html
    scraped_at: '2026-06-30'
    items:
      - number: "1"
        description:
          - { language_code: eng, content: "Opening remarks and roll call" }
          - { language_code: fra, content: "..." }
        sub_items: []
      - number: "11"
        description:
          - { language_code: eng, content: "OIML publications and technical activities" }
        sub_items:
          - number: "11.1"
            description: [...]
```

## Cross-link to resolutions

Resolution YAML already has `agenda_item: "11.2"`. Browser resolves:

```ts
const agendaItem = findAgendaItem(resolution.source_file, resolution.agenda_item)
// → { number: "11.2", description: "Project proposals for approval by the CIML" }
```

ResolutionDetail.vue renders:
```
Agenda item 11.2 — Project proposals for approval by the CIML
```

## Scraper

`scripts/scrape_agendas.rb`:
1. Read `scripts/manifest.yaml` → list of meetings.
2. For each meeting, fetch the mini-site URL (e.g.
   `https://58ciml.oiml.org/ciml.html`).
3. Parse the agenda table (likely an HTML `<table>` with Item /
   Description columns).
4. Extract items + sub_items.
5. Fetch the FR variant (`https://58ciml.oiml.org/fr/ciml.html` or
   similar) for translations.
6. Append to `agendas.yaml`.

## Mini-site URL discovery

The CIML/Conference index pages
(https://www.oiml.org/en/structure/ciml/sites) list each meeting
with a photo that links to the mini-site. The scraper needs to:
1. Fetch the index page.
2. Find each meeting's photo link.
3. Follow to the mini-site.
4. Find the agenda sub-page (usually `/ciml.html` or `/agenda.html`).

## Files touched
- `scripts/scrape_agendas.rb` — new
- `scripts/manifest.yaml` — add `mini_site_url:` per meeting
- `browser/src/data/agendas.yaml` — generated data file
- `browser/src/data/agendas.ts` — typed wrapper (already exists)
- `browser/src/types/agenda.ts` — already exists, extend with
  LocalizedText for description
- `browser/src/views/ResolutionDetail.vue` — render agenda item title
- `browser/src/views/MeetingDetail.vue` — render full agenda list

## Schema
A separate JSON Schema for agendas.yaml:
```yaml
# scripts/schemas/agenda.yaml
type: object
properties:
  agendas:
    type: array
    items:
      type: object
      properties:
        source_file: { type: string }
        source_url: { type: string }
        scraped_at: { type: string, format: date }
        items:
          type: array
          items: { $ref: "#/$defs/AgendaItem" }
$defs:
  AgendaItem:
    type: object
    properties:
      number: { type: string }
      description:
        type: array
        items:
          type: object
          properties:
            language_code: { type: string, pattern: "^[a-z]{3}$" }
            content: { type: string }
      sub_items:
        type: array
        items: { $ref: "#/$defs/AgendaItem" }
    required: [number, description]
```

## Scope note
This is the largest single item. Each meeting mini-site has a
different HTML structure (some are static HTML, some are CMS-driven).
A proper scraper needs per-site adapters. Estimated effort:
- 1 scraper framework + 6 site adapters (one per meeting era): 1 day.
- Cross-link to resolutions + UI rendering: ½ day.
- Schema + validator: ½ day.

## Verification
- For each meeting with `mini_site_url`, `agendas.yaml` has a
  corresponding entry.
- For each resolution with `agenda_item: "N.M"`, the agenda lookup
  succeeds.
- ResolutionDetail page shows the agenda title next to the
  agenda_item number.
