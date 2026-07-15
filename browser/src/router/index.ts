import type { RouteRecordRaw } from 'vue-router'

// All public routes are nested under a /:lang prefix (`/en/...`, `/fr/...`).
// The bare paths (`/`, `/about`, ...) 301-redirect to the detected-language
// equivalent so old links keep working. Route names are unique per page
// (no language suffix) — the active language is encoded in the path.

const pageRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: 'resolution/:id',
    name: 'resolution-detail',
    component: () => import('../views/ResolutionDetail.vue'),
  },
  {
    path: 'meetings',
    name: 'meetings',
    component: () => import('../views/Meetings.vue'),
  },
  // Canonical meeting route: /<lang>/meetings/<slug> where slug is the
  // URN-derived identifier (e.g. "ciml-15", "conference-13"). Legacy
  // URLs that used source PDF filenames (/meetings/15CIML-1976-FR) are
  // detected by MeetingDetail.vue and replaced with the canonical URL.
  {
    path: 'meetings/:meetingSlug',
    name: 'meeting-detail',
    component: () => import('../views/MeetingDetail.vue'),
  },
  {
    path: 'about',
    name: 'about',
    component: () => import('../views/About.vue'),
  },
]

export const routes: RouteRecordRaw[] = [
  // Language-prefixed route tree. Children are pageRoutes; the :lang
  // param is validated by the regex below so /en/* and /fr/* match and
  // everything else falls through to the legacy redirects.
  {
    path: '/:lang(en|fr)',
    children: pageRoutes,
  },

  // Root → detect language from localStorage / browser, redirect.
  {
    path: '/',
    name: 'root',
    redirect: (to) => detectLangRedirect('/', to),
  },

  // Legacy bare paths → redirect to the detected-language equivalent.
  // Vue Router matches in order; the more specific patterns below win.
  { path: '/resolution/:id', redirect: (to) => detectLangRedirect(`/resolution/${to.params.id}`, to) },
  { path: '/meetings/:meetingSlug', redirect: (to) => detectLangRedirect(`/meetings/${to.params.meetingSlug}`, to) },
  { path: '/meetings', redirect: (to) => detectLangRedirect('/meetings', to) },
  { path: '/about', redirect: (to) => detectLangRedirect('/about', to) },

  // 404 catch-all falls through to the SPA fallback (post-build.mjs
  // generates /404.html from /en/index.html).
]

function detectLangRedirect(target: string, to: { query: any; hash: string }) {
  const saved = typeof localStorage !== 'undefined' && localStorage.getItem('oiml-lang')
  const nav = typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase()
  const lang = saved === 'fr' || saved === 'en'
    ? saved
    : nav && nav.startsWith('fr') ? 'fr' : 'en'
  return { path: `/${lang}${target}`, query: to.query, hash: to.hash }
}
