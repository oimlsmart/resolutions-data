<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-bg">
        <div class="hero-bg__mesh"></div>
        <div class="hero-bg__grid"></div>
      </div>
      
      <div class="hero-content">
        <h1 class="hero-title animate-up" style="--nth: 1">
          {{ t('home.heroLine1') }} <br/> <span class="text-blue-accent">{{ t('home.heroLine2') }}</span>
        </h1>
        
        <p class="hero-subtitle animate-up" style="--nth: 2">
          <template v-if="!isLoaded">{{ t('home.loading') }}</template>
          <template v-else>
            {{ interpolate(t('home.subtitle'), { resolutions: formatNumber(animResolutions), meetings: formatNumber(animMeetings), earliest: yearRange.earliest, latest: yearRange.latest }) }} {{ t('home.tagline') }}.
          </template>
        </p>

        <div class="hero-stats animate-up" style="--nth: 3">
          <div class="stat-item">
            <span class="stat-value">
              <template v-if="!isLoaded">—</template>
              <template v-else>{{ formatNumber(animResolutions) }}</template>
            </span>
            <span class="stat-label">{{ t('home.resolutionsLabel') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">
              <template v-if="!isLoaded">—</template>
              <template v-else>{{ formatNumber(animMeetings) }}</template>
            </span>
            <span class="stat-label">{{ t('home.meetingsLabel') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatNumber(animMembers) }}</span>
            <span class="stat-label">{{ t('home.memberStatesLabel') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ formatYear(animEstablished) }}</span>
            <span class="stat-label">{{ t('home.establishedLabel') }}</span>
          </div>
        </div>

        <div class="hero-search-wrapper animate-up" style="--nth: 4">
          <div class="hero-search-input-box">
            <svg class="hero-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref="searchInputRef"
              type="search"
              v-model="searchQuery"
              class="hero-search-input"
              :placeholder="t('search.placeholder')"
              autocomplete="off"
              spellcheck="false"
              :aria-label="t('home.searchAriaLabel')"
            />
            <div class="hero-search-hint">
              <kbd>/</kbd> {{ t('home.searchHint') }}
            </div>
          </div>
        </div>

        <div class="hero-actions animate-up" style="--nth: 5">
          <button @click="scrollToResults" class="hero-btn hero-btn--primary">
            {{ t('home.browseResolutions') }}
          </button>
          <router-link :to="{ name: 'meetings' }" class="hero-btn hero-btn--secondary">
            {{ t('home.browseMeetings') }}
          </router-link>
        </div>
      </div>
    </div>

    <div class="res-page" id="results-section">
      <div class="std-filter std-filter--elevated">
        <div class="std-filter__controls">
          <div class="std-filter__field">
            <span class="std-filter__label">{{ t('home.filterByYear') }}</span>
            <div class="std-filter__chips">
              <button
                class="std-chip"
                :class="{ 'is-active': selectedYear === '' }"
                @click="selectedYear = ''"
              >{{ t('home.allYears') }}</button>
              <button
                v-for="year in availableYears"
                :key="year"
                class="std-chip"
                :class="{ 'is-active': selectedYear === year }"
                @click="selectedYear = year"
              >{{ year }}</button>
            </div>
          </div>

          <div class="std-filter__field" v-if="topActionTypes.length">
            <span class="std-filter__label">{{ t('home.filterByAction') }}</span>
            <div class="std-filter__chips">
              <button
                class="std-chip"
                :class="{ 'is-active': selectedActionTypes.size === 0 }"
                @click="selectedActionTypes.clear()"
              >{{ t('home.allActions') }}</button>
              <button
                v-for="action in topActionTypes"
                :key="action"
                class="std-chip"
                :class="{ 'is-active': selectedActionTypes.has(action) }"
                @click="toggleActionType(action)"
              >
                <span class="chip-color-dot" :style="{ '--dot-bg': getActionColor(action).bg }"></span>
                {{ getActionLabel(action, lang) }}
              </button>
            </div>
          </div>

          <div class="std-filter__field std-filter__field--flex-end">
            <div class="sort-dropdown-container">
              <label for="sort-dropdown" class="sr-only">{{ t('home.sortBy') }}</label>
              <select id="sort-dropdown" v-model="sortOrder" class="sort-dropdown">
                <option value="newest">{{ t('home.sortNewest') }}</option>
                <option value="oldest">{{ t('home.sortOldest') }}</option>
                <option value="most_actions">{{ t('home.sortMostActions') }}</option>
              </select>
              <svg class="sort-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div class="active-filters-bar" v-if="searchQuery || selectedYear || selectedActionTypes.size > 0">
          <span class="active-filters-label">{{ t('home.activeFilters') }}</span>
          <div class="active-filter-chips">
             <button v-if="searchQuery" class="active-filter-chip" @click="searchQuery = ''">
               "{{ searchQuery }}" <span class="filter-remove">&times;</span>
             </button>
             <button v-if="selectedYear" class="active-filter-chip" @click="selectedYear = ''">
               {{ selectedYear }} <span class="filter-remove">&times;</span>
             </button>
             <button v-for="act in Array.from(selectedActionTypes)" :key="act" class="active-filter-chip" @click="toggleActionType(act)">
               {{ act }} <span class="filter-remove">&times;</span>
             </button>
             <button class="active-filter-clear" @click="clearAllFilters">{{ t('home.clearAll') }}</button>
          </div>
        </div>

        <div class="std-filter__meta">
          <span>{{ interpolate(t('home.showing'), { count: groupedFilteredResolutions.length, total: totalResolutions }) }}</span>
          <button class="legend-toggle" @click="isLegendOpen = !isLegendOpen">
            {{ isLegendOpen ? t('home.hideLegend') : t('home.viewLegend') }}
          </button>
        </div>

          <div v-show="isLegendOpen" class="action-legend">
            <div v-for="action in allActionTypes" :key="action" class="legend-item">
               <span class="legend-color" :style="{ '--legend-bg': getActionColor(action).bg }"></span>
               <span class="legend-label">{{ getActionLabel(action, lang) }}</span>
            </div>
          </div>
      </div>

      <div class="std-results" v-if="isLoaded">
        <router-link 
          v-for="(res, index) in paginatedResolutions" 
          :key="res.source_file + res.id" 
          :to="{ name: 'resolution-detail', params: { id: res.id } }"
          class="std-results__card meeting-card animate-card"
          :style="`--nth: ${index % limit}`"
        >
          <div class="card-header-row">
            <div class="std-results__name">
              <span v-if="res.is_acclamation" class="std-results__type type-acclamation">{{ t('home.acclamation') }}</span>
              <template v-else>
                <span>{{ res.identifier || res.id }}</span>
                <span class="std-results__type">{{ getMeetingTypeShort(bodyTypeFromSourceFile(res.source_file), lang) }}</span>
              </template>
            </div>
            <span class="badge-year">{{ res.year }}</span>
          </div>

          <div class="std-results__title meeting-card__title">
            <span v-html="highlightText(res.is_acclamation ? t('home.acclamation') : (res.title || interpolate(t('resolution.fallbackTitle'), { id: res.identifier || res.id })), searchQuery)"></span>
          </div>

          <div v-if="res.snippet" class="std-results__snippet snippet-text">
            <span v-html="highlightText(res.snippet, searchQuery)"></span>
          </div>
          
          <div class="card-footer">
            <div class="card-actions-chips" v-if="getUniqueActions(res).length">
              <span 
                v-for="actType in getUniqueActions(res).slice(0, 3)" 
                :key="actType"
                class="action-chip"
                :style="{ '--chip-bg': getActionColor(actType).bg, '--chip-text': getActionColor(actType).text }"
              >
                {{ getActionLabel(actType, lang) }}
              </span>
              <span v-if="getUniqueActions(res).length > 3" class="action-chip action-chip--more">
                {{ interpolate(t('home.moreActions'), { count: getUniqueActions(res).length - 3 }) }}
              </span>
            </div>

            <div class="card-meta-bottom">
              <span v-if="res.meeting_date" class="std-results__badge badge-date">{{ formatDate(res.meeting_date) }}</span>
              <span v-if="res.venue" class="std-results__badge badge-venue truncate-text">{{ res.venue }}</span>
            </div>
            <div class="card-hover-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </router-link>
        
        <div v-if="filteredResolutions.length === 0" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3>{{ t('home.emptyResults') }}</h3>
          <p>{{ t('home.emptyResultsHint') }}</p>
          <div class="empty-state__suggestions">
             <p class="suggestions-label">{{ t('home.trySearching') }}</p>
             <div class="suggestions-chips">
                <button class="std-chip" @click="searchQuery='resolves'">resolves</button>
                <button class="std-chip" @click="searchQuery='approves'">approves</button>
                <button class="std-chip" @click="searchQuery='STEP'">STEP</button>
                <button class="std-chip" @click="searchQuery='ISO 10303'">ISO 10303</button>
             </div>
          </div>
          <button class="std-chip btn-mt" @click="clearAllFilters">{{ t('home.clearAllFilters') }}</button>
        </div>
      </div>
      
      <div v-else class="loading-container">
        <div class="skeleton-grid">
          <div v-for="n in 6" :key="n" class="skeleton-card">
            <div class="skeleton-badge"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-title w-3-4"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-footer">
              <div class="skeleton-badge"></div>
              <div class="skeleton-badge"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="hasMore" class="load-more-container">
        <button @click="loadMore" class="std-chip load-more-btn">
          {{ t('home.loadMore') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResolutions } from '../composables/useResolutions'
import { useMeetings } from '../composables/useMeetings'
import { useI18n } from '../composables/useI18n'
import { interpolate } from '../data/translations'
import { committee } from '../data/committee'
import { getMeetingTypeShort } from '../data/meetingTypes'
import { useCountUp } from '../composables/useCountUp'
import { bodyTypeFromSourceFile } from '../composables/useMeetings'
import { getActionColor, getActionLabel } from '../data/actionTypes'
import { useDateFormat } from '../composables/useDateFormat'
import { highlightText } from '../utils/highlight'

const router = useRouter()
const route = useRoute()

const { resolutions, isLoaded, loadData, search } = useResolutions()
const { meetings, loadData: loadMeetingsData } = useMeetings()
const { t, lang } = useI18n()
const { formatDate } = useDateFormat()

const searchQuery = ref((route.query.q as string) || '')
const selectedYear = ref((route.query.year as string) || '')
const sortOrder = ref((route.query.sort as string) || 'newest')
const selectedActionTypes = ref<Set<string>>(new Set())
const limit = ref(50)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isLegendOpen = ref(false)

// Count UNIQUE resolution identifiers (not per-language rows) so
// the hero stat reflects the actual number of logical resolutions.
const totalResolutions = computed(() => {
  const ids = new Set<string>()
  for (const r of resolutions.value) {
    ids.add(r.identifier || r.id)
  }
  return ids.size
})
const totalMeetings = computed(() => meetings.value.length)
const committeeMembers = computed(() => committee.memberStates)
const committeeEst = computed(() => committee.established)

const animResolutions = useCountUp(totalResolutions, isLoaded, 1500)
const animMeetings = useCountUp(totalMeetings, isLoaded, 1500)
const animMembers = useCountUp(committeeMembers, isLoaded, 1500)
const animEstablished = useCountUp(committeeEst, isLoaded, 1500)

const yearRange = computed(() => {
  if (!resolutions.value.length) return { earliest: '', latest: '' }
  const years = resolutions.value.map(r => parseInt(r.year)).filter(y => !isNaN(y))
  if (!years.length) return { earliest: '', latest: '' }
  return { earliest: String(Math.min(...years)), latest: String(Math.max(...years)) }
})

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatYear(n: number): string {
  return String(n)
}

onMounted(() => {
  loadData()
  loadMeetingsData()
  window.addEventListener('keydown', handleGlobalKeydown)
  
  if (searchQuery.value || selectedYear.value || sortOrder.value !== 'newest') {
    setTimeout(() => {
      scrollToResults()
    }, 100)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(e: KeyboardEvent) {
  if (e.key === '/' && document.activeElement !== searchInputRef.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
    scrollToResults()
  } else if (e.key === 'Escape' && document.activeElement === searchInputRef.value) {
    searchQuery.value = ''
    searchInputRef.value?.blur()
  }
}

function scrollToResults() {
  const resultsEl = document.getElementById('results-section')
  if (resultsEl) {
    const y = resultsEl.getBoundingClientRect().top + window.scrollY - 100
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

const availableYears = computed(() => {
  const years = new Set<string>()
  resolutions.value.forEach(r => {
    if (r.year) years.add(r.year)
  })
  return Array.from(years).sort((a, b) => b.localeCompare(a))
})

const topActionTypes = computed(() => {
  if (!resolutions.value.length) return []
  const counts: Record<string, number> = {}
  resolutions.value.forEach(r => {
    if (r.actions) {
      r.actions.forEach(a => {
        if (a.type) {
          counts[a.type] = (counts[a.type] || 0) + 1
        }
      })
    }
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(e => e[0])
})

const allActionTypes = computed(() => {
  if (!resolutions.value.length) return []
  const types = new Set<string>()
  resolutions.value.forEach(r => {
    if (r.actions) {
      r.actions.forEach(a => {
        if (a.type) types.add(a.type)
      })
    }
  })
  return Array.from(types).sort()
})

function toggleActionType(action: string) {
  const newSet = new Set(selectedActionTypes.value)
  if (newSet.has(action)) {
    newSet.delete(action)
  } else {
    newSet.add(action)
  }
  selectedActionTypes.value = newSet
}

function clearAllFilters() {
  searchQuery.value = ''
  selectedYear.value = ''
  selectedActionTypes.value = new Set()
  sortOrder.value = 'newest'
}

function getUniqueActions(res: any): string[] {
  if (!res.actions) return []
  const types = new Set<string>()
  res.actions.forEach((a: any) => {
    if (a.type) types.add(a.type)
  })
  return Array.from(types)
}

const filteredResolutions = computed(() => {
  let list = resolutions.value
  
  if (selectedYear.value) {
    list = list.filter(r => r.year === selectedYear.value)
  }

  if (selectedActionTypes.value.size > 0) {
    list = list.filter(r => {
      const types = getUniqueActions(r)
      return types.some(t => selectedActionTypes.value.has(t))
    })
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.trim()
    const matched = search(q)
    
    if (matched.length > 0) {
      const matchedIds = new Set(matched.map(r => r.id))
      list = list.filter(r => matchedIds.has(r.id))
    } else {
      const qLower = q.toLowerCase()
      list = list.filter(r => 
        (r.title && r.title.toLowerCase().includes(qLower)) ||
        (r.id && r.id.toLowerCase().includes(qLower)) ||
        (r.subject && r.subject.toLowerCase().includes(qLower)) ||
        (r.venue && r.venue.toLowerCase().includes(qLower))
      )
    }
  }

  // Sort
  return list.slice().sort((a, b) => {
    if (sortOrder.value === 'oldest') {
      return (a.year || '').localeCompare(b.year || '') || a.id.localeCompare(b.id)
    } else if (sortOrder.value === 'most_actions') {
      const aCount = a.actions ? a.actions.length : 0
      const bCount = b.actions ? b.actions.length : 0
      return bCount - aCount || (b.year || '').localeCompare(a.year || '')
    } else {
      // Newest first
      return (b.year || '').localeCompare(a.year || '') || b.id.localeCompare(a.id)
    }
  })
})

// Group EN+FR rows by canonical identifier so each logical resolution
// appears as ONE card on the home page (was showing 2 cards per
// bilingual resolution). The primary row follows the UI language;
// the secondary row is available for hover/tooltip display.
const groupedFilteredResolutions = computed(() => {
  const byKey = new Map<string, any>()
  for (const r of filteredResolutions.value) {
    const key = r.identifier || r.id
    if (!byKey.has(key)) {
      byKey.set(key, { ...r, _languages: [r.language] })
    } else {
      const existing = byKey.get(key)!
      existing._languages.push(r.language)
      // Prefer the UI language as primary
      if (r.language === lang.value && existing.language !== lang.value) {
        const langs = existing._languages
        Object.assign(existing, r, { _languages: langs })
      }
    }
  }
  return Array.from(byKey.values())
})

const paginatedResolutions = computed(() => {
  return groupedFilteredResolutions.value.slice(0, limit.value)
})

const hasMore = computed(() => {
  return limit.value < groupedFilteredResolutions.value.length
})

function loadMore() {
  limit.value += 50
}

watch([searchQuery, selectedYear, sortOrder], () => {
  limit.value = 50
  
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedYear.value) query.year = selectedYear.value
  if (sortOrder.value && sortOrder.value !== 'newest') query.sort = sortOrder.value
  router.replace({ query })
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.hero-section {
  position: relative;
  width: 100%;
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  overflow: hidden;
  background-color: #f8fafc;
  color: #0f172a;
  border-bottom: 1px solid #e2e8f0;
}
.dark .hero-section {
  background-color: #020617;
  color: #fff;
  border-bottom: 1px solid #1e293b;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-bg__mesh {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 15% 50%, rgba(0, 97, 173, 0.08), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(227, 0, 15, 0.06), transparent 25%);
  opacity: 0.8;
}
.dark .hero-bg__mesh {
  background: 
    radial-gradient(circle at 15% 50%, rgba(0, 97, 173, 0.15), transparent 25%),
    radial-gradient(circle at 85% 30%, rgba(227, 0, 15, 0.12), transparent 25%);
}

.hero-bg__grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
}
.dark .hero-bg__grid {
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
  color: #0f172a;
}
.dark .hero-title {
  color: #f8fafc;
}

.text-blue-accent {
  color: #0061ad;
}
.dark .text-blue-accent {
  color: #66a3e0;
}

.hero-subtitle {
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  color: #475569;
  max-width: 48rem;
  line-height: 1.6;
  margin-bottom: 3rem;
  font-weight: 400;
}
.dark .hero-subtitle {
  color: #94a3b8;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 3.5rem;
  width: 100%;
}

@media (min-width: 768px) {
  .hero-stats {
    gap: 4rem;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1;
}
.dark .stat-value {
  color: #fff;
}

.stat-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  font-weight: 600;
}

.hero-search-wrapper {
  width: 100%;
  max-width: 42rem;
  margin-bottom: 3rem;
}

.hero-search-input-box {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.hero-search-icon {
  position: absolute;
  left: 1.25rem;
  color: #64748b;
  pointer-events: none;
}

.hero-search-input {
  width: 100%;
  padding: 1.25rem 6.5rem 1.25rem 3.5rem;
  font-size: 1.125rem;
  border-radius: 9999px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  color: #0f172a;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-appearance: none;
}
.dark .hero-search-input {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.6);
  color: #fff;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.hero-search-input::placeholder {
  color: #64748b;
}
.dark .hero-search-input::placeholder {
  color: #475569;
}

.hero-search-input:focus {
  outline: none;
  border-color: #0061ad;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 97, 173, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
.dark .hero-search-input:focus {
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 0 0 4px rgba(0, 97, 173, 0.2), 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.hero-search-hint {
  position: absolute;
  right: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #64748b;
  pointer-events: none;
}

.hero-search-hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  font-family: var(--font-sans);
  font-weight: 600;
  color: #475569;
}
.dark .hero-search-hint kbd {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 9999px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-btn--primary {
  background-color: #0061ad;
  color: #fff;
  border: 1px solid transparent;
  box-shadow: 0 4px 6px -1px rgba(0, 97, 173, 0.3), 0 2px 4px -1px rgba(0, 97, 173, 0.2);
}

.hero-btn--primary:hover,
.hero-btn--primary:focus-visible {
  background-color: #005090;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 97, 173, 0.4), 0 4px 6px -2px rgba(0, 97, 173, 0.2);
  outline: none;
}
.hero-btn--primary:active {
  transform: translateY(0);
}

.hero-btn--secondary {
  background-color: transparent;
  color: #475569;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.dark .hero-btn--secondary {
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-btn--secondary:hover,
.hero-btn--secondary:focus-visible {
  background-color: rgba(0, 0, 0, 0.05);
  color: #0f172a;
  border-color: rgba(0, 0, 0, 0.25);
  outline: none;
}
.dark .hero-btn--secondary:hover,
.dark .hero-btn--secondary:focus-visible {
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

/* Animations */
.animate-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.15s);
}

.animate-card {
  opacity: 0;
  transform: translateY(15px);
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.03s);
}

.std-filter--elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(226, 232, 240, 0.8);
  margin-top: -2rem;
  position: relative;
  z-index: 20;
}
.dark .std-filter--elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  border-color: rgba(51, 65, 85, 0.8);
}

.std-filter__controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .std-filter__controls {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }
}

.std-filter__field--flex-end {
  margin-left: auto;
  align-self: flex-start;
}

.chip-color-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: var(--dot-bg);
  margin-right: 0.375rem;
}

.sort-dropdown-container {
  position: relative;
  display: flex;
  align-items: center;
}

.sort-dropdown {
  appearance: none;
  background: white;
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-700);
  cursor: pointer;
  transition: all 0.2s;
}
.dark .sort-dropdown {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-slate-200);
}

.sort-dropdown:focus-visible {
  outline: none;
  border-color: var(--color-blue-accent);
  box-shadow: 0 0 0 2px rgba(0, 97, 173, 0.2);
}

.sort-icon {
  position: absolute;
  right: 0.75rem;
  pointer-events: none;
  color: var(--color-slate-500);
}

.active-filters-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px dashed var(--color-slate-200);
  flex-wrap: wrap;
}
.dark .active-filters-bar {
  border-top-color: var(--color-slate-700);
}

.active-filters-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-slate-500);
  text-transform: uppercase;
}

.active-filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.active-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background-color: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-700);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}
.dark .active-filter-chip {
  background-color: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-slate-200);
}
.active-filter-chip:hover {
  background-color: var(--color-slate-200);
}
.dark .active-filter-chip:hover {
  background-color: var(--color-slate-700);
}

