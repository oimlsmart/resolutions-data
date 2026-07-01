// Bilingual UI (English / French) for the OIML Resolutions archive.
// Language preference is persisted in localStorage and defaults to the
// browser's preferred language.
//
// Design note (TODO.complete/25-oiml-final-audit.md A7): `t` is exposed
// as a plain function, NOT a ComputedRef. Callers in <script setup>
// can write `t('key')` directly — no `t.value('key')` confusion.
// Reactivity is preserved because the function reads `currentLang.value`
// on every call, so templates that use `{{ t('key') }}` re-render when
// the language changes.

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

/**
 * Translate a key into the current UI language.
 *
 * Safe to call from <script setup>, computed properties, watchers,
 * event handlers, and templates. The function reads `currentLang`
 * (a module-level ref) on every invocation so it always reflects the
 * latest language choice — Vue's reactivity tracker picks up the
 * dependency and re-renders templates that use `t('key')`.
 */
export function t(key: TranslationKey): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[currentLang.value] ?? entry.en ?? key
}

export function useI18n() {
  const lang = computed(() => currentLang.value)

  const setLang = (newLang: Language) => {
    currentLang.value = newLang
  }

  const toggleLang = () => {
    currentLang.value = currentLang.value === 'en' ? 'fr' : 'en'
  }

  return { t, lang, setLang, toggleLang }
}

export type { Language, TranslationKey }
