<template>
  <div v-if="resolution" class="std-page res-detail-page" ref="pageRef">
    <!-- Reading Progress -->
    <div class="reading-progress-track">
      <div class="reading-progress-fill" :style="{ '--progress': readingProgress + '%' }"></div>
    </div>

    <!-- Back link -->
    <button @click="$router.back()" class="std-page__back back-link animate-up" style="--nth: 1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="back-link__icon"><path d="m15 18-6-6 6-6"/></svg>
      {{ t('resolution.back') }}
    </button>

    <!-- Language toggle (only when both EN and FR are available) -->
    <div v-if="hasLanguageChoice" class="res-lang-toggle animate-up" style="--nth: 1" role="group" :aria-label="t('resolution.languageToggleLabel')">
      <span class="res-lang-toggle__label">{{ t('resolution.languageToggleLabel') }}</span>
      <button
        class="res-lang-toggle__btn"
        :class="{ 'res-lang-toggle__btn--active': activeLang === 'en' }"
        @click="activeLang = 'en'"
      >EN</button>
      <button
        class="res-lang-toggle__btn"
        :class="{ 'res-lang-toggle__btn--active': activeLang === 'fr' }"
        @click="activeLang = 'fr'"
      >FR</button>
      <button
        class="res-lang-toggle__btn res-lang-toggle__btn--both"
        :class="{ 'res-lang-toggle__btn--active': activeLang === 'both' }"
        @click="activeLang = 'both'"
      >EN / FR</button>
    </div>

    <!-- Header -->
    <header class="std-page__header res-detail-header animate-up" style="--nth: 2">
      <div class="std-page__meta res-detail-meta">
        <span v-if="resolution.is_acclamation" class="std-page__badge res-detail-badge--acclamation">Acclamation</span>
        <span v-else-if="resolution.id" class="std-page__badge font-mono badge-id">{{ resolution.identifier || resolution.id }}</span>
        
        <router-link
          v-if="resolution.meeting_slug"
          :to="{ name: 'meeting-detail', params: { meetingSlug: resolution.meeting_slug } }"
          class="meeting-link-badge"
        >
          <svg class="meeting-link-badge__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="meeting-link-badge__text">{{ meetingLinkLabel }}</span>
          <svg class="meeting-link-badge__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>
        
        <span v-if="resolution.meeting_date" class="std-page__badge badge-date">{{ formatDate(resolution.meeting_date, lang) }}</span>
        <span v-if="!resolution.is_acclamation" class="std-page__badge">
          <template v-if="resolution.source_type === 'plenary'">Resolution</template>
          <template v-else-if="resolution.source_type === 'ballot'">Ballot resolution</template>
          <template v-else-if="resolution.source_type === '7372ma'">7372 MA resolution</template>
          <template v-else>Resolution</template>
        </span>
        <a v-if="resolution.group_id" :href="`/groups/${resolution.group_id}/`" class="std-page__badge std-page__badge--link badge-group">{{ resolution.group_id.toUpperCase() }}</a>
      </div>

      <h1 v-if="resolution.title" class="std-page__title res-detail-title">{{ resolution.title }}</h1>

      <p v-if="displaySourceTitle" class="res-detail-subtitle">
        {{ displaySourceTitle }}
      </p>
    </header>

    <!-- DOI -->
    <div v-if="resolution.doi" class="urn-bar doi-bar animate-up" style="--nth: 3">
      <span class="urn-label">DOI</span>
      <a :href="`https://doi.org/${resolution.doi}`" class="urn-value urn-value--link" target="_blank" rel="noopener noreferrer">{{ resolution.doi }}</a>
      <button
        @click="copyUrn(resolution.doi)"
        class="urn-copy-btn"
        :aria-label="copied ? 'Copied' : 'Copy DOI'"
      >
        <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>
    </div>

    <!-- URN Identifier -->
    <div v-if="resolution.urn" class="urn-bar animate-up" style="--nth: 3">
      <span class="urn-label">URN</span>
      <code class="urn-value">{{ resolution.urn }}</code>
      <button
        v-if="resolution.urn"
        @click="copyUrn(resolution.urn)"
        class="urn-copy-btn"
        :aria-label="copied ? 'Copied' : 'Copy URN'"
      >
        <svg v-if="!copied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </button>
    </div>

    <!-- Content -->
    <div class="std-page__content res-detail-content">

      <section v-if="resolution.subject" class="std-page__section animate-up" style="--nth: 4">
        <h2 class="std-page__section-heading res-detail-section-title">{{ t('resolution.subject') }}</h2>
        <div class="std-page__body res-detail-body">
          <p>{{ displaySubject }}</p>
        </div>
      </section>

      <section v-if="resolution.considerations && resolution.considerations.length > 0" class="std-page__section animate-up" style="--nth: 5">
        <h2 class="std-page__section-heading res-detail-section-title">{{ t('resolution.considerations') }}</h2>
        <div class="std-page__body res-detail-list">
          <div v-for="(cons, idx) in resolution.considerations" :key="idx" class="consideration-item res-detail-card">
            <span v-if="cons.type" class="res-detail-card-type">{{ formatActionType(cons.type, lang) }}</span>
            <div class="res-detail-richtext" v-html="asciidocify(cons.message)"></div>
          </div>
        </div>
      </section>

      <section v-if="resolution.actions && resolution.actions.length > 0" class="std-page__section animate-up" style="--nth: 6">
        <h2 class="std-page__section-heading res-detail-section-title">{{ t('resolution.actions') }}</h2>
        <div class="std-page__body res-detail-list">
          <div v-for="(act, idx) in resolution.actions" :key="idx" class="action-item res-detail-card res-detail-card--action">
            <span 
              v-if="act.type" 
              class="res-detail-card-type res-detail-card-type--action"
              :style="{ '--action-color': getActionColor(act.type).bg }"
            >
              {{ formatActionType(act.type, lang) }}
            </span>
            <p v-if="act.subject" class="res-detail-card-subject">{{ act.subject }}</p>
            <div class="res-detail-richtext" v-html="asciidocify(act.message)"></div>
            <template v-if="act.dates && act.dates.length > 0">
              <div class="res-detail-dates">
                <span v-for="(d, didx) in act.dates" :key="didx" class="res-detail-date">
                  {{ t('resolution.effective') }}: {{ d.start }}<template v-if="d.end"> &ndash; {{ d.end }}</template>
                </span>
              </div>
            </template>
          </div>
        </div>
      </section>

      <section v-if="resolution.approvals && resolution.approvals.length > 0" class="std-page__section animate-up" style="--nth: 7">
        <h2 class="std-page__section-heading res-detail-section-title">{{ t('resolution.approval') }}</h2>
        <div class="std-page__body">
          <div v-for="(app, idx) in resolution.approvals" :key="idx" class="approval-panel" :class="{ 'mt-4': idx > 0 }">
            <p class="approval-text">
              <strong v-if="app.degree" class="approval-degree">{{ app.degree }}</strong>
              <template v-if="app.message"> &mdash; {{ app.message }}</template>
            </p>
          </div>
        </div>
      </section>

      <section v-if="resolution.categories && resolution.categories.length > 0" class="std-page__section animate-up" style="--nth: 8">
        <h2 class="std-page__section-heading res-detail-section-title">{{ t('resolution.categories') }}</h2>
        <div class="categories-list">
          <span v-for="(cat, idx) in resolution.categories" :key="idx" class="std-page__badge">{{ cat }}</span>
        </div>
      </section>
      
      <!-- Related Resolutions -->
      <!-- Secondary language rendering (EN/FR side-by-side, 'both' mode) -->
      <section v-if="activeLang === 'both' && secondaryResolution" class="std-page__section res-secondary-lang animate-up">
        <h2 class="std-page__section-heading res-secondary-lang__heading">
          <span class="res-secondary-lang__badge">FR</span>
          {{ t('resolution.frenchVersion') }}
        </h2>
        <div class="std-page__body">
          <p v-if="secondaryResolution.title" class="res-secondary-lang__title">{{ secondaryResolution.title }}</p>
          <div v-if="secondaryResolution.considerations && secondaryResolution.considerations.length" class="res-detail-list">
            <div v-for="(cons, idx) in secondaryResolution.considerations" :key="`fr-cons-${idx}`" class="consideration-item res-detail-card">
              <span v-if="cons.type" class="res-detail-card-type">{{ formatActionType(cons.type, lang) }}</span>
              <div class="res-detail-richtext" v-html="asciidocify(cons.message)"></div>
            </div>
          </div>
          <div v-if="secondaryResolution.actions && secondaryResolution.actions.length" class="res-detail-list">
            <div v-for="(act, idx) in secondaryResolution.actions" :key="`fr-act-${idx}`" class="action-item res-detail-card res-detail-card--action">
              <span v-if="act.type" class="res-detail-card-type res-detail-card-type--action" :style="{ '--action-color': getActionColor(act.type).bg }">{{ formatActionType(act.type, lang) }}</span>
              <div class="res-detail-richtext" v-html="asciidocify(act.message)"></div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="relatedResolutions.length > 0" class="std-page__section animate-up" style="--nth: 9">
        <h2 class="std-page__section-heading res-detail-section-title">{{ t('resolution.related') }}</h2>
        <div class="related-list">
          <router-link 
            v-for="r in relatedResolutions" 
            :key="r.id" 
            :to="{ name: 'resolution-detail', params: { id: r.id } }"
            class="related-card"
          >
            <div class="related-meta">
              <span class="related-id">{{ r.identifier || r.id }}</span>
              <span class="related-date">{{ formatDate(r.meeting_date, lang) }}</span>
            </div>
            <div class="related-title">{{ r.title || 'Resolution ' + (r.identifier || r.id) }}</div>
            <div class="card-hover-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Prev / Next Navigation -->
      <nav class="res-navigation animate-up" style="--nth: 10" aria-label="Resolution navigation">
        <router-link
          v-if="prevResolution"
          :to="{ name: 'resolution-detail', params: { id: prevResolution.id } }"
          class="res-nav-card res-nav-card--prev"
        >
          <span class="res-nav-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            {{ t('resolution.previous') }}
          </span>
          <span class="res-nav-id font-mono">{{ prevResolution.identifier || prevResolution.id }}</span>
          <span class="res-nav-title">{{ prevResolution.title || prevResolution.id }}</span>
        </router-link>
        <div v-else class="res-nav-empty"></div>

        <router-link
          v-if="nextResolution"
          :to="{ name: 'resolution-detail', params: { id: nextResolution.id } }"
          class="res-nav-card res-nav-card--next"
        >
          <span class="res-nav-label">
            {{ t('resolution.next') }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </span>
          <span class="res-nav-id font-mono">{{ nextResolution.identifier || nextResolution.id }}</span>
          <span class="res-nav-title">{{ nextResolution.title || nextResolution.id }}</span>
        </router-link>
        <div v-else class="res-nav-empty"></div>
      </nav>

    </div>
  </div>
  
  <div v-else-if="!isLoaded" class="res-loading std-page">
    <div class="skeleton-header">
      <div class="skeleton-link"></div>
      <div class="skeleton-badges">
        <div class="skeleton-badge"></div>
        <div class="skeleton-badge w-24"></div>
      </div>
      <div class="skeleton-title-large"></div>
      <div class="skeleton-title-large w-3-4"></div>
    </div>
    <div class="skeleton-content mt-8">
      <div class="skeleton-title mt-4"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-title mt-8"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
  </div>
  
  <div v-else class="res-not-found">
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h3>Resolution not found</h3>
      <p>The resolution you requested could not be found or does not exist.</p>
      
      <form @submit.prevent="submitSearch" class="not-found-search">
        <input 
          type="search" 
          v-model="searchInput" 
          placeholder="Search for resolutions..." 
          class="not-found-input"
        >
        <button type="submit" class="not-found-submit">Search</button>
      </form>
      
      <div class="not-found-actions">
        <router-link :to="{ name: 'home' }" class="std-chip link-no-ul">{{ t('resolution.backHome') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResolutions } from '../composables/useResolutions'
import { useI18n } from '../composables/useI18n'
import type { Resolution } from '../types/resolution'
import { useMeetings } from '../composables/useMeetings'
import { asciidocify } from '../utils/asciidoc'
import { getActionColor } from '../data/actionTypes'
import { formatActionType } from '../data/actionTypes'
import { formatDate } from '../utils/format'
import { venueForLang } from '../data/venues'
import { useClipboard } from '../composables/useClipboard'

const router = useRouter()
const route = useRoute()
const { resolutions, isLoaded, loadData } = useResolutions()
const { t, lang } = useI18n()
const { getMeetingResolutions, loadData: loadMeetingsData, isLoaded: isMeetingsLoaded } = useMeetings()

const searchInput = ref('')
const pageRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)
const { copied, copy: copyUrn } = useClipboard()

onMounted(() => {
  loadData()
  loadMeetingsData()
  window.addEventListener('scroll', updateProgress, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})

watch(() => route.params, () => {
  // Reset progress + scroll to top when navigating between resolutions
  // (prev/next). Vue Router preserves scroll position by default which
  // feels jarring on detail-page transitions.
  readingProgress.value = 0
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }
})

function updateProgress() {
  if (!pageRef.value) return
  
  const element = pageRef.value
  const rect = element.getBoundingClientRect()
  
  // Calculate how much of the element we've scrolled past
  const totalScrollableHeight = rect.height - window.innerHeight
  
  if (totalScrollableHeight <= 0) {
    readingProgress.value = 100
    return
  }
  
  const pixelsScrolled = -rect.top
  let percent = (pixelsScrolled / totalScrollableHeight) * 100
  
  if (percent < 0) percent = 0
  if (percent > 100) percent = 100
  
  readingProgress.value = percent
}

// Look up the resolution record(s) matching the route.
// Several records may share the same id when both EN and FR versions exist.
function findMatchingResolutions(): Resolution[] {
  if (!isLoaded.value) return []

  const meetingId = route.params.meetingId as string
  const resolutionId = route.params.resolutionId as string
  if (meetingId && resolutionId) {
    return resolutions.value.filter(r => r.meeting_slug === meetingId && r.id === resolutionId)
  }
  const id = route.params.id as string
  if (id) {
    return resolutions.value.filter(r => r.id === id)
  }
  return []
}

// All language versions of the same logical resolution (matched by canonical identifier).
const languageVersions = computed(() => {
  const matches = findMatchingResolutions()
  if (!matches.length) return []
  const ident = matches[0].identifier
  if (!ident) return matches
  return resolutions.value.filter(r => r.identifier === ident)
})

const availableLanguages = computed(() => {
  const langs = new Set<string>()
  languageVersions.value.forEach(r => { if (r.language) langs.add(r.language) })
  return Array.from(langs).sort() as Array<'en' | 'fr'>
})

const hasLanguageChoice = computed(() => availableLanguages.value.length >= 2)

// Primary resolution drives the page rendering. In 'both' mode we also
// expose a secondary resolution (the other language).
const primaryResolution = computed(() => {
  const matches = languageVersions.value
  if (!matches.length) return null
  const target = activeLang.value === 'both' ? 'en' : activeLang.value
  return matches.find(r => r.language === target) || matches.find(r => !r.language) || matches[0]
})

const secondaryResolution = computed(() => {
  if (activeLang.value !== 'both') return null
  const matches = languageVersions.value
  return matches.find(r => r.language === 'fr') || null
})

// Backwards-compat alias so existing template references keep working.
const resolution = computed(() => primaryResolution.value)

// Translate the parenthesised placeholder subjects ("(The CIML)" /
// "(The Conference)") to the active UI language. Real subject strings
// (e.g. "CIML", "OIML Conference") are displayed verbatim.
const displaySubject = computed(() => {
  const s = resolution.value?.subject || ''
  if (s === '(The CIML)') return t.value('committee.placeholderCiml')
  if (s === '(The Conference)') return t.value('committee.placeholderConference')
  return s
})

// Localised source title: look up the meeting by meeting_slug and pick
// the title from the localisation that matches the active UI language,
// Source title is already language-correct: build-data.mjs picks the
// entry from metadata.title_localized[] matching the record's language.
// In 'both' mode we want the active UI language's title.
const displaySourceTitle = computed(() => {
  const res = resolution.value
  if (!res) return ''
  if (res.language === lang.value) return res.source_title || ''
  // UI language differs from this record's language — look up the
  // matching language version via languageVersions.
  const target = lang.value === 'fr' ? 'fr' : 'en'
  const match = languageVersions.value.find(r => r.language === target)
  return match?.source_title || res.source_title || ''
})

// Bilingual mode: 'en' | 'fr' | 'both'. Defaults to the current UI language,
// or to 'en' if the UI language isn't available for this resolution.
const activeLang = ref<'en' | 'fr' | 'both'>('en')
watch([resolution, () => lang.value], () => {
  if (!resolution.value) return
  const available = availableLanguages.value
  const fallback = available.includes(lang.value as 'en' | 'fr') ? lang.value as 'en' | 'fr' : (available[0] || 'en')
  activeLang.value = fallback
}, { immediate: true })

const meetingLinkLabel = computed(() => {
  const res = resolution.value
  if (!res) return ''
  const venue = res.venue || ''
  const isVirtual = venue.toLowerCase().includes('virtual') ||
    venue.toLowerCase().includes('online') ||
    !res.country_code // virtual meetings have no country
  if (isVirtual && res.meeting_date) {
    try {
      const d = new Date(res.meeting_date)
      const locale = lang.value === 'fr' ? 'fr-FR' : 'en-US'
      const monthYear = d.toLocaleDateString(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' })
      return `${t.value('meetings.virtual')} \u00b7 ${monthYear}`
    } catch {
      return t.value('meetings.virtual') || res.source_title || 'Meeting'
    }
  }
  // Render venue via the i18n venueForLang so UN/LOCODE cities resolve
  // to the active UI language.
  const rendered = venueForLang(res.city || venue, res.country_code || undefined, lang.value)
  return rendered || res.source_title || 'Meeting'
})

const meetingResolutions = computed(() => {
  if (!isMeetingsLoaded.value || !resolution.value || !resolution.value.meeting_slug) return []
  return getMeetingResolutions(resolution.value.meeting_slug)
})

const prevResolution = computed(() => {
  if (meetingResolutions.value.length === 0 || !resolution.value) return null
  const idx = meetingResolutions.value.findIndex(r => r.id === resolution.value?.id)
  return idx > 0 ? meetingResolutions.value[idx - 1] : null
})

const nextResolution = computed(() => {
  if (meetingResolutions.value.length === 0 || !resolution.value) return null
  const idx = meetingResolutions.value.findIndex(r => r.id === resolution.value?.id)
  return idx !== -1 && idx < meetingResolutions.value.length - 1 ? meetingResolutions.value[idx + 1] : null
})

const relatedResolutions = computed(() => {
  if (!isLoaded.value || !resolution.value) return []

  const current = resolution.value
  // "(The CIML)" / "(The Conference)" are *placeholder* subjects emitted
  // by the parser when the issuer is inferred from context (every Bulletin
  // agenda section gets one). They are not real subject tags and would
  // match thousands of unrelated resolutions across meetings — so skip
  // subject-based matching whenever either side carries a placeholder.
  const PLACEHOLDER_SUBJECTS = new Set(['(The CIML)', '(The Conference)'])
  const realSubject =
    current.subject && !PLACEHOLDER_SUBJECTS.has(current.subject)

  let related = realSubject
    ? resolutions.value.filter(r =>
        r.subject &&
        !PLACEHOLDER_SUBJECTS.has(r.subject) &&
        r.subject === current.subject &&
        r.id !== current.id,
      )
    : []

  // If none or very few found, fill with resolutions from the same meeting
  if (related.length === 0) {
    related = resolutions.value.filter(r =>
      r.meeting_date === current.meeting_date &&
      r.id !== current.id &&
      r.id !== prevResolution.value?.id &&
      r.id !== nextResolution.value?.id,
    )
  }

  return related.slice(0, 5)
})

function submitSearch() {
  if (searchInput.value) {
    router.push({ name: 'home', query: { q: searchInput.value } })
  }
}
</script>

<style scoped>
/* Animations */
.animate-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.1s);
}

