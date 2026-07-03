<template>
  <div class="res-page">
    <header class="res-page__header">
      <h1 class="animate-up" style="--nth: 1">{{ t('meetings.title') }}</h1>
      <p class="res-page__subtitle animate-up" style="--nth: 2">{{ t('meetings.subtitle') }}</p>
    </header>

    <div class="std-filter animate-up" style="--nth: 3">
      <div class="std-filter__field std-filter__field--body">
        <span class="std-filter__label">{{ t('meetings.body') }}</span>
        <div class="std-filter__chips">
          <button
            class="std-chip"
            :class="{ 'is-active': selectedBodyType === '' }"
            @click="selectedBodyType = ''"
          >All</button>
          <button
            class="std-chip"
            :class="{ 'is-active': selectedBodyType === 'ciml' }"
            @click="selectedBodyType = 'ciml'"
          >{{ t('meetings.bodyCiml') }}</button>
          <button
            class="std-chip"
            :class="{ 'is-active': selectedBodyType === 'conference' }"
            @click="selectedBodyType = 'conference'"
          >{{ t('meetings.bodyConf') }}</button>
        </div>
      </div>
      <div class="std-filter__search-wrap">
        <svg class="std-filter__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input 
          type="search" 
          v-model="searchQuery" 
          class="std-filter__search" 
          :placeholder="t('meetings.searchPlaceholder')" 
          autocomplete="off" 
          spellcheck="false" 
          aria-label="Search meetings" 
        />
      </div>
      <div class="std-filter__controls">
        <div class="std-filter__field">
          <span class="std-filter__label">{{ t('meetings.year') }}</span>
          <div class="std-filter__chips">
            <button 
              class="std-chip" 
              :class="{ 'is-active': selectedYear === '' }"
              @click="selectedYear = ''"
            >All</button>
            <button 
              v-for="year in availableYears" 
              :key="year"
              class="std-chip"
              :class="{ 'is-active': selectedYear === year }"
              @click="selectedYear = year"
            >{{ year }}</button>
          </div>
        </div>
        <div class="std-filter__field" v-if="availableCountries.length > 1">
          <span class="std-filter__label">{{ t('meetings.country') }}</span>
          <div class="std-filter__chips">
            <button
              class="std-chip"
              :class="{ 'is-active': selectedCountry === '' }"
              @click="selectedCountry = ''"
            >{{ t('common.all') }}</button>
            <button
              v-for="country in availableCountries"
              :key="country.code"
              class="std-chip country-chip"
              :class="{ 'is-active': selectedCountry === country.code }"
              @click="selectedCountry = country.code"
            >
              <span class="country-chip__flag">{{ country.flag }}</span>
              {{ country.name }}
            </button>
          </div>
        </div>
      </div>
      <div class="std-filter__meta">
        <span>{{ t('meetings.count', { count: filteredMeetings.length }) }}</span>
      </div>
    </div>

    <div class="timeline-section animate-up" style="--nth: 4" v-if="isLoaded">
      <!-- Legend -->
      <div class="timeline-legend">
        <div class="legend-item legend-item--size">
          <span class="legend-size-small"></span>
          <span class="legend-size-medium"></span>
          <span class="legend-size-large"></span>
          <span class="legend-size-label">{{ t('meetings.legendSize') }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-flag-example">🇯🇵</span>
          <span>{{ t('meetings.legendHost') }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-flag-example">🌐</span>
          <span>{{ t('meetings.legendVirtual') }}</span>
        </div>
      </div>

      <div v-if="filteredMeetings.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <h3>{{ t('meetings.empty') }}</h3>
        <p>{{ t('meetings.emptyHint') }}</p>
        <button class="std-chip btn-mt" @click="searchQuery=''; selectedYear=''; selectedCountry=''">{{ t('meetings.clearFilters') }}</button>
      </div>
      
      <div v-else class="body-type-list">
        <!-- CIML Meetings -->
        <section v-if="cimlMeetings.length" class="body-section body-section--ciml">
          <header class="body-section__header">
            <h2 class="body-section__title">
              <span class="body-section__badge body-section__badge--ciml">CIML</span>
              {{ t('meetings.bodyCiml') }}
            </h2>
            <span class="body-section__count">{{ cimlMeetings.reduce((s, d) => s + d.meetings.length, 0) }}</span>
          </header>
          <div class="decade-list">
            <section v-for="decade in cimlMeetings" :key="`ciml-${decade.label}`" class="decade-block">
              <div class="decade-header">
                <h3 class="decade-title">{{ decade.label }}</h3>
                <span class="decade-summary">{{ decade.meetings.length }} {{ t('meetings.title').toLowerCase() }} &middot; {{ decade.resCount }} {{ t('home.resolutionsLabel').toLowerCase() }}</span>
              </div>
              <div class="timeline-track">
                <router-link
                  v-for="m in decade.meetings"
                  :key="m.meeting_slug"
                  :to="r('meeting-detail', { meetingSlug: m.meeting_slug })"
                  class="timeline-entry timeline-entry--ciml"
                >
                  <span class="timeline-node timeline-node--ciml"
                    :class="{
                      'node--small': m.resolution_count <= 5,
                      'node--medium': m.resolution_count > 5 && m.resolution_count <= 15,
                      'node--large': m.resolution_count > 15
                    }"
                  ></span>
                  <span class="timeline-year">{{ m.year }}</span>
                  <span class="timeline-venue">
                    <span v-if="countryCodeToFlag(m.country_code)" class="timeline-flag">{{ countryCodeToFlag(m.country_code) }}</span>
                    {{ venueForLangFn(m.city, m.country_code) || venueForLang(m.venue, lang) || t('meetings.virtual') }}
                  </span>
                  <span class="timeline-meta">
                    <span v-if="m.meeting_date" class="meta-date">{{ formatDateShort(m.meeting_date) }}</span>
                    <span v-if="m.meeting_date" class="meta-sep">&middot;</span>
                    <span class="meta-count">{{ interpolate(t('meetings.resolutionsCount'), { count: m.resolution_count }) }}</span>
                  </span>
                  <span class="timeline-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </router-link>
              </div>
            </section>
          </div>
        </section>

        <!-- OIML Conference -->
        <section v-if="conferenceMeetings.length" class="body-section body-section--conference">
          <header class="body-section__header">
            <h2 class="body-section__title">
              <span class="body-section__badge body-section__badge--conference">CONF</span>
              {{ t('meetings.bodyConf') }}
            </h2>
            <span class="body-section__count">{{ conferenceMeetings.reduce((s, d) => s + d.meetings.length, 0) }}</span>
          </header>
          <div class="decade-list">
            <section v-for="decade in conferenceMeetings" :key="`conf-${decade.label}`" class="decade-block">
              <div class="decade-header">
                <h3 class="decade-title">{{ decade.label }}</h3>
                <span class="decade-summary">{{ decade.meetings.length }} {{ t('meetings.title').toLowerCase() }} &middot; {{ decade.resCount }} {{ t('home.resolutionsLabel').toLowerCase() }}</span>
              </div>
              <div class="timeline-track">
                <router-link
                  v-for="m in decade.meetings"
                  :key="m.meeting_slug"
                  :to="r('meeting-detail', { meetingSlug: m.meeting_slug })"
                  class="timeline-entry timeline-entry--conference"
                >
                  <span class="timeline-node timeline-node--conference"
                    :class="{
                      'node--small': m.resolution_count <= 5,
                      'node--medium': m.resolution_count > 5 && m.resolution_count <= 15,
                      'node--large': m.resolution_count > 15
                    }"
                  ></span>
                  <span class="timeline-year">{{ m.year }}</span>
                  <span class="timeline-venue">
                    <span v-if="countryCodeToFlag(m.country_code)" class="timeline-flag">{{ countryCodeToFlag(m.country_code) }}</span>
                    {{ venueForLangFn(m.city, m.country_code) || venueForLang(m.venue, lang) || t('meetings.virtual') }}
                  </span>
                  <span class="timeline-meta">
                    <span v-if="m.meeting_date" class="meta-date">{{ formatDateShort(m.meeting_date) }}</span>
                    <span v-if="m.meeting_date" class="meta-sep">&middot;</span>
                    <span class="meta-count">{{ interpolate(t('meetings.resolutionsCount'), { count: m.resolution_count }) }}</span>
                  </span>
                  <span class="timeline-arrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </router-link>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
    
    <div v-else class="loading-container">
      <div class="skeleton-grid">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="skeleton-badge"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-footer">
            <div class="skeleton-badge"></div>
            <div class="skeleton-badge"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMeetings, groupMeetingsByDecade } from '../composables/useMeetings'
