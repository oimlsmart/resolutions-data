# 01 — DOI + spec-compliant URN per resolution

## Goal
Apply a DOI and a URN to every resolution, per the user direction and the
OIML URN spec at `~/src/oimlsmart/smart/data/oiml-urn-specification.adoc`.

## Format

### URN (per spec § Resolution, `doc-nss`)
- Conference: `urn:oiml:doc:conf:resolution:<session>.<seq>`
  e.g. `urn:oiml:doc:conf:resolution:17.01` (17th Conference, resolution 1)
- CIML: `urn:oiml:doc:ciml:resolution:<year>-<seq>`
  e.g. `urn:oiml:doc:ciml:resolution:2025-44`

### DOI (per user direction)
- Conference: `10.63493/resolutions/conf<YYYY><NN>`
  e.g. `10.63493/resolutions/conf202501`
- CIML: `10.63493/resolutions/ciml<YYYY><NN>`
  e.g. `10.63493/resolutions/ciml202544`

`<NN>` is the per-meeting sequence, zero-padded to 2 digits when purely
numeric. Alphanumeric seqs like `4a` are preserved as-is.

## Implementation

### `scripts/author_yaml.rb`
Added four helpers:
- `compute_urn(src, identifier)` — dispatches on kind (Conference vs CIML),
  uses `src["session"]` for Conference session number.
- `compute_doi(src, identifier)` — concatenates prefix + year + padded seq.
- `parse_identifier_parts(identifier, src)` — splits `Conference/YYYY/NN`
  / `CIML/YYYY/NN` into `[kind, year, seq]`.
- `pad_seq(seq)` — zero-pads numeric seqs to 2 digits.

Both `parse` (formal) and `build_narrative_resolution` (CIML 39–42) now
attach `doi` and `urn` to every resolution hash. `render_resolution`
emits them as YAML fields.

### `browser/scripts/lib/transforms.mjs`
Pass `doi` and `urn` from YAML through to the JSON. The fallback
`${URN_BASE}:resolution:${identifier}` only fires if YAML lacks a URN
(which it doesn't, post-rerun).

### `browser/src/types/resolution.ts`
Added `doi?: string` (urn already existed).

### `browser/src/views/ResolutionDetail.vue`
Added a DOI bar above the URN bar. The DOI is rendered as a link to
`https://doi.org/<doi>` (DOI resolver). Copy-to-clipboard button mirrors
the URN bar's behavior.

### `browser/src/assets/css/resolution.css`
`.doi-bar .urn-value--link` styles — same shape as urn-bar but with link
color + underline on hover.

## Result

Sample (live in `public/data/resolutions.json`):
```json
{
  "id": "CIML-2025-44",
  "identifier": "CIML/2025/44",
  "doi": "10.63493/resolutions/ciml202544",
  "urn": "urn:oiml:doc:ciml:resolution:2025-44",
  ...
}
```

All 1,640 resolutions have both fields. YAMLs validated cleanly.

## Outputs
- `scripts/author_yaml.rb` (+4 helpers, +2 fields per resolution)
- `browser/scripts/lib/transforms.mjs`
- `browser/src/types/resolution.ts`
- `browser/src/views/ResolutionDetail.vue`
- `browser/src/assets/css/resolution.css`
- Regenerated `resolutions/*.yaml` (1,640 × 2 new fields)
- Rebuilt `browser/public/data/resolutions.json`
