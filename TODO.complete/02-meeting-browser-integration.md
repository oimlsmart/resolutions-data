# 02 — Wire `meetings/` into the browser

## Problem

The browser's `build-data.mjs` walks `resolutions/*.yaml` and derives a
`meetings.json` from per-source-file metadata. The newer, richer
`meetings/*.yaml` files (URN, committee, virtual flag, source_urls with
`kind=resolutions_pdf`, minutes refs) are not consumed at all.

Effect: the deployed site has no idea which meetings are virtual, has
no URN-based identity for cross-linking, and silently drops the
skeleton meetings (CIML 26-38) that have minutes but no resolution
collection yet.

## Plan

1. Extend `build-data.mjs` to also walk `meetings/*.yaml`.
2. Index meetings by the slug derivable from `resolution_refs[0]`
   (e.g. `urn:oiml:ciml:resolution-collection:ciml-39-resolutions` →
   `ciml-39-resolutions`). This is the same `source_file` key the
   existing resolutions loop uses, so the two maps join cleanly.
3. Enrich each existing meeting record with:
   - `urn` — the meeting URN
   - `virtual` — boolean
   - `committee` — full committee label
   - `localizations` — array of `{language_code, title, general_area}`
   - `minutes` — array of minutes URNs (when present)
4. For meetings present in `meetings/` but with no matching
   `resolutions/` source file (e.g. CIML 26-38 skeletons), emit a
   minimal meeting record so they still show up in the Meetings list.
5. Surface `virtual` in the Meetings view so online meetings are
   visually distinct from in-person ones.

## Acceptance

- [x] `browser/public/data/meetings.json` carries `urn`, `virtual`,
      `committee`, `localizations`, `minutes` for every meeting that
      has a `meetings/*.yaml` source
- [x] Skeleton meetings (CIML 26-38) appear in the Meetings list
- [x] Online meetings are visually distinct in the UI
