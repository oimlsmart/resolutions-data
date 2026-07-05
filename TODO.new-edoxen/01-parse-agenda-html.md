# 01 — Parse agenda HTML into structured YAML

## Goal
Extract agenda items (label, title, kind, outcome) from the 22 mini-site
HTML files under `reference-docs/ocr/agendas/` and store as
`agendas/ciml-{N}.yaml` and `agendas/conference-{N}.yaml`.

## Approach
Each mini-site HTML has different structure (Plone CMS pages, static
frameset pages, custom CMS). Write a Ruby script that:
1. Reads each HTML file
2. Extracts the agenda/schedule section
3. Parses agenda item numbers + titles
4. Emits edoxen-model Agenda YAML

## Output format (per `edoxen-model/models/agenda.lutaml`)
```yaml
status: final
source_doc: https://berlin.oiml.org/schedule.htm
items:
- label: '1'
  kind: opening
  title: Opening of the meeting
  outcome: adopted
- label: '2'
  kind: numbered
  title: Approval of the agenda
  outcome: adopted
- label: '9'
  kind: aob
  title: Any Other Business
```

## Mini-site formats
- berlin.oiml.org: frameset with schedule.htm (table-based)
- lyon.oiml.org through 58ciml.oiml.org: modern Plone pages
- 59ciml, 60ciml-17conf: OIML main site pages

## Done criteria
- [ ] All 22 HTML files parsed
- [ ] `agendas/ciml-{39..60}.yaml` written
- [ ] `agendas/conference-{12..17}.yaml` written
- [ ] Each agenda has ≥3 items
