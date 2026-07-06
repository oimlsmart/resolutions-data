# 04 — Refactor Ruby scripts to use Edoxen model classes

## Goal
Replace raw `YAML.load` / `YAML.dump` in our scripts with `Edoxen::Meeting`, `Edoxen::Decision`, `Edoxen::Agenda` model instances. The models give us type safety, defaults, and validation for free.

## Current state (anti-patterns)

### `scripts/author_yaml.rb`
- Loads OCR markdown, builds raw Hash, dumps to YAML
- Duplicates field names that Edoxen already defines
- Hardcodes `subject: CIML` (the bug fixed in 03)

### `scripts/parse_minutes.rb`
- Loads OCR JSON, extracts sections into raw Hash
- No type checking on `number` / `title` fields

### `scripts/parse_agendas.rb` and `scripts/parse_agenda_pdfs.rb`
- Builds raw Hash for `items[]`
- Doesn't validate against `Edoxen::AgendaItem` constraints (kind/outcome enums)

### `scripts/migrate_*.rb` and `scripts/fix_v2_dates.rb`
- One-shot migration scripts; can stay as-is (they were migration glue, not production code)

## Target: `lib/oiml/resolutions_data/`

Introduce a thin domain layer that wraps Edoxen models. All scripts use this layer; nobody touches `Edoxen::*` directly outside this layer.

### File layout
```
lib/
  oiml/
    resolutions_data.rb            # namespace + autoloads
    resolutions_data/
      version.rb
      meeting_builder.rb           # builds Edoxen::Meeting from OCR + metadata
      decision_builder.rb          # builds Edoxen::Decision from OCR
      agenda_builder.rb            # builds Edoxen::Agenda from PDF text
      body_type.rb                 # OIML body classification (ciml/conference/dc)
      identifier_parser.rb         # parses "CIML/2009/1" → StructuredIdentifier
      ocr/
        markdown_reader.rb         # reads OCR md files
        raw_json_reader.rb         # reads OCR raw JSON cache
      pdf/
        text_extractor.rb          # wraps pdftotext -layout
      web/
        mini_site_walker.rb        # walks oiml.org mini-sites for PDFs
```

### Autoload discipline (project rule)
Each namespace file declares its children via `autoload`. Example:
```ruby
# lib/oiml/resolutions_data.rb
module Oiml
  module ResolutionsData
    autoload :BodyType,           "oiml/resolutions_data/body_type"
    autoload :MeetingBuilder,     "oiml/resolutions_data/meeting_builder"
    autoload :DecisionBuilder,    "oiml/resolutions_data/decision_builder"
    autoload :AgendaBuilder,      "oiml/resolutions_data/agenda_builder"
    autoload :IdentifierParser,   "oiml/resolutions_data/identifier_parser"
    autoload :Version,            "oiml/resolutions_data/version"

    module Ocr
      autoload :MarkdownReader,   "oiml/resolutions_data/ocr/markdown_reader"
      autoload :RawJsonReader,    "oiml/resolutions_data/ocr/raw_json_reader"
    end

    module Pdf
      autoload :TextExtractor,    "oiml/resolutions_data/pdf/text_extractor"
    end

    module Web
      autoload :MiniSiteWalker,   "oiml/resolutions_data/web/mini_site_walker"
    end
  end
end
```

### Refactored scripts

Each script becomes a thin coordinator:

```ruby
# scripts/author_yaml.rb (simplified)
require "oiml/resolutions_data"

module ResolutionsData
  module AuthorYaml
    def self.run
      Oiml::ResolutionsData::Ocr::MarkdownReader.each do |md|
        decision = Oiml::ResolutionsData::DecisionBuilder.from_markdown(md)
        next unless decision
        decision.validate!  # raises if not schema-compliant
        write_yaml(decision)
      end
    end
  end
end
```

## Scope for this PR

**Given the size of this PR, only do:**
- Introduce `lib/oiml/resolutions_data/` namespace + autoloads
- Extract `BodyType`, `IdentifierParser`, `Ocr::MarkdownReader`, `Pdf::TextExtractor` as standalone classes
- Refactor `parse_agenda_pdfs.rb` to use them (most recent, cleanest)
- Leave older scripts (`author_yaml.rb`, `parse_minutes.rb`) as-is — they work and touch large data; refactor in a follow-up

**Out of scope (future PRs):**
- Full refactor of `author_yaml.rb` (≈500 lines, risky)
- Full refactor of `parse_minutes.rb` (≈400 lines, regex-heavy)
- Replacing hand-rolled meeting YAML emission with Edoxen::Meeting

## Done criteria
- [ ] `lib/oiml/resolutions_data.rb` namespace exists with autoloads
- [ ] `BodyType` enum-like class with `ciml`, `conference`, `dc`
- [ ] `IdentifierParser` parses `"CIML/2009/1"` → `{prefix: "CIML", number: "2009/1"}`
- [ ] `Ocr::MarkdownReader` reads md files lazily
- [ ] `Pdf::TextExtractor` wraps `pdftotext -layout`
- [ ] `scripts/parse_agenda_pdfs.rb` refactored to use these
- [ ] No `require_relative` in any new file
- [ ] Specs for the 4 new classes
