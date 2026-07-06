# 01 — Audit: current data vs edoxen v2.1 model coverage

## Current state (post-edoxen v2 migration)

### Meeting YAMLs (`meetings/*.yaml`, 58 files)
- ✅ v2 schema compliant (validate via `bundle exec edoxen validate-meetings`)
- ✅ All carry `type` (plenary | conference), `status`, `date_range`, `committee`, `general_area`
- ✅ v2 `venues: [{kind, unlocode, country_code}]`
- ✅ v2 `visibility: public`
- ❌ Missing: 3rd body type — **Development Council (DC)** meetings exist in source PDFs (`reference-docs/conferences/2004-oimldc-decisions-{en,fr}.pdf`) but are not modeled

### Resolution YAMLs (`resolutions/*.yaml`, 56 files)
- ✅ v2 schema compliant (validate via `bundle exec edoxen validate`)
- ✅ Structured identifiers (`[{prefix, number}]`)
- ✅ Decision-level `dates: [{date, type}]` and per-action `date_effective`
- ❌ Conference/2004/* has `subject: CIML` (wrong — should be Conference or empty)
- ❌ Conference/2004/* has no `agenda_item` field set, even though every title corresponds to an agenda item
- ❌ CIML/2025/* has `title: "Agenda item N"` (placeholder) — should be `"Agenda Item N: <agenda_item_title>"`
- ❌ DC decisions have no YAML at all

### Agenda YAMLs (`agendas/*.yaml`, 63 files)
- ✅ Real titles parsed from PDFs (CIML 39-60 + Conf 12-17) and Bulletin minutes (CIML 15-38)
- ❌ No agenda for DC meetings

### Browser pipeline
- `body_type` enum: `'ciml' | 'conference'` — needs `'dc'`
- Filter chips on `/en/meetings/`: only CIML and Conference — needs DC
- Color tokens: only CIML and Conference — needs DC
- Identifier prefixes: hardcoded for CIML and Conference — needs `DC`

### Ruby scripts layer
- ✅ `parse_minutes.rb`, `parse_agendas.rb`, `parse_agenda_pdfs.rb`, `author_yaml.rb` work
- ❌ All use raw `YAML.load/dump` — should use `Edoxen::Meeting`, `Edoxen::Decision`, `Edoxen::Agenda` model classes
- ❌ No RSpec coverage

### Edoxen gem coverage
- `bundle exec edoxen validate-meetings` → 58/58 pass
- `bundle exec edoxen validate` → 56/56 pass
- ❌ DC meetings cannot be validated (no schema support, no data)

## Gap analysis vs edoxen gem

| Concept | Edoxen support | Our use |
|---|---|---|
| Meeting `type` enum | plenary, working_group, task_group, ad_hoc, joint, general_assembly, committee, subcommittee, conference, workshop, seminar, webinar, hearing, markup, board_meeting, annual_general_meeting, other | Used `plenary` (CIML) and `conference` (Conference). DC → `committee` (closest semantic). |
| Meeting `oiml_body` extension | Not in edoxen (correct — OIML-specific) | Add as a sidecar field; not validated by edoxen. |
| Identifier prefix | Free-form string | Hardcoded CIML/Conference in browser pipeline → generalize. |
| Agenda items | Full model with kind, outcome, decision_ref | ✅ Used |
| Decision references | `agenda_item_ref` (URN) | Should be on every resolution that maps to an agenda item. |

## Done criteria
- [x] Audit complete
- [ ] DC support added (see 02)
- [ ] Conference-2004 data fixed (see 03)
- [ ] Resolution title format applied (see 03)
- [ ] Edoxen model classes used in Ruby scripts (see 04)
- [ ] Specs added (see 05)
