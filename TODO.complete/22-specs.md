# 22 — Specs: test coverage strategy

## Current state
Zero test files anywhere in the repo. No CI lint. No type-check on
YAML data. Adding features is risky because regressions aren't
caught.

## Proposed layered test strategy

### L1 — YAML data validation (cheapest, highest ROI)
**Tool**: Ruby + json_schemer (edoxen already depends on both).
**What**: every `resolutions/*.yaml` validates against the edoxen
schema. Every `browser/src/data/*.yaml` validates against its own
JSON schema (action-types, meeting-types, countries, cities,
translations, agendas).
**Run**: `npm run validate` — fast (under 2s).
**Catches**: typos, missing required fields, schema drift.

```ruby
# scripts/specs/yaml_validation_spec.rb
require 'json_schemer'
require 'yaml'

RSpec.describe 'resolutions YAMLs' do
  Dir['resolutions/*.yaml'].each do |path|
    it "#{path} validates against the edoxen schema" do
      schema = YAML.safe_load(File.read(EDOXEN_SCHEMA))
      data   = YAML.safe_load(File.read(path))
      errors = JSONSchemer.schema(schema).validate(data).to_a
      expect(errors).to be_empty
    end
  end
end
```

### L2 — Parser fixtures (catches OCR regressions)
**Tool**: RSpec.
**What**: one fixture per OCR shape:
- modern: `## Resolution Conference/YYYY/NN` (CIML 44+, Conf 14+)
- older: `## Resolution no.N` (CIML 43, Conf 13)
- decisions-narrative: `## DECISIONS` + numbered sections (CIML 39–42)
- bilingual: split at `# Résolutions`

Each fixture is a small `.md` file plus the expected `.yaml` output.
Parser spec runs `Author.parse(fixture)` and asserts equality.

```ruby
# scripts/specs/parser_spec.rb
RSpec.describe ResolutionsData::Author do
  Dir['scripts/specs/fixtures/*.md'].each do |md_path|
    it "parses #{File.basename(md_path)} correctly" do
      md   = File.read(md_path)
      yaml = described_class.parse(md, sample_src, :en)
      expected = YAML.safe_load(File.read(md_path.sub('.md', '.yaml')))
      expect(yaml).to eq(expected)
    end
  end
end
```

### L3 — Transform unit tests (Node)
**Tool**: `node:test` (built-in).
**What**: each exported function in `lib/transforms.mjs` has a
focused test:
- `buildResolutionRecord` — input shape × output shape.
- `pickLocalizable` — string / array / missing fallbacks.
- `toLang6391` — full code table.
- `normalizeSnippet` — whitespace + truncation.

### L4 — Composable tests (Vitest)
**Tool**: Vitest + @vue/test-utils.
**What**:
- `useMeetings` — group-by-canonical logic, primary-source-file
  selection by UI language.
- `useResolutions` — `setPageData`, lookup by id.
- `useDateFormat` — en/fr formatting for date, range.
- `useI18n` — `t()` fallback chain, `setLang` propagation.

### L5 — Component tests (Vitest + @vue/test-utils)
**Tool**: same as L4.
**What**: render each view with mock data, assert key DOM nodes.
- Home renders N cards.
- MeetingDetail renders the meeting title + DOI.
- ResolutionDetail renders the actions in the current language.

### L6 — E2E smoke test (Playwright)
**Tool**: Playwright.
**What**: 5 user journeys:
- Land on home, search for "STEP", click a result, verify detail page.
- Toggle language to FR, verify UI strings swap.
- Navigate to Meetings, click a meeting, verify resolutions list.
- Direct-link to a resolution by URL, verify content.
- Click prev/next nav, verify scroll-to-top.

## CI integration

`.github/workflows/ci.yml`:
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with: { bundler-cache: true }
      - run: bundle exec rspec scripts/specs/
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: cd browser && npm ci
      - run: cd browser && npm test
  build:
    runs-on: ubuntu-latest
    needs: [validate, test]
    steps:
      - uses: actions/checkout@v4
      - run: cd browser && npm ci && npm run build
```

## Priority order

1. **L1** first — fast, catches most regressions.
2. **L3** next — pure functions, easy to test.
3. **L2** third — fixtures take time to write but pay off forever.
4. **L4** then — composables are the contract surface.
5. **L5** + **L6** last — heavier setup, lower ROI for this size
   codebase.

## Estimated effort

| Layer | Files | Effort |
|---|---|---|
| L1 | 1 spec file + 5 schema refs | 1 hour |
| L2 | 4 fixtures + 1 spec | 3 hours |
| L3 | 5 test files | 2 hours |
| L4 | 4 test files | 4 hours |
| L5 | 4 test files | 6 hours |
| L6 | 1 e2e suite | 4 hours |

Total: ~20 hours. Tractable across a week of focused work.
