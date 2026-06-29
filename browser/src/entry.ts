import { ViteSSG } from 'vite-ssg'
import type { Resolution } from './types/resolution'
import App from './App.vue'
import { routes } from './router'
import './assets/main.css'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
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
