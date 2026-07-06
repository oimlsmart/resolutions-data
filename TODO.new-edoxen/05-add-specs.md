# 05 — Add RSpec specs for new code

## Goal
Cover the new lib/ classes and DC parser with RSpec specs. Use real model instances, never doubles (project rule).

## Scope

### `spec/oiml/resolutions_data/body_type_spec.rb`
- `BodyType.from_slug("ciml-44")` → `:ciml`
- `BodyType.from_slug("conference-12")` → `:conference`
- `BodyType.from_slug("dc-1-2004")` → `:dc`
- `BodyType.from_slug("garbage")` → raises or returns nil
- `BodyType.label(:dc)` → `"OIML Development Council"`
- `BodyType.all` → `[:ciml, :conference, :dc]`

### `spec/oiml/resolutions_data/identifier_parser_spec.rb`
- `IdentifierParser.parse("CIML/2009/1")` → `{prefix: "CIML", number: "2009/1"}`
- `IdentifierParser.parse("Conference/2004/9")` → `{prefix: "Conference", number: "2004/9"}`
- `IdentifierParser.parse("DC/2004/1")` → `{prefix: "DC", number: "2004/1"}`
- `IdentifierParser.parse("CIML/2009/1-acclaim-1")` → `{prefix: "CIML", number: "2009/1-acclaim-1"}`
- `IdentifierParser.agenda_label("CIML/2025/14.2")` → `"14.2"`
- `IdentifierParser.agenda_label("CIML/2009/1-acclaim-1")` → `nil` (acclamation)

### `spec/oiml/resolutions_data/ocr/markdown_reader_spec.rb`
- `MarkdownReader.for_slug("ciml-60")` → returns the md content
- `MarkdownReader.each` → yields every md file
- Missing slug → returns nil

### `spec/oiml/resolutions_data/pdf/text_extractor_spec.rb`
- `TextExtractor.extract("reference-docs/agendas/ciml-60-agenda-en.pdf")` → returns layout-preserved text
- Returns empty string for missing file
- Honors `pages:` argument

### `spec/scripts/parse_dc_decisions_spec.rb`
- End-to-end: run the parser against the 2004-oimldc-decisions md, verify the output YAML has 4 decisions with correct identifiers and titles

### `spec/scripts/fix_resolution_data_spec.rb`
- Idempotency: run twice, second run produces zero changes
- `subject: CIML` on Conference decisions is removed
- `agenda_item` is set on Conference/2004/9
- Title for CIML/2025/1 becomes "Agenda Item 1: ..."

## RSpec config
- Add `rspec` to Gemfile
- `spec/spec_helper.rb` with `require "oiml/resolutions_data"`
- Project rule: never use `double` (per CLAUDE.md). Use real instances.

## Done criteria
- [ ] `bundle exec rspec` runs all specs
- [ ] Coverage for the 4 lib classes
- [ ] Coverage for `parse_dc_decisions.rb`
- [ ] Coverage for `fix_resolution_data.rb` (idempotency test)
- [ ] No `double` anywhere
