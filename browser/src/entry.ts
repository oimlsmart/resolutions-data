import { ViteSSG } from 'vite-ssg'
import type { Resolution } from './types/resolution'
import App from './App.vue'
import { routes } from './router'
import './assets/main.css'

/**
 * Scroll behavior applied across every navigation. New routes land at the
 * top of the page; browser back/forward restores the saved position;
 * hash anchors scroll smoothly to the targeted element with a small
 * offset so the sticky header doesn't cover the heading.
 */
const scrollBehavior = (to: any, _from: any, savedPosition: any) => {
  if (savedPosition) return savedPosition
  if (to.hash) {
    const el = document.querySelector(to.hash)
    if (el) return { el: to.hash, top: 80, behavior: 'smooth' as const }
  }
  return { top: 0, left: 0 }
}

export const createApp = ViteSSG(
  App,
  { routes, scrollBehavior, base: import.meta.env.BASE_URL },
  async () => {
    if (import.meta.env.SSR) {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')
      const { useResolutions } = await import('./composables/useResolutions')

      const dataPath = resolve(process.cwd(), 'public/data/resolutions.json')
      const data: Resolution[] = JSON.parse(readFileSync(dataPath, 'utf-8'))

      const { resolutions, isLoaded } = useResolutions()
      resolutions.value = data
      isLoaded.value = true
    } else {
      const pageData = (window as any).__PAGE_DATA__
      if (pageData) {
        const { useResolutions } = await import('./composables/useResolutions')
        const { setPageData } = useResolutions()
        setPageData(pageData as Resolution[])
      }
    }
  }
)