.res-detail-page {
  max-width: 56rem;
  margin: 0 auto;
  position: relative;
}

/* Reading Progress */
.reading-progress-track {
  position: fixed;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 40vh;
  background: var(--color-slate-200);
  border-radius: 999px;
  overflow: hidden;
  display: none;
}
.dark .reading-progress-track {
  background: var(--color-slate-800);
}

@media (min-width: 1280px) {
  .reading-progress-track {
    display: block;
  }
}

.reading-progress-fill {
  width: 100%;
  height: var(--progress, 0%);
  background: var(--color-blue-accent);
  transition: height 0.1s linear;
}

/* Base layout */
.back-link {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate-500);
  transition: color 0.2s;
  padding: 0;
  margin-bottom: 2rem;
}
.back-link:hover,
.back-link:focus-visible {
  color: var(--color-blue-accent);
  outline: none;
}
.dark .back-link:hover,
.dark .back-link:focus-visible {
  color: #66a3e0;
}
.back-link__icon {
  transition: transform 0.2s;
}
.back-link:hover .back-link__icon {
  transform: translateX(-4px);
}

.res-detail-header {
  margin-bottom: 4rem;
}

.res-detail-meta {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.res-detail-badge--acclamation {
  background: #6366f1;
  color: white;
  border-color: transparent;
}

.badge-id { font-weight: 600; }
.badge-date { color: var(--color-slate-600); }
.dark .badge-date { color: var(--color-slate-400); }
.badge-group {
  color: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
}
.dark .badge-group {
  color: #66a3e0;
  border-color: #66a3e0;
}

.meeting-link-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.625rem 0.3rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-blue-accent);
  background: rgba(0, 97, 173, 0.06);
  border: 1px solid rgba(0, 97, 173, 0.15);
  border-radius: 0.375rem;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.meeting-link-badge__icon {
  color: var(--color-blue-accent);
  opacity: 0.7;
  flex-shrink: 0;
}

