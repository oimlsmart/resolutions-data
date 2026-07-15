# OIML Resolutions Browser (new)

This is the new `@edoxen/browser` (Astro) site, replacing the old
Vue/Vite browser in `browser-legacy/`.

## Status

- **Data:** All 381 YAML files are on edoxen 1.0 format
  (`scheduled_date_range`, per-field Localized).
- **Browser:** New Astro setup with `@edoxen/browser` v0.1.6.
  Config in `edoxen.config.ts` with bilingual EN + FR locale config.
- **Legacy:** The old Vue/Vite browser is preserved in
  `browser-legacy/` for reference.

## What remains (for a colleague)

1. `pnpm install` in this directory.
2. `pnpm build` — verify the Astro build succeeds.
3. Refine the theme in `edoxen.config.ts` → `theme` and
   `src/styles/override.css` to match the exact OIML brand colors
   from `browser-legacy/src/assets/main.css`.
4. Verify the bilingual EN/FR locale routing works (the config has
   `locales: [{ code: 'en', ... }, { code: 'fr', routePrefix: 'fr' }]`).
5. Migrate custom features from the legacy browser:
   - CIML vs Conference body distinction.
   - AsciiDoc rendering of resolution narratives.
   - Bilingual toggle component.
6. Remove `browser-legacy/` once the new browser is verified.
7. Update CI/CD to build from this directory.