.filter-remove {
  font-size: 1rem;
  line-height: 1;
}

.active-filter-clear {
  background: none;
  border: none;
  color: var(--color-blue-accent);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}
.active-filter-clear:hover {
  text-decoration: underline;
}

.std-filter__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--color-slate-100);
}
.dark .std-filter__meta {
  border-top-color: var(--color-slate-800);
}
.std-filter__meta > span:first-child {
  font-size: 0.8125rem;
  color: var(--color-slate-600);
  font-weight: 500;
}
.dark .std-filter__meta > span:first-child {
  color: var(--color-slate-400);
}

.legend-toggle {
  background: var(--color-slate-100);
  border: 1px solid var(--color-slate-200);
  color: var(--color-slate-600);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.legend-toggle:hover {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: white;
}
.dark .legend-toggle {
  background: var(--color-slate-800);
  border-color: var(--color-slate-700);
  color: var(--color-slate-300);
}
.dark .legend-toggle:hover {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: white;
}

.action-legend {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-slate-50);
  border-radius: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.dark .action-legend {
  background: var(--color-slate-800);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-slate-700);
}
.dark .legend-item {
  color: var(--color-slate-300);
}

.legend-color {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.25rem;
  background-color: var(--legend-bg);
}

/* Card refinements */
.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.badge-year {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-slate-500);
  background: var(--color-slate-100);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}