.meeting-link-badge__arrow {
  color: var(--color-blue-accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.meeting-link-badge:hover,
.meeting-link-badge:focus-visible {
  background: var(--color-blue-accent);
  color: white;
  border-color: var(--color-blue-accent);
  outline: none;
}

.meeting-link-badge:hover .meeting-link-badge__icon,
.meeting-link-badge:focus-visible .meeting-link-badge__icon {
  color: white;
  opacity: 1;
}

.meeting-link-badge:hover .meeting-link-badge__arrow,
.meeting-link-badge:focus-visible .meeting-link-badge__arrow {
  color: white;
  opacity: 1;
  transform: translateX(0);
}

.dark .meeting-link-badge {
  color: #66a3e0;
  background: rgba(102, 163, 224, 0.08);
  border-color: rgba(102, 163, 224, 0.2);
}

.dark .meeting-link-badge__icon,
.dark .meeting-link-badge__arrow {
  color: #66a3e0;
}

.dark .meeting-link-badge:hover,
.dark .meeting-link-badge:focus-visible {
  background: #66a3e0;
  color: var(--color-slate-900);
  border-color: #66a3e0;
}

.dark .meeting-link-badge:hover .meeting-link-badge__icon,
.dark .meeting-link-badge:hover .meeting-link-badge__arrow {
  color: var(--color-slate-900);
}

.res-detail-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--color-slate-900);
  line-height: 1.2;
  margin-bottom: 1rem;
}
@media (min-width: 768px) {
  .res-detail-title { font-size: 2.75rem; }
}
@media (min-width: 1024px) {
  .res-detail-title { font-size: 3.5rem; }
}
.dark .res-detail-title { color: white; }

