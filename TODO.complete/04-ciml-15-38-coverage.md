# 04 — CIML 15-38 coverage

## Problem

The meetings/ directory only contained CIML 39-60 (the post-2004 era).
The historical CIML 15-38 minutes were partially covered via
`scripts/parse_minutes.rb` skeletons (CIML 26+) but the parser failed
to pick up CIML 15-19, 20-21, 23, 25 due to three bugs:

1. `FR_ORDINAL_RE` required a tens word (Vingt/Trente/…) as prefix and
   didn't match ordinals 1-19 standing alone (Quinzième, Seizième, etc.).
2. Ruby's `/i` flag does NOT case-fold non-ASCII accents inside
   character classes — `[eéè]` doesn't match `É`. Source PDFs use
   capital É in "QUINZIÈME RÉUNION" so the regex failed.
3. `extract_sections` only matched Arabic-numbered headers (`## 1 Title`).
   CIML 15-29 use Roman numerals (`## I — Title`).
4. `detect_meeting_ordinal` fall-through to Arabic regex hit false
   positives (matched "31" inside "2014") — fixed by tightening the
   pattern.
5. `next unless /MINUTES|COMPTE RENDU/` skipped OCR cache entries whose
   cover page used "SUMMARY" / "SOMMAIRE" (CIML 20, 21, 23, etc.).

## Plan

1. Extend `EN_ORDINAL_RE` and `FR_ORDINAL_RE` to match both tens-prefixed
   and standalone ordinals.
2. Use explicit alternation (`Premier|Première|…|Quinzième|Quinzieme|…`)
   instead of character classes to dodge Ruby's `/i` Unicode quirk.
3. Replace `extract_sections` with a regex that matches both
   Arabic and Roman section headers, and converts Romans to Arabic
   for stable identifiers.
4. Broaden the cover-page marker to include SUMMARY / SOMMAIRE.
5. Skip `source_doc` when nil (PDFs loaded directly into OCR leave no
   source URL in the cache JSON).

## Acceptance

- [x] `parse_minutes.rb` emits 28 minutes YAMLs (was 16)
- [x] CIML 15-23, 25-29, 32-39 covered (was CIML 26+ only)
- [x] `link_minutes_to_meetings.rb` now creates skeleton meeting YAMLs
      for CIML 6-10, 15-23, 25-28, 32-39
- [x] All 54 meeting YAMLs validate against the edoxen schema

## Remaining gaps

CIML 24, 29, 30, 31 are not in the OCR cache — the PDFs were not
provided. Coverage will fill in when those PDFs land.
