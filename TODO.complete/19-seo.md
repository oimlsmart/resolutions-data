# 19 — Item 11: SEO meta + structured data

## Symptom
"Consider SEO."

## Current state
- `@unhead/vue` is installed but unused.
- Each page has a generic `<title>OIML Resolutions</title>`.
- No `<meta name="description">`, no OG, no Twitter card, no JSON-LD.
- Sitemap has URLs only (no `<lastmod>`).
- No canonical URLs.
- No hreflang alternates.

## Target

### Per-page meta (via @unhead/vue)
- **Home**: title "OIML Resolutions — CIML & Conference archive",
  description "Search and browse 1,640 resolutions..."
- **MeetingDetail**: title "{Meeting title} | OIML", description
  "Resolutions adopted at the {N}th CIML Meeting ({year}, {venue})."
- **ResolutionDetail**: title "{Resolution title} — {Meeting short}",
  description first 160 chars of the action text.
- **Meetings index**: title "Meetings | OIML", description "Browse
  CIML and Conference meetings from 2004 to today."
- **About**: title "About | OIML Resolutions"

### Open Graph + Twitter card
For every page:
```html
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:type" content="website">  <!-- or "article" for detail pages -->
<meta property="og:url" content="https://...">
<meta property="og:image" content="https://.../og-default.png">
<meta name="twitter:card" content="summary_large_image">
```

### JSON-LD structured data
For each **MeetingDetail** page:
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "60th CIML Meeting",
  "startDate": "2025-10-13",
  "endDate": "2025-10-15",
  "location": {
    "@type": "Place",
    "name": "Paris, France",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR",
      "addressLocality": "Paris"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "OIML"
  }
}
```

For each **ResolutionDetail** page:
```json
{
  "@context": "https://schema.org",
  "@type": "Legislation",
  "name": "CIML/2025/44 — Agenda item 16.2",
  "legislationIdentifier": "CIML/2025/44",
  "dateCreated": "2025-10-13",
  "datePublished": "2025-10-15",
  "inLanguage": ["en", "fr"],
  "isPartOf": {
    "@type": "Legislation",
    "name": "60th CIML Meeting Resolutions"
  }
}
```

### Canonical URL + hreflang
```html
<link rel="canonical" href="https://.../resolution/CIML-2025-44">
<link rel="alternate" hreflang="en" href="https://.../resolution/CIML-2025-44?lang=en">
<link rel="alternate" hreflang="fr" href="https://.../resolution/CIML-2025-44?lang=fr">
<link rel="alternate" hreflang="x-default" href="https://.../resolution/CIML-2025-44">
```

### Sitemap enhancements
```xml
<url>
  <loc>https://.../resolution/CIML-2025-44</loc>
  <lastmod>2025-10-15</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
  <xhtml:link rel="alternate" hreflang="en" href="...?lang=en"/>
  <xhtml:link rel="alternate" hreflang="fr" href="...?lang=fr"/>
</url>
```

## Files touched
- `browser/src/composables/useHead.ts` — new composable wrapping
  `@unhead/vue`'s `useHead` with OIML defaults (site name, OG image).
- `browser/src/views/*.vue` — call `useHead({...})` per page.
- `browser/scripts/post-build.mjs` — extend sitemap with lastmod +
  hreflang.
- `browser/public/og-default.png` — 1200×630 default OG image (or
  generate per-page).

## Verification
- Run Lighthouse → SEO score should hit 90+.
- View source on a detail page → JSON-LD present.
- Test in Rich Results Test
  (https://search.google.com/test/rich-results).
