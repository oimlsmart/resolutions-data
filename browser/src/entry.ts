import { ViteSSG } from 'vite-ssg'
import type { Resolution, Meeting } from './types/resolution'
import App from './App.vue'
import { routes } from './router'
import './assets/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
    scrollBehavior(to, _from, savedPosition) {
      if (to.hash) {
        // Wait for the next tick so the target view has mounted.
        return new Promise((resolve) => {
          setTimeout(() => {
            const el = document.querySelector(to.hash)
            if (el) {
              resolve({ el, behavior: 'smooth', top: 80 })
            } else {
              resolve({ top: 0 })
            }
          }, 100)
        })
      }
      if (savedPosition) return savedPosition
      return { top: 0 }
    },
  },
  async () => {
    if (import.meta.env.SSR) {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')
      const { useResolutions } = await import('./composables/useResolutions')
      const { useMeetings } = await import('./composables/useMeetings')

      const dataPath = resolve(process.cwd(), 'public/data/resolutions.json')
      const data: Resolution[] = JSON.parse(readFileSync(dataPath, 'utf-8'))

      const meetingsPath = resolve(process.cwd(), 'public/data/meetings.json')
      const meetingsData: Meeting[] = JSON.parse(readFileSync(meetingsPath, 'utf-8'))

      const { resolutions, isLoaded } = useResolutions()
      resolutions.value = data
      isLoaded.value = true

      // Populate the meetings store on the server too, otherwise the
      // SSG-rendered meetings page (and any "N meetings" counter on
      // the home page) emits "0 meetings" / empty-state, and the
      // client-side fetch in useMeetings.onMounted doesn't run during
      // SSG build.
      const { setMeetings } = useMeetings()
      setMeetings(meetingsData)
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
