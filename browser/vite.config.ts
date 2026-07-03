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
    const slug = decodeURIComponent(route.split('/').pop()!)
    return data.filter(r => r.meeting_slug === slug)
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
      const meetingsPath = resolve(process.cwd(), 'public/data/meetings.json')
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'))
      const resolutionIds = data.map((r: any) => `/resolution/${r.id}`)
      // Pre-render one page per canonical meeting slug (read from
      // meetings.json so skeleton-only meetings with no resolutions
      // still get a page). Legacy source-file URLs are not pre-rendered
      // — they fall through to the SPA, which redirects them.
      let meetingSlugs: string[] = []
      try {
        const meetings = JSON.parse(readFileSync(meetingsPath, 'utf-8'))
        meetingSlugs = meetings.map((m: any) => `/meetings/${m.meeting_slug}`)
      } catch {
        // Fall back to slugs derived from resolution data if meetings.json
        // is unavailable.
        meetingSlugs = [...new Set(data.map((r: any) => r.meeting_slug).filter(Boolean))].map((s: string) => `/meetings/${s}`)
      }
      return ['/', '/meetings', '/about', ...resolutionIds, ...meetingSlugs]
    },
    onPageRendered: async (route, renderedHTML) => {
      let html = renderedHTML

      const pageData = getPageData(route)
      if (pageData) {
        const json = JSON.stringify(pageData).replace(/</g, '\\u003c').replace(/<!--/g, '\\u003c!--')
        html = html.replace('</head>', `<script>window.__PAGE_DATA__=${json}</script>\n</head>`)
      }

      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s)
      let title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : null
      title = title ? title.replace(/[\u{1F1E0}-\u{1F1FF}\u{1F310}]\s*/gu, '').trim() : null

      if (route.startsWith('/resolution/') && title) {
        const fullTitle = `${title} | OIML`
        html = html.replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`)

        const descMatch = html.match(/<p[^>]*class="[^"]*res-detail-subtitle[^"]*"[^>]*>(.*?)<\/p>/s)
        const desc = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : `${title} — OIML resolution.`
        html = html.replace('</head>', `<meta name="description" content="${desc.replace(/"/g, '&quot;').substring(0, 160)}">\n  <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="${desc.replace(/"/g, '&quot;').substring(0, 160)}">\n  <meta property="og:type" content="article">\n</head>`)
      } else if (route.startsWith('/meetings/') && title) {
        const fullTitle = `Meeting: ${title} | OIML`
        html = html.replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`)
        html = html.replace('</head>', `<meta name="description" content="Resolutions from ${title} — OIML">\n  <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}">\n  <meta property="og:description" content="Resolutions adopted at ${title.replace(/"/g, '&quot;')}">\n  <meta property="og:type" content="website">\n</head>`)
      } else if (route === '/meetings') {
        html = html.replace(/<title>.*?<\/title>/, '<title>Meetings | OIML</title>')
        html = html.replace('</head>', `<meta name="description" content="Browse OIML plenary meetings by year, country, and venue.">\n  <meta property="og:title" content="Meetings | OIML">\n  <meta property="og:description" content="Browse OIML plenary meetings by year, country, and venue.">\n</head>`)
      } else if (route === '/about') {
        html = html.replace(/<title>.*?<\/title>/, '<title>About | OIML</title>')
        html = html.replace('</head>', `<meta name="description" content="About the OIML resolutions database.">\n</head>`)
      } else if (route === '/') {
        const countMatch = html.match(/\b(\d[\d,]{2,})\s+resolutions?/i)
        const count = countMatch ? countMatch[1] : ''
        const descSuffix = count ? `${count} resolutions of` : 'resolutions of'
        html = html.replace('</head>', `<meta name="description" content="Search and browse ${descSuffix} OIML — Legal Metrology.">\n  <meta property="og:title" content="OIML Resolutions">\n  <meta property="og:description" content="Search and browse resolutions of OIML — Legal Metrology.">\n</head>`)
      }

      return html
    },
  },
})