.res-detail-subtitle {
  font-size: 1.125rem;
  color: var(--color-slate-500);
  font-style: italic;
  padding-left: 1rem;
  border-left: 2px solid var(--color-slate-200);
}
.dark .res-detail-subtitle { 
  color: var(--color-slate-400);
  border-left-color: var(--color-slate-700);
}

.res-detail-content {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  border: 1px solid var(--color-slate-200);
}
@media (max-width: 768px) {
  .res-detail-content {
    padding: 1.5rem;
  }
}
.dark .res-detail-content {
  background: var(--color-slate-900);
  border-color: var(--color-slate-800);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
}

.res-detail-section-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-slate-900);
  border-bottom: 2px solid var(--color-slate-100);
  padding-bottom: 0.5rem;
  margin-bottom: 2rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
@media (min-width: 768px) {
  .res-detail-section-title { font-size: 1.5rem; }
}
.dark .res-detail-section-title {
  color: white;
  border-bottom-color: var(--color-slate-800);
}

.res-detail-body {
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--color-slate-700);
}
.dark .res-detail-body { color: var(--color-slate-300); }

.res-detail-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.res-detail-card {
  background: var(--color-slate-50);
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-slate-100);
}
.dark .res-detail-card {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
}

.res-detail-card--action {
  background: white;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
  border-color: var(--color-slate-200);
  position: relative;
  overflow: hidden;
}
.res-detail-card--action::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 4px;
  background-color: var(--action-color, var(--color-blue-accent));
}
.dark .res-detail-card--action {
  background: var(--color-slate-900);
  border-color: var(--color-slate-700);
}

