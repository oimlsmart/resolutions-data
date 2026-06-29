# 03 — Fetch

## Goal
Download all 51 manifest entries into `reference-docs/{ciml,conferences}/<slug>.pdf`.

## Input
- `scripts/manifest.yaml` (51 sources)
- `scripts/fetch_pdfs.rb` (Ruby stdlib only: `net/http` + `yaml` + `fileutils`)

## Done
- Wrote `scripts/fetch_pdfs.rb` (108 lines):
  - Reads manifest, downloads each entry to its kind directory
  - Idempotent: skips existing valid PDFs (`%PDF-` magic + >1 KB)
  - 3 retries with exponential backoff on network/5xx errors
  - Atomic write via `.tmp` + rename
  - Per-entry log line + summary
- Ran the script. **All 51 PDFs downloaded successfully, 0 errors.**

## Output summary
```
Summary: 51 downloaded, 0 cached, 0 errors
Total archive: 20.8 MB across 51 files
```

Largest individual files:
- `ciml-43-resolutions-bilingual.pdf`         923.7 KB
- `ciml-47-resolutions-en.pdf`                893.4 KB
- `ciml-56-resolutions-fr.pdf`                853.0 KB
- `ciml-56-resolutions-en.pdf`                847.4 KB
- `conference-16-resolutions-fr.pdf`          834.0 KB
- `conference-16-resolutions-en.pdf`          831.6 KB
- `ciml-58-resolutions-fr.pdf`                824.4 KB
- `ciml-51-resolutions-fr.pdf`                810.6 KB
- `ciml-52-resolutions-fr.pdf`                801.6 KB
- `ciml-51-resolutions-en.pdf`                794.5 KB

## Issues / notes
- All PDFs are well under the 100 MB API limit per chunk; most fit in a
  single chunk. (Page-count breakdown in Phase 04.)
- `Content-Type: application/pdf` confirmed on the two URLs probed earlier;
  the script additionally validates the `%PDF-` magic on every download,
  so HTML error pages disguised as 200s would still be rejected.
- Idempotent re-run verified: subsequent runs would report 51 cached, 0 fetched.

## Outputs
- `scripts/fetch_pdfs.rb`
- `reference-docs/ciml/*.pdf` (41 files)
- `reference-docs/conferences/*.pdf` (10 files)

## Next
Phase 04 — adapt `glm_ocr.rb` for 100-page chunks; write driver + index builder.
