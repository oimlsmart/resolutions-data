# 13 — OIML Logo + README.adoc

## Goal
1. Replace the text-only header with the OIML logo (sourced from `~/src/mn/oiml-vocab/logos/`).
2. Replace the temporary `README.md` with a proper `README.adoc` (AsciiDoc,
   matching the convention used by the sibling repos).

## Inputs
- `~/src/mn/oiml-vocab/logos/oiml-logo.svg` — main 400×350 logo (globe + "OIML" wordmark)
- `~/src/mn/oiml-vocab/logos/oiml-logo-icon-{light,dark}.svg` — square mark-only icons
- 184sc4 README.adoc style (top-level `= Title`, AsciiDoc syntax)

## Done

### Logo assets copied
- `browser/public/oiml-logo.svg` — full lockup (header)
- `browser/public/oiml-logo-icon-light.svg` — square mark for light mode
- `browser/public/oiml-logo-icon-dark.svg` — square mark for dark mode
- `browser/public/favicon.svg` — overwritten with the light icon

### App.vue logo wiring
Added `<img src="/assets/oiml-logo.svg" alt="OIML">` to the header and footer
logos (replacing the text-only fallback from Phase 10).

### README.adoc
Replaces the throwaway `README.md`. Written in AsciiDoc to match the
convention used by `~/src/isotc184sc4/resolutions/README.adoc` and
`~/src/isotc154/www.isotc154.org/README.adoc`. Covers: purpose, scope,
repository layout, pipeline overview, run instructions, URN scheme, data
model, deployment.

## Outputs
- `browser/public/oiml-logo*.svg`
- `browser/src/App.vue` (logo wired)
- `README.adoc` (new canonical readme)