.res-detail-card-type {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-slate-500);
  margin-bottom: 0.75rem;
}
.dark .res-detail-card-type { color: var(--color-slate-400); }

.res-detail-card-type--action {
  color: var(--action-color, var(--color-blue-accent));
  background: rgba(0, 0, 0, 0.03);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}
.dark .res-detail-card-type--action {
  background: rgba(255, 255, 255, 0.05);
}

.res-detail-card-subject {
  font-weight: 600;
  font-size: 1.125rem;
  color: var(--color-slate-900);
  margin-bottom: 1rem;
}
.dark .res-detail-card-subject { color: white; }

.res-detail-richtext {
  color: var(--color-slate-700);
  line-height: 1.75;
}
.dark .res-detail-richtext { color: var(--color-slate-300); }
.res-detail-richtext :deep(p) { margin-bottom: 1rem; }
.res-detail-richtext :deep(p:last-child) { margin-bottom: 0; }
.res-detail-richtext :deep(a) { color: var(--color-blue-accent); text-decoration: underline; }

.res-detail-dates {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.res-detail-date {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-slate-100);
  color: var(--color-slate-700);
}
.dark .res-detail-date {
  background: var(--color-slate-800);
  color: var(--color-slate-300);
}

.approval-text { color: var(--color-slate-700); }
.dark .approval-text { color: var(--color-slate-300); }
.approval-degree {
  text-transform: capitalize;
  color: var(--color-slate-900);
}
.dark .approval-degree { color: white; }
.mt-4 { margin-top: 1rem; }

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Related Resolutions */
.related-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.related-card {
  position: relative;
  display: block;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-slate-200);
  background: white;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dark .related-card {
  background: var(--color-slate-900);
  border-color: var(--color-slate-800);
}