import { countryCodeToFlag } from '../data/countryFlags'
import { venueForLang, countryName } from '../data/venues'
import { useI18n } from '../composables/useI18n'
import { interpolate } from '../data/translations'
import { formatDateShort } from '../utils/format'
import { useLocalizedRoute } from '../composables/useLocalizedRoute'

const router = useRouter()
const route = useRoute()

const { meetings, isLoaded, loadData } = useMeetings()
const r = useLocalizedRoute()

const searchQuery = ref((route.query.q as string) || '')
const selectedYear = ref((route.query.year as string) || '')
const selectedCountry = ref((route.query.country as string) || '')
const selectedBodyType = ref((route.query.body as string) || '')
const { t, lang } = useI18n()
const venueForLangFn = (city: string, code: string) => venueForLang(city, code, lang.value)

onMounted(() => {
  loadData()
})

const availableYears = computed(() => {
  const years = new Set<string>()
  meetings.value.forEach(m => {
    if (m.year) years.add(m.year)
  })
  return Array.from(years).sort((a, b) => b.localeCompare(a))
})

const availableCountries = computed(() => {
  const countries = new Map<string, { code: string; name: string; flag: string }>()
  meetings.value.forEach(m => {
    const venue = m.venue || ''
    const isVirtual = m.virtual || venue.toLowerCase().includes('virtual')
    if (isVirtual) {
      if (!countries.has('virtual')) {
        countries.set('virtual', { code: 'virtual', name: t.value('meetings.legendVirtual'), flag: '\u{1F310}' })
      }
    } else {
      const code = m.country_code || ''
      if (code && !countries.has(code)) {
        countries.set(code, { code, name: countryName(code, lang.value), flag: countryCodeToFlag(code) })
      }
    }
  })
  return Array.from(countries.values()).sort((a, b) => {
    if (a.code === 'virtual') return 1
    if (b.code === 'virtual') return -1
    return a.name.localeCompare(b.name)
  })
})

