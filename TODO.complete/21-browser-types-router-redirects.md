# 21 — Item 15 stages A5–A7: browser types + router + redirects

## A5 — Browser types for localizations[]

Today the browser reads the JSON mirror, which already flattens
localizations to per-row records. The TypeScript types match this
flat shape. No structural change needed.

However, two cleanups:

### A5.1 — Drop dead code in `useMeetings.canonicalMeetingId`
The function strips `-en`/`-fr` suffixes from source_file. After
item 15, no source_file carries those suffixes. The function is now
an identity. Remove it.

### A5.2 — Drop `Meeting.language` (single) in favor of `languages[]`
The TypeScript `Meeting` interface has both `language: '' | 'en' | 'fr'`
(stale, single-lang) and `languages: string[]` (current). Remove the
single-language field; consumers should read `languages[0]`.

### A5.3 — Type the localization on Resolution
Resolution rows in JSON carry `language` (639-1) AND `language_code`
(639-3). Document both fields explicitly. Future: a
`LocalizedResolution` view-model that groups siblings by identifier.

## A6 — URL redirects

After item 15, URLs changed:
- `/meetings/ciml-39-decisions-en` → `/meetings/ciml-39-decisions`
- `/meetings/ciml-39-decisions-fr` → `/meetings/ciml-39-decisions`
- `/meetings/ciml-43-resolutions-bilingual-en` → `/meetings/ciml-43-resolutions`
- etc.

External links (GitHub PRs, OIML site, blog posts) may point at the
old URLs. They currently 404.

### Implementation

Add a `redirects.mjs` script that runs as part of `post-build.mjs`:

```js
// browser/scripts/post-build.mjs (extend)
import { writeRedirects } from './lib/redirects.mjs'

writeRedirects(distDir, [
  { from: '/meetings/ciml-39-decisions-en', to: '/meetings/ciml-39-decisions' },
  { ... },
])
```

The redirect file is a static `index.html` with `<meta http-equiv="refresh">`
+ `<link rel="canonical">` so search engines treat it as a 301.

### Redirect source

Generate from the build pipeline. For each meeting YAML, emit
redirects for every legacy URL form:
- `{slug}-en` → `{slug}`
- `{slug}-fr` → `{slug}`
- `{slug}-bilingual-en` → `{slug}`
- `{slug}-bilingual-fr` → `{slug}`

## A7 — Verify + commit

- `npm run build` exits 0.
- Sitemap count stable or growing.
- Each legacy URL returns a redirect (not 404).
- Each detail page renders in EN and FR.

## Files touched
- `browser/src/composables/useMeetings.ts` — drop canonicalMeetingId
- `browser/src/types/resolution.ts` — drop `language: '' | 'en' | 'fr'`
  on Meeting
- `browser/scripts/lib/redirects.mjs` — new helper
- `browser/scripts/post-build.mjs` — wire redirects