.related-card:hover,
.related-card:focus-visible {
  border-color: var(--color-blue-accent);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
  outline: none;
}
.dark .related-card:hover,
.dark .related-card:focus-visible {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}

.related-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
}

.related-id {
  font-weight: 600;
  color: var(--color-slate-500);
}

.related-date {
  color: var(--color-slate-400);
}

.related-title {
  font-weight: 500;
  color: var(--color-slate-900);
  padding-right: 1.5rem;
}
.dark .related-title { color: white; }
.related-card:hover .related-title { color: var(--color-blue-accent); }

.card-hover-arrow {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  color: var(--color-blue-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.related-card:hover .card-hover-arrow {
  opacity: 1;
  transform: translateX(0);
}


/* Navigation */
.res-navigation {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-slate-200);
}
.dark .res-navigation { border-top-color: var(--color-slate-800); }

.res-nav-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-100);
  text-decoration: none;
  transition: all 0.2s ease;
}
.dark .res-nav-card {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
}
.res-nav-card:hover,
.res-nav-card:focus-visible {
  background: white;
  border-color: var(--color-blue-accent);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
  outline: none;
}
.dark .res-nav-card:hover,
.dark .res-nav-card:focus-visible {
  background: var(--color-slate-900);
  border-color: #66a3e0;
}