const filteredMeetings = computed(() => {
  let list = meetings.value

  if (selectedBodyType.value) {
    list = list.filter(m => m.body_type === selectedBodyType.value)
  }

  if (selectedYear.value) {
    list = list.filter(m => m.year === selectedYear.value)
  }

  if (selectedCountry.value) {
    if (selectedCountry.value === 'virtual') {
      list = list.filter(m => m.virtual || (m.venue && m.venue.toLowerCase().includes('virtual')))
    } else {
      list = list.filter(m => (m.country_code || '') === selectedCountry.value)
    }
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(m => 
      (m.venue && m.venue.toLowerCase().includes(q)) ||
      (m.year && m.year.toLowerCase().includes(q)) ||
      (m.source_title && m.source_title.toLowerCase().includes(q))
    )
  }

  return list
})

const cimlMeetings = computed(() =>
  groupMeetingsByDecade(filteredMeetings.value.filter(m => m.body_type === 'ciml'))
)
const conferenceMeetings = computed(() =>
  groupMeetingsByDecade(filteredMeetings.value.filter(m => m.body_type === 'conference'))
)


watch([searchQuery, selectedYear, selectedCountry], () => {
  const query: Record<string, string> = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (selectedYear.value) query.year = selectedYear.value
  if (selectedCountry.value) query.country = selectedCountry.value
  router.replace({ query })
})
</script>

<style scoped>
.animate-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.1s);
}

.timeline-section {
  margin-top: 1.5rem;
}