.dark .badge-year {
  background: var(--color-slate-800);
  color: var(--color-slate-400);
}

.type-acclamation {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
  border: 1px solid rgba(99, 102, 241, 0.2) !important;
  font-size: 0.75rem !important;
}
.dark .type-acclamation {
  background: rgba(99, 102, 241, 0.2) !important;
  color: #818cf8 !important;
}

:deep(.search-highlight) {
  background-color: rgba(250, 204, 21, 0.4);
  color: inherit;
  border-radius: 0.125rem;
  padding: 0 0.125rem;
}
.dark :deep(.search-highlight) {
  background-color: rgba(234, 179, 8, 0.3);
}

.snippet-text {
  font-size: 0.875rem;
  color: var(--color-slate-500);
  margin-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  position: relative;
}

.card-actions-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.action-chip {
  background-color: var(--chip-bg);
  color: var(--chip-text);
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.action-chip--more {
  background-color: var(--color-slate-100);
  color: var(--color-slate-600);
  border: 1px solid var(--color-slate-200);
}
.dark .action-chip--more {
  background-color: var(--color-slate-800);
  color: var(--color-slate-300);
  border-color: var(--color-slate-700);
}

.card-meta-bottom {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  flex-wrap: wrap;
}

.badge-venue {
  max-width: 150px;
}

.card-hover-arrow {
  position: absolute;
  bottom: 0;
  right: 0;
  color: var(--color-blue-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.meeting-card:hover .card-hover-arrow {
  opacity: 1;
  transform: translateX(0);
}

.meeting-card {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
}
.meeting-card:hover,
.meeting-card:focus-visible {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border-color: var(--color-blue-accent);
  outline: none;
}
.dark .meeting-card:hover,
.dark .meeting-card:focus-visible {
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
}
.meeting-card__title {
  transition: color 0.3s;
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.125rem !important;
  color: var(--color-slate-900) !important;
  line-height: 1.3;
}
.dark .meeting-card__title {
  color: white !important;
}
.meeting-card:hover .meeting-card__title {
  color: var(--color-blue-accent) !important;
}

.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 1rem;
  border: 1px dashed var(--color-slate-300);
}
.dark .empty-state {
  background: var(--color-slate-900);
  border-color: var(--color-slate-700);
}
.empty-state__icon {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1.5rem;
  color: var(--color-slate-400);
}
.dark .empty-state__icon { color: var(--color-slate-600); }
.empty-state h3 {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-slate-900);
  margin-bottom: 0.75rem;
}
.dark .empty-state h3 { color: white; }
.empty-state p { color: var(--color-slate-500); }

.empty-state__suggestions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-slate-100);
}
.dark .empty-state__suggestions {
  border-top-color: var(--color-slate-800);
}

.suggestions-label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-slate-600) !important;
}

.suggestions-chips {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-mt { margin-top: 2rem; }

.load-more-container {
  margin-top: 3rem;
  text-align: center;
}

.load-more-btn {
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.75rem 2rem;
  background-color: white;
  border: 1px solid var(--color-slate-200);
}
.load-more-btn:hover {
  background-color: var(--color-slate-50);
  color: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
}
.dark .load-more-btn {
  background-color: var(--color-slate-800);
  border-color: var(--color-slate-700);
}
.dark .load-more-btn:hover {
  background-color: var(--color-slate-700);
}

/* Skeleton Loading */
.loading-container {
  padding: 2.5rem 0;
  width: 100%;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}

.skeleton-card {
  padding: 1.25rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--color-slate-200);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.dark .skeleton-card {
  background: rgb(15 23 42 / 0.4);
  border-color: var(--color-slate-800);
}

.skeleton-badge {
  height: 1rem;
  width: 4rem;
  border-radius: 9999px;
}

.skeleton-title {
  height: 1.5rem;
  width: 100%;
}

.w-3-4 { width: 75%; }

.skeleton-text {
  height: 1rem;
  width: 100%;
}

.skeleton-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
}
</style>
