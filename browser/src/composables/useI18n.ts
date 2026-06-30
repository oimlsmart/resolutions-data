// Bilingual UI (English / French) for the OIML Resolutions archive.
// Language preference is persisted in localStorage and defaults to the
// browser's preferred language.

import { ref, computed, watch } from 'vue'
import { translations, type TranslationKey, type Language } from '../data/translations'

const STORAGE_KEY = 'oiml-lang'
const DEFAULT_LANG: Language = 'en'

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'fr') return saved
  const nav = (navigator.language || '').toLowerCase()
  return nav.startsWith('fr') ? 'fr' : DEFAULT_LANG
}

const currentLang = ref<Language>(detectInitialLanguage())

function applyHtmlLang(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang
  }
}

applyHtmlLang(currentLang.value)

watch(currentLang, (lang) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang)
  }
  applyHtmlLang(lang)
})

export function useI18n() {
  const t = computed(() => (key: TranslationKey) => {
    const entry = translations[key]
    if (!entry) return key
    return entry[currentLang.value] ?? entry.en ?? key
  })
  const lang = computed(() => currentLang.value)

  const setLang = (lang: Language) => {
    currentLang.value = lang
  }

  const toggleLang = () => {
    currentLang.value = currentLang.value === 'en' ? 'fr' : 'en'
  }

  return { t, lang, setLang, toggleLang }
}

export type { Language, TranslationKey }