.timeline-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.25rem;
  padding: 0.625rem 1rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.375rem;
  margin-bottom: 1.25rem;
  font-size: 0.75rem;
  color: var(--color-slate-600);
}
.dark .timeline-legend {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
  color: var(--color-slate-400);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.legend-flag-example {
  font-size: 1rem;
  line-height: 1;
}
.legend-item--size { gap: 0.25rem; }
.legend-size-small,
.legend-size-medium,
.legend-size-large {
  display: inline-block;
  border-radius: 50%;
  background: var(--color-slate-400);
}
.legend-size-small  { width: 0.3rem;  height: 0.3rem; }
.legend-size-medium { width: 0.5rem;  height: 0.5rem; }
.legend-size-large  { width: 0.625rem; height: 0.625rem; }
.legend-size-label {
  margin-left: 0.25rem;
  font-style: italic;
}

.decade-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.decade-header {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.375rem;
  border-bottom: 1px solid var(--color-slate-200);
}
.dark .decade-header {
  border-bottom-color: var(--color-slate-800);
}
.decade-title {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-slate-900);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.dark .decade-title { color: white; }
.decade-summary {
  font-size: 0.75rem;
  color: var(--color-slate-500);
  font-weight: 500;
}
.dark .decade-summary { color: var(--color-slate-400); }

.timeline-track {
  position: relative;
  display: flex;
  flex-direction: column;
}

.timeline-entry {
  display: grid;
  grid-template-columns: 1.25rem 2.75rem 1fr auto auto;
  align-items: center;
  gap: 0.625rem;
  padding: 0.375rem 0.75rem;
  text-decoration: none;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease;
  position: relative;
}

.timeline-entry::before {
  content: '';
  position: absolute;
  left: calc(1.375rem - 0.5px);
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-slate-200);
  z-index: 0;
}
.dark .timeline-entry::before {
  background: var(--color-slate-700);
}
.timeline-entry:first-child::before { top: 50%; }
.timeline-entry:last-child::before  { bottom: 50%; }

.timeline-entry:hover,
.timeline-entry:focus-visible {
  background: var(--color-slate-50);
  outline: none;
}
.dark .timeline-entry:hover,
.dark .timeline-entry:focus-visible {
  background: rgba(30, 41, 59, 0.5);
}

.timeline-node {
  justify-self: center;
  display: block;
  border-radius: 50%;
  background: var(--color-blue-accent);
  border: 2px solid var(--bg-surface, white);
  box-shadow: 0 0 0 1px var(--color-blue-accent);
  z-index: 1;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dark .timeline-node {
  border-color: var(--color-slate-900);
}
.node--small  { width: 0.375rem; height: 0.375rem; }
.node--medium { width: 0.5rem;   height: 0.5rem; }
.node--large  { width: 0.625rem; height: 0.625rem; }

.timeline-entry:hover .timeline-node,
.timeline-entry:focus-visible .timeline-node {
  transform: scale(1.35);
}

.timeline-year {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-slate-900);
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}
.dark .timeline-year { color: white; }

.timeline-venue {
  font-size: 0.875rem;
  color: var(--color-slate-600);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.dark .timeline-venue { color: var(--color-slate-300); }

.timeline-flag {
  margin-right: 0.25rem;
  font-size: 1.0625rem;
  line-height: 1;
  vertical-align: -1px;
}

.country-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.country-chip__flag {
  font-size: 0.9375rem;
  line-height: 1;
}

.timeline-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-slate-500);
  white-space: nowrap;
}
.dark .timeline-meta { color: var(--color-slate-400); }

.meta-sep {
  color: var(--color-slate-300);
}
.dark .meta-sep { color: var(--color-slate-600); }

.meta-count {
  font-weight: 600;
  color: var(--color-slate-600);
}
.dark .meta-count { color: var(--color-slate-300); }

.timeline-arrow {
  color: var(--color-slate-300);
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.timeline-entry:hover .timeline-arrow,
.timeline-entry:focus-visible .timeline-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--color-blue-accent);
}

@media (max-width: 640px) {
  .timeline-entry {
    grid-template-columns: 1rem 2.5rem 1fr auto;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
  }
  .timeline-entry::before {
    left: calc(1rem - 0.5px);
  }
  .timeline-year { font-size: 0.875rem; }
  .timeline-venue { font-size: 0.8125rem; }
  .timeline-flag { font-size: 0.9375rem; }
  .meta-date, .meta-sep { display: none; }
  .timeline-arrow { display: none; }
  .timeline-legend {
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
  }
  .legend-item--size { display: none; }
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
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
.empty-state p { color: var(--color-slate-500); }
.btn-mt { margin-top: 1rem; }

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
  padding: 1rem;
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
  width: 5rem;
  border-radius: 9999px;
}
.skeleton-title {
  height: 1.75rem;
  width: 80%;
}
.skeleton-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
}
</style>