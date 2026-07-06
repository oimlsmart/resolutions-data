# 02 — Add DC (Development Council) as 3rd meeting type

## Goal
Model OIML Development Council meetings as a first-class meeting type alongside CIML and Conference.

DC meetings existed 1980–2004 (per `2004-oimldc-decisions-{en,fr}.pdf`, the DC proposed its own dissolution at its 2004 session). They are a separate ordinal series from CIML/Conference.

## Scope

### 2.1 Edoxen gem
DC has no dedicated `type` in `Edoxen::Enums::MEETING_TYPE`. The closest semantic match is `committee` (DC was a standing committee of the OIML). **Do not modify edoxen** — instead use `type: committee` and add an OIML-specific sidecar field `oiml_body: dc` for our own classification.

### 2.2 New meeting file: `meetings/dc-1-2004.yaml`
```yaml
---
identifier:
  - prefix: OIML Development Council
    number: '1'
urn: urn:oiml:dc:meeting:dc-1
type: committee
oiml_body: dc         # OIML-specific; not validated by edoxen
status: completed
ordinal: 1
date_range:
  start: '2004-10-25'
  end: '2004-10-25'
committee: OIML Development Council
general_area: Berlin, Germany
source_urls:
  - ref: https://berlin.oiml.org/docs_general/agenda_dc.pdf
    format: pdf
    language_code: eng
    kind: agenda_pdf
  - ref: https://www.oiml.org/.../2004-oimldc-decisions-en.pdf
    format: pdf
    language_code: eng
    kind: decisions_pdf
localizations:
  - language_code: eng
    script: Latn
    title: 1st OIML Development Council — Decisions (EN)
city: DEBER
country_code: DE
visibility: public
venues:
  - kind: physical
    unlocode: DEBER
    country_code: DE
```

### 2.3 New resolution file: `resolutions/dc-1-2004-decisions.yaml`
Parse `reference-docs/ocr/md/2004-oimldc-decisions-{en,fr}.md` (already OCR'd) into 4 decisions. Identifier prefix `DC`, numbers `2004/1`–`2004/4`.

### 2.4 Agenda: `agendas/dc-1.yaml`
Parse `reference-docs/agendas/berlin.oiml.org__agenda_dc.pdf` (already downloaded + OCR'd).

### 2.5 Browser pipeline
- `browser/src/types/resolution.ts`: extend `MeetingBodyType` to `'ciml' | 'conference' | 'dc'`
- `browser/src/composables/useMeetings.ts`: `bodyTypeFromSlug` handles `dc-` prefix
- `browser/src/views/Meetings.vue`: third filter chip "Development Council"
- `browser/src/views/MeetingDetail.vue`: DC badge color
- `browser/src/data/translations.yaml`: `meetings.bodyDc`, `meeting.dc` labels (EN + FR)
- `browser/scripts/build-data.mjs`: `body_type` derived from `committee` field — handle DC case (`committee.includes?('Development Council')`)
- `browser/scripts/lib/transforms.mjs`: `buildMeetingDoi` handles `dc-` prefix

### 2.6 Ruby script: `scripts/parse_dc_decisions.rb`
New parser. Pattern matches the DC decisions OCR structure:
```
1     The Development Council thanked Mr Seiler...
2     The Development Council noted Mr Seiler's report...
3     The Development Council, considering that...
4     The Development Council expressed its appreciation...
```

Reads `reference-docs/ocr/md/2004-oimldc-decisions-{en,fr}.md`, emits `resolutions/dc-1-2004-decisions.yaml` in v2 edoxen format.

### 2.7 URN scheme
- Meeting: `urn:oiml:dc:meeting:dc-1`
- Decision: `urn:oiml:dc:resolution:2004/N`
- Agenda item: `urn:oiml:dc:meeting:dc-1:agenda:N`

## Done criteria
- [ ] `meetings/dc-1-2004.yaml` exists, validates via edoxen
- [ ] `resolutions/dc-1-2004-decisions.yaml` exists with 4 decisions, validates
- [ ] `agendas/dc-1.yaml` exists
- [ ] Browser `/en/meetings/` shows DC section with filter chip
- [ ] `/en/meetings/dc-1-2004/` renders with 4 decisions + agenda
- [ ] All 86 vitest tests still pass
