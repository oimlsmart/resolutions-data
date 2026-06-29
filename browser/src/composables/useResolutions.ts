import { ref, type Ref } from 'vue'
import FlexSearch from 'flexsearch'
import type { Action, Consideration, Approval, Resolution } from '../types/resolution'

export type { Action, Consideration, Approval, Resolution }

const BUILD_TIME = Date.now()

const resolutions = ref<Resolution[]>([]) as Ref<Resolution[]>
const isLoaded = ref(false)
const hasFullData = ref(false)

let indexInstance: InstanceType<typeof FlexSearch.Document> | null = null
let loadPromise: Promise<void> | null = null

function buildSearchIndex(data: Resolution[]): InstanceType<typeof FlexSearch.Document> {
  const idx = new FlexSearch.Document({
    document: {
      id: 'internalId',
      index: ['id', 'title', 'subject', 'snippet']
    },
    tokenize: 'forward'
  })

  data.forEach((res, i) => {
    idx.add({
      internalId: i,
      id: res.id,
      title: res.title,
      subject: res.subject,
      snippet: res.snippet
    })
  })

  return idx
}

export function useResolutions() {
  const loadData = async () => {
    if (hasFullData.value) return
    if (loadPromise) { await loadPromise; return }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/resolutions.json?t=${BUILD_TIME}`)
        const data: Resolution[] = await response.json()
        resolutions.value = data
        indexInstance = buildSearchIndex(data)
        isLoaded.value = true
        hasFullData.value = true
      } catch (e) {
        console.error('Failed to load resolutions', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setPageData = (data: Resolution[]) => {
    resolutions.value = data
    isLoaded.value = true
  }

  const search = (query: string): Resolution[] => {
    if (!indexInstance || !query) return []
    const results = indexInstance.search(query, { limit: 1000 })
    const matchedIndices = new Set<number>()
    results.forEach((fieldResult: any) => {
      fieldResult.result.forEach((docId: number) => {
        matchedIndices.add(docId)
      })
    })
    return resolutions.value.filter((_, i) => matchedIndices.has(i))
  }

  return {
    resolutions,
    isLoaded,
    loadData,
    search,
    setPageData
  }
}
