# 02 — Content gaps (parser improvements)

## Problem
Post-deploy analysis: 35% of resolutions had `actions: []`. Investigation
showed two real parser bugs beyond the expected "section heading only" cases.

## Root causes & fixes

### A. CIML/2025/44 "(Untitled)"
Body was "Notes the information provided..." but `Notes` lived only in an
unused `EXTRA_EN_ACTION_PREFIXES` constant.

**Fix:** added `Notes`, `Takes note`, `Welcomes`, `Renews` to `ACTION_PREFIXES`.

### B. CIML/2008/1 "(Untitled)" + 31% of formal-era resolutions
OCR has two styles:
1. Modern formal: `The Conference,\n[considerations]\n[action]` — comma after subject
2. Older formal (~2008-2013): `The Committee approved ...` — no comma, subject+verb on same line

The formal parser's `group_by_leading_verb` and `classify_verb` only handled
style 1. Style 2 was missed entirely.

**Fix:** added a `SUBJECT_LEAD` regex (`The (Committee|Conference|Bureau|Council) `)
and made `verb_with_subject_re` accept an optional subject-lead before the verb.
`classify_verb` now strips the subject-lead and case-insensitively matches
the verb prefix.

### C. Past-tense verbs
OCR also uses past tense (`approved`, `welcomed`, `instructed`) which weren't
in `ACTION_PREFIXES` (only present: `Approves`, `Welcomes`, ...).

**Fix:** added 14 past-tense forms (`Approved`, `Elected`, `Endorsed`,
`Resolved`, `Thanked`, `Instructed`, `Requested`, `Decided`, `Charged`,
`Supported`, `Rescinded`, `Acknowledged`, `Noted`, `Welcomed`, `Renewed`).

## Result
- Formal-era zero-action resolutions: **31.5% → 24.7%** (down 7 points)
- Total resolutions with actions: 1,070 → 1,333 (+263)
- CIML/2008/1 now has the correct action ("The Committee approved the Minutes of the 42nd CIML Meeting...")

The remaining ~24% zero-action formal resolutions are mostly:
- Section-heading-only entries (no body content to extract)
- Resolutions with body that uses verbs not in my list (e.g., "Receives",
  "Reports") — could be added in a future pass

Narrative-era (CIML 39–42) at 28% is mostly true section headings — the
section title alone (e.g. "## 2 Member States and Corresponding Members")
becomes a resolution with no actions, by design.

## Outputs
- `scripts/author_yaml.rb` (subject-lead handling, case-insensitive match,
  past-tense verbs)
- Regenerated `resolutions/*.yaml` (1,333 actions now vs 1,070 before)
