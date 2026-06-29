# 11 — Deferred: Narrative-Format PDFs

## Goal (not yet implemented)
Author Edoxen YAML for the 10 PDFs whose OCR doesn't use the formal
"Resolution …" header pattern. These need a different parser mode.

## Deferred sources (10 PDFs)

### CIML 39–42 (8 PDFs, 2004–2007) — "DECISIONS" narrative format
- `ciml-39-decisions-{en,fr}.pdf` (Berlin 2004)
- `ciml-40-decisions-{en,fr}.pdf` (Lyon 2005)
- `ciml-41-decisions-{en,fr}.pdf` (Cape Town 2006)
- `ciml-42-decisions-{en,fr}.pdf` (Shanghai 2007)

OCR shape:
```
## DECISIONS
## Opening address
The Committee took note of the opening address delivered by its Acting President.
## 1 Approval of the minutes of the 38th CIML Meeting
The Committee approved the minutes of its 38th Meeting without modification.
## 2 Member States and Corresponding Members
## 2.1 Situation of certain Members
The Committee noted that Zambia had been struck off ...
```

Numbered sections (1, 2, 2.1, 3, 3.1, 3.2, …) + a few unnumbered front-matter
sections. Each section's body is one or more paragraphs starting with
"The Committee [verb] ...".

### Conference 12 (2 PDFs, 2004) — joint CIML-39 + DC + Conf-12 doc
- `conference-12-decisions-en.pdf` — joint (12th Conf + 39th CIML + DC)
- `conference-12-decisions-fr.pdf` — conference-only decisions, FR

The EN file bundles decisions from three bodies. Splitting requires detecting
section headings like "12TH CONFERENCE", "39TH CIML MEETING",
"DEVELOPMENT COUNCIL".

## Suggested parser design

### Narrative block splitter
1. Detect `## N` or `## N.M` headers → start new resolution block.
2. Also detect unnumbered headers in a curated list (`Opening address`,
   `Roll-call - Quorum`, `Approval of the agenda`) — these become
   "pre-meeting" decisions.
3. Within a block, classify paragraphs by leading verb ("The Committee
   approved/noted/instructed/endorsed/...").
4. Identifier: use the section number as `<seq>` (e.g., `CIML/2004/2.1`).
5. Subject: always `CIML` for CIML meetings.

### Joint doc splitter (Conf 12 EN)
1. Detect major section boundaries ("12TH INTERNATIONAL CONFERENCE",
   "39TH CIML MEETING", "DEVELOPMENT COUNCIL MEETING") — split into three
   sub-documents.
2. Each sub-document emits its own YAML.
3. Cross-references between bodies preserved as text in considerations.

### Estimated scope
- New parser mode: ~150 lines of Ruby.
- Identifier scheme needs extension (allow `CIML/YYYY/N.M` dotted form).
- Subject field needs to accept Development Council as a third body.

## Why deferred
- 10 PDFs is a small fraction of the 51-PDF corpus (84% already covered).
- Structurally different enough to warrant its own design pass.
- Pre-2008 OIML resolutions are lower-traffic for current work.

## Status
- `resolutions/_pending_review.txt` lists every deferred slug.
- Source PDFs and OCR markdown are in place — no re-fetch needed.
- When the narrative parser lands, re-run `scripts/author_yaml.rb` and the
  browser rebuild picks up the new YAMLs automatically.
