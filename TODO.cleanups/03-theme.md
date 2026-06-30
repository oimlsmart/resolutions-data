# 03 — Theme port (OIML brand)

## Goal
Replace the inherited TC 154 / ISO color palette (dark blue + ISO red) with
the OIML brand (blue + cream + teal), and switch fonts to match
`~/src/oimlsmart/smart/`.

## Authority
`~/src/oimlsmart/smart/browser/src/styles/base.css` defines the OIML brand:
- Brand blue: 50 (#f0f6ff) → 950 (#001230), primary brand-600 #004996
- Cream: #f0eae2 (background)
- Teal: #024873 (accent)
- Fonts: Inter (sans), Source Serif 4 (serif), JetBrains Mono (mono)

## Done

### `browser/src/assets/main.css`
Rewrote the `@theme` block to mirror smart's brand variables. Kept the
slate ramp for surfaces. Aliased `--color-blue-accent` to brand-600 so
existing CSS that referenced the old name still resolves. Body background
swapped from slate-50 to cream (with cream-dark dot pattern).

### Font import
Google Fonts URL rewritten: `DM Sans + Fraunces` → `Inter + Source Serif 4 + JetBrains Mono`.

### ISO red removal
Searched every CSS file + App.vue and replaced `#e3000f` (ISO red) with
`var(--color-teal)`. The scroll-progress bar gradient changed from
`linear-gradient(#0061ad, #e3000f)` to `linear-gradient(brand-600, teal)`.

### Theme-aware logo
The OIML lockup `oiml-logo.svg` is dark-on-light. For dark mode we invert
it via CSS (`filter: invert(1) brightness(1.4)` on `.dark`), avoiding the
need for a separate dark-theme asset. Hooked into header and footer logos
via the `--theme` modifier class.

## Verification
- Local build exits 0 (1696 sitemap URLs)
- Light theme: cream background, blue accents, dark logo
- Dark theme: dark slate background, inverted logo

## Outputs
- `browser/src/assets/main.css` (full theme rewrite)
- `browser/src/assets/css/header.css` (red → teal, theme-aware logo CSS)
- `browser/src/assets/css/footer.css` (red → teal)
- `browser/src/App.vue` (scroll progress gradient, logo theme class)
