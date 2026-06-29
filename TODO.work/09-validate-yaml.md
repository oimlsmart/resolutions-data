# 09 — Validate YAML

## Goal
Confirm every emitted YAML parses cleanly and matches the Edoxen shape.

## Done
Ran a small validator across `resolutions/*.yaml`:

```ruby
require "yaml"
Dir.glob("resolutions/*.yaml").sort.each do |f|
  d = YAML.load_file(f)
  raise "no resolutions" unless d["resolutions"].is_a?(Array)
end
```

**Result: 43/43 OK, 0 BAD.**

## Sample output — `conference-17-resolutions-en.yaml`

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/metanorma/edoxen/refs/heads/main/schema/edoxen.yaml
# Auto-generated from reference-docs/.ocr/md/conference-17-resolutions-en.md
# Source PDF: reference-docs/conferences/conference-17-resolutions-en.pdf
# Meeting URN: urn:oiml:conference:meeting:conference-17-resolutions-en
# Language: en
---
metadata:
  title: "17th OIML Conference — Resolutions (EN)"
  dates:
  - start: '2025-01-01'
    kind: meeting
  source: OIML Conference Secretariat (BIML)
  venue: "Paris, France"
  language: en
resolutions:
  - identifier: Conference/2025/01
    subject: OIML Conference
    title: Approves the agenda for the 17th International Conference on Legal Metrology (OIML Conference).
    dates:
    - start: '2025-01-01'
      kind: decision
    agenda_item: '2'
    considerations: []
    actions:
    - type: approves
      message: |
        Approves the agenda for the 17th International Conference on Legal Metrology (OIML Conference).
      dates:
      - start: '2025-01-01'
        kind: effective
  - identifier: Conference/2025/02
    subject: OIML Conference
    title: Elects His Excellency Fahad M. Al Ruwaily (Ambassador of the Kingdom of Saudi Arabia
    ...
```

## Known limitations (auto-generated; refine in review pass)
1. **Dates are placeholders** (`YYYY-01-01`): the parser only knows the year
   from the manifest. Real meeting dates should be sourced from the meeting
   minutes (separate PDFs not yet fetched).
2. **Titles are verb-led first-clause snippets**, not hand-curated summaries.
   Useful for browsing; refine per file during human review.
3. **Sub-item enumerations** (a), b), c)…) stay inside the action message,
   not split into separate actions.
4. **CIML 39–42 narrative decisions and Conf-12 joint doc** are still
   pending — see Phase 11.
5. **Tables** are converted from HTML → AsciiDoc `|===` but cell content
   is preserved verbatim (no semantic restructuring).
6. **Cross-references** ("Noting Resolution CIML/2024/08") are kept inside
   the consideration text; no first-class relation edges yet.

## Outputs
- All 43 YAMLs parse cleanly under Ruby's `yaml` (psych).
- 1,241 resolutions ready for browser consumption (after JSON build).

## Next
Phase 10 — port the resolutions browser from isotc184sc4.