.res-nav-card--prev { text-align: left; }
.res-nav-card--next { text-align: right; }

.res-nav-empty { flex: 1; }

.res-nav-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate-500);
  margin-bottom: 0.25rem;
}
.res-nav-card--next .res-nav-label { justify-content: flex-end; }

.res-nav-title {
  font-weight: 500;
  color: var(--color-slate-900);
  font-size: 0.9375rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dark .res-nav-title { color: white; }
.res-nav-card:hover .res-nav-title { color: var(--color-blue-accent); }
.dark .res-nav-card:hover .res-nav-title { color: #66a3e0; }

.res-loading {
  display: flex;
  flex-direction: column;
  padding: 6rem 1rem;
  max-width: 56rem;
  margin: 0 auto;
}

.res-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 1rem;
  text-align: center;
}

/* Rest of the empty/loading states... */
.empty-state {
  display: inline-block;
  padding: 4rem;
  background: white;
  border-radius: 1rem;
  border: 1px dashed var(--color-slate-200);
  max-width: 36rem;
  width: 100%;
}
.dark .empty-state {
  background: var(--color-slate-900);
  border-color: var(--color-slate-800);
}
.empty-state__icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  color: var(--color-slate-300);
}
.dark .empty-state__icon { color: var(--color-slate-600); }
.empty-state h3 {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-slate-900);
  margin-bottom: 0.5rem;
}
.dark .empty-state h3 { color: white; }
.empty-state p {
  color: var(--color-slate-500);
  margin-bottom: 2rem;
}

