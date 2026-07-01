import { defineConfig } from 'vite'
import yaml from '@modyfi/vite-plugin-yaml'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let cachedData: any[] | null = null
function getData() {
  if (!cachedData) {
    const dataPath = resolve(process.cwd(), 'public/data/resolutions.json')
    cachedData = JSON.parse(readFileSync(dataPath, 'utf-8'))
  }
  return cachedData!
}

function getPageData(route: string) {
  const data = getData()
  if (route.startsWith('/resolution/')) {
    const id = route.split('/').pop()
    const res = data.find(r => r.id === id)
    return res ? [res] : []
  }
  if (/^\/meetings\/[^/]+$/.test(route)) {
    const sf = decodeURIComponent(route.split('/').pop()!)
    return data.filter(r => r.source_file === sf)
  }
  return null
}

export default defineConfig({
  plugins: [vue(), yaml()],
  base: '/resolutions-data/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/') || id.includes('node_modules/vue-router/')) {
            return 'vue-vendor'
          }
          if (id.includes('node_modules/flexsearch/')) {
            return 'flexsearch'
          }
        }
      }
    }
  },
  ssgOptions: {
    dirStyle: 'nested',
    formatting: 'minify',
    mock: true,
    includedRoutes: async () => {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')
      const dataPath = resolve(process.cwd(), 'public/data/resolutions.json')
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'))
      const resolutionIds = data.map((r: any) => `/resolution/${r.id}`)
      const meetingFiles = [...new Set(data.map((r: any) => r.source_file))].map((s: string) => `/meetings/${s}`)
      return ['/', '/meetings', '/about', ...resolutionIds, ...meetingFiles]
    },
    onPageRendered: async (route, renderedHTML) => {
      let html = renderedHTML

      const pageData = getPageData(route)
      if (pageData) {
        const json = JSON.stringify(pageData).replace(/</g, '\\u003c').replace(/<!--/g, '\\u003c!--')
        html = html.replace('</head>', `<script>window.__PAGE_DATA__=${json}</script>\n</head>`)
      }

      // Canonical URL + hreflang alternates for every route (see
      // TODO.complete/19-seo.md). The base path matches the GitHub
      // Pages deployment under /resolutions-data/.
      const siteBase = 'https://oiml.org/resolutions'
      const canonicalUrl = `${siteBase}${route === '/' ? '' : route}`
      const canonicalBlock = `<link rel="canonical" href="${canonicalUrl}">\n  <meta property="og:url" content="${canonicalUrl}">\n  <meta property="og:image" content="${siteBase}/og-default.png">\n  <link rel="alternate" hreflang="en" href="${canonicalUrl}?lang=en">\n  <link rel="alternate" hreflang="fr" href="${canonicalUrl}?lang=fr">\n  <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">`

      // JSON-LD structured data (TODO.complete/19-seo.md §F2).
      // Each route emits the schema.org/@type that fits it so Google
      // can render rich results.
      let jsonLd = ''
      if (route.startsWith('/resolution/') && pageData && pageData.length > 0) {
        const res = pageData[0]
        jsonLd = `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Legislation',
          name: res.identifier || res.id,
          legislationIdentifier: res.identifier,
          headline: res.title,
          datePublished: res.meeting_date,
          dateCreated: res.meeting_date,
          inLanguage: [res.language || 'en'],
          isPartOf: res.source_file
            ? { '@type': 'Legislation', name: res.source_title }
            : undefined,
          url: canonicalUrl,
          ...(res.doi ? { sameAs: `https://doi.org/${res.doi}` } : {}),
        })}</script>\n  `
      } else if (route.startsWith('/meetings/') && pageData && pageData.length > 0) {
        const m = pageData[0]
        jsonLd = `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: m.source_title,
          startDate: m.meeting_date,
          endDate: m.meeting_date_end || m.meeting_date,
          eventStatus: 'https://schema.org/EventCompleted',
          organizer: {
            '@type': 'Organization',
            name: 'OIML',
            url: 'https://www.oiml.org',
          },
          location: {
            '@type': 'Place',
            name: m.city || '',
            address: {
              '@type': 'PostalAddress',
              addressLocality: m.city,
              addressCountry: m.country_code,
            },
          },
          inLanguage: [...new Set(pageData.map((r: any) => r.language || 'en'))],
          url: canonicalUrl,
        })}</script>\n  `
      } else if (route === '/') {
        jsonLd = `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'OIML Resolutions',
          url: canonicalUrl,
          inLanguage: ['en', 'fr'],
        })}</script>\n  `
      }

      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s)
      let title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : null
      title = title ? title.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F310}]\s*/gu, '').trim() : null

      if (route.startsWith('/resolution/') && title) {
        const fullTitle = `${title} | OIML`
        html = html.replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`)

        const descMatch = html.match(/<p[^>]*class="[^"]*res-detail-subtitle[^"]*"[^>]*>(.*?)<\/p>/s)
        const desc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : `${title} — OIML resolution.`
        html = html.replace('</head>', `<meta name="description" content="${desc.replace(/"/g, '&quot;').substring(0, 160)}">\n  <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="${desc.replace(/"/g, '&quot;').substring(0, 160)}">\n  <meta property="og:type" content="article">\n  ${jsonLd}${canonicalBlock}\n</head>`)
      } else if (route.startsWith('/meetings/') && title) {
        const fullTitle = `Meeting: ${title} | OIML`
        html = html.replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`)
        html = html.replace('</head>', `<meta name="description" content="Resolutions from ${title} — OIML">\n  <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="Resolutions adopted at ${title.replace(/"/g, '&quot;')}">\n  <meta property="og:type" content="website">\n  ${jsonLd}${canonicalBlock}\n</head>`)
      } else if (route === '/meetings') {
        html = html.replace(/<title>.*?<\/title>/, '<title>Meetings | OIML</title>')
        html = html.replace('</head>', `<meta name="description" content="Browse OIML plenary meetings by year, country, and venue.">\n  <meta property="og:title" content="Meetings | OIML">\n  <meta property="og:description" content="Browse OIML plenary meetings by year, country, and venue.">\n  ${canonicalBlock}\n</head>`)
      } else if (route === '/about') {
        html = html.replace(/<title>.*?<\/title>/, '<title>About | OIML</title>')
        html = html.replace('</head>', `<meta name="description" content="About the OIML resolutions database.">\n  ${canonicalBlock}\n</head>`)
      } else if (route === '/') {
        const countMatch = html.match(/\b(\d[\d,]{2,})\s+resolutions?/i)
        const count = countMatch ? countMatch[1] : ''
        const descSuffix = count ? `${count} resolutions of` : 'resolutions of'
        html = html.replace('</head>', `<meta name="description" content="Search and browse ${descSuffix} OIML — Legal Metrology.">\n  <meta property="og:title" content="OIML Resolutions">\n  <meta property="og:description" content="Search and browse resolutions of OIML — Legal Metrology.">\n  ${jsonLd}${canonicalBlock}\n</head>`)
      }

      return html
    },
  },
})