.not-found-search {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.not-found-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-slate-300);
  background: white;
  color: var(--color-slate-900);
  font-size: 1rem;
}
.dark .not-found-input {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: white;
}

.not-found-submit {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  background: var(--color-blue-accent);
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}
.not-found-submit:hover {
  background: #005090;
}

.not-found-actions {
  display: flex;
  justify-content: center;
}

.link-no-ul { text-decoration: none; display: inline-block; }

.skeleton-header { display: flex; flex-direction: column; gap: 1rem; }
.skeleton-link { width: 6rem; height: 1rem; }
.skeleton-badges { display: flex; gap: 0.5rem; }
.skeleton-title-large { width: 100%; height: 3rem; margin-top: 0.5rem; }
.skeleton-content { display: flex; flex-direction: column; gap: 1rem; }
.mt-8 { margin-top: 2rem; }
.skeleton-badge { height: 1rem; width: 5rem; }
.w-24 { width: 6rem; }
.w-3-4 { width: 75%; }
.skeleton-title { height: 1.5rem; width: 60%; }
.skeleton-text { height: 1rem; width: 100%; }
.skeleton-card {
  height: 8rem;
  width: 100%;
  border-radius: 0.75rem;
  background-color: var(--color-slate-200);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.dark .skeleton-card {
  background-color: var(--color-slate-800);
}

.urn-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}
.dark .urn-bar {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
}
.urn-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-slate-400);
  flex-shrink: 0;
}
.urn-value {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  color: var(--color-slate-700);
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
}
.dark .urn-value {
  color: var(--color-slate-300);
}
.urn-copy-btn {
  flex-shrink: 0;
  background: transparent;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.375rem;
  padding: 0.375rem;
  color: var(--color-slate-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.urn-copy-btn:hover,
.urn-copy-btn:focus-visible {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: white;
  outline: none;
}
</style>
