<template>
  <div class="res-page">
    <div v-if="!isLoaded" class="loading-container">
      <div class="skeleton-header">
        <div class="skeleton-link"></div>
        <div class="skeleton-badges">
          <div class="skeleton-badge"></div>
          <div class="skeleton-badge w-24"></div>
        </div>
        <div class="skeleton-title-large"></div>
        <div class="skeleton-subtitle"></div>
      </div>
      <div class="skeleton-grid mt-8">
        <div v-for="n in 3" :key="n" class="skeleton-card">
          <div class="skeleton-badge"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    </div>
    <div v-else-if="!meeting" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-state__icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h3>Meeting not found</h3>
      <p>The meeting you are looking for does not exist.</p>
      <router-link :to="{ name: 'meetings' }" class="std-chip btn-mt link-no-ul">Back to Meetings</router-link>
    </div>
    <template v-else>
      <header class="res-page__header header-mt animate-up" style="--nth: 1">
        <router-link :to="{ name: 'meetings' }" class="back-link group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="back-link__icon"><path d="m15 18-6-6 6-6"/></svg>
          Back to Meetings
        </router-link>
        
        <div class="header-badges">
          <span class="std-results__badge badge-year">{{ meeting.year }}</span>
          <span v-if="meeting.meeting_date" class="std-results__badge">{{ formatDate(meeting.meeting_date) }}</span>
        </div>
        
        <h1 class="meeting-detail__title">
          <span v-if="venueFlag" class="meeting-detail__flag">{{ venueFlag }}</span>
          {{ meeting.venue || 'Virtual Meeting' }}
        </h1>
        <p class="res-page__subtitle subtitle-max-w">{{ meeting.source_title }}</p>

        <!-- Meeting URN -->
        <div v-if="meetingUrn" class="meeting-urn-bar">
          <span class="meeting-urn-label">Meeting URN</span>
          <code class="meeting-urn-value">{{ meetingUrn }}</code>
          <button 
            @click="copyUrn(meetingUrn)" 
            class="meeting-urn-copy"
            :aria-label="meetingCopied ? 'Copied' : 'Copy URN'"
          >
            <svg v-if="!meetingCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
        </div>
      </header>

      <div class="section-meta animate-up" style="--nth: 2">
        <h2 class="section-meta-title">{{ meeting.resolution_count }} Resolutions</h2>
      </div>

      <div class="std-results">
        <router-link 
          v-for="(res, index) in meetingResolutions" 
          :key="res.id" 
          :to="{ name: 'resolution-detail', params: { id: res.id } }"
          class="std-results__card meeting-card animate-card"
          :style="`--nth: ${index}`"
        >
          <div class="std-results__name">
            <span v-if="res.is_acclamation" class="std-results__type type-acclamation">Acclamation</span>
            <template v-else>
              <span>{{ res.id }}</span>
              <span class="std-results__type">Plenary</span>
            </template>
          </div>
          <div class="std-results__title meeting-card__title">{{ res.is_acclamation ? 'Acclamation' : (res.title || 'Resolution ' + res.id) }}</div>
          <div v-if="res.snippet" class="std-results__snippet snippet-text">{{ res.snippet }}</div>
          
          <div class="card-footer">
            <span v-if="res.subject" class="std-results__badge badge-subject truncate-text">{{ res.subject }}</span>
            <div class="card-hover-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMeetings } from '../composables/useMeetings'
import { venueToFlag } from '../data/countryFlags'
import { formatDate } from '../utils/format'
import { buildMeetingUrn } from '../utils/urn'
import { useClipboard } from '../composables/useClipboard'

const route = useRoute()
const { getMeeting, getMeetingResolutions, isLoaded, loadData } = useMeetings()
const { copied: meetingCopied, copy: copyUrn } = useClipboard()

const sourceFile = computed(() => route.params.sourceFile as string)

onMounted(() => {
  loadData()
})

const meeting = computed(() => {
  return isLoaded.value ? getMeeting(sourceFile.value) : null
})

const meetingUrn = computed(() => {
  if (!meeting.value) return ''
  return buildMeetingUrn(sourceFile.value)
})

const venueFlag = computed(() => venueToFlag(meeting.value?.venue))

const meetingResolutions = computed(() => {
  return isLoaded.value ? getMeetingResolutions(sourceFile.value) : []
})
</script>

<style scoped>
/* Animations */
.animate-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.1s);
}

.animate-card {
  opacity: 0;
  transform: translateY(15px);
  animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.05s);
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  background: white;
  border-radius: 1rem;
  border: 1px dashed var(--color-slate-200);
  margin-top: 2rem;
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
.empty-state p { color: var(--color-slate-500); }
.btn-mt { margin-top: 1rem; }
.link-no-ul { display: inline-block; text-decoration: none; }

.header-mt { margin-top: 1rem; }

.header-badges {
  margin-bottom: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge-year {
  background: var(--color-slate-100);
  color: var(--color-slate-700);
}
.dark .badge-year {
  background: var(--color-slate-800);
  color: var(--color-slate-300);
}

.subtitle-max-w { max-width: 48rem; }

.section-meta {
  border-bottom: 1px solid var(--color-slate-200);
  padding-bottom: 1rem;
  margin-bottom: 2rem;
}
.dark .section-meta {
  border-bottom-color: var(--color-slate-800);
}

.section-meta-title {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-slate-800);
}
.dark .section-meta-title { color: var(--color-slate-200); }

.meeting-card {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s;
}
.meeting-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border-color: var(--color-blue-accent);
}
.dark .meeting-card:hover {
  box-shadow: 0 12px 20px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
}
.meeting-card__title {
  transition: color 0.3s;
  font-weight: 600;
  font-size: 1rem !important;
  color: var(--color-slate-900) !important;
}
.dark .meeting-card__title {
  color: white !important;
}
.meeting-card:hover .meeting-card__title {
  color: var(--color-blue-accent) !important;
}

.type-acclamation {
  background: #6366f1 !important;
  color: #fff !important;
  font-size: 0.75rem !important;
}

.snippet-text {
  font-size: 0.875rem;
  color: var(--color-slate-500);
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  gap: 0.375rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 1rem;
}

.badge-subject {
  max-width: 100%;
  background: var(--color-slate-100);
  color: var(--color-slate-700);
}
.dark .badge-subject {
  background: var(--color-slate-800);
  color: var(--color-slate-300);
}

.card-hover-arrow {
  margin-left: auto;
  color: var(--color-blue-accent);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.meeting-card:hover .card-hover-arrow {
  opacity: 1;
  transform: translateX(0);
}

.truncate-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meeting-detail__title {
  font-family: var(--font-serif);
  color: var(--color-slate-900);
  margin-bottom: 1rem;
  line-height: 1.1;
  font-size: 1.875rem;
}
.meeting-detail__flag {
  margin-right: 0.5rem;
  font-size: 1em;
  vertical-align: middle;
}
@media (min-width: 768px) {
  .meeting-detail__title { font-size: 2.25rem; }
}
@media (min-width: 1024px) {
  .meeting-detail__title { font-size: 3rem; }
}
.dark .meeting-detail__title { color: white; }

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-slate-500);
  text-decoration: none;
  margin-bottom: 1.5rem;
  width: max-content;
  transition: color 0.2s;
}
.back-link:hover {
  color: var(--color-slate-900);
}
.dark .back-link:hover {
  color: white;
}
.back-link__icon {
  transition: transform 0.2s;
}
.back-link:hover .back-link__icon {
  transform: translateX(-4px);
}

/* Skeleton Loading */
.loading-container {
  padding-top: 2.5rem;
  width: 100%;
}

.skeleton-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-link {
  width: 8rem;
  height: 1rem;
}

.skeleton-badges {
  display: flex;
  gap: 0.5rem;
}

.skeleton-title-large {
  width: 60%;
  height: 3rem;
  margin-top: 0.5rem;
}

.skeleton-subtitle {
  width: 80%;
  height: 1.5rem;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.75rem;
}
.mt-8 { margin-top: 2rem; }

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
.w-24 { width: 6rem; }

.skeleton-title {
  height: 1.5rem;
  width: 80%;
}

.skeleton-text {
  height: 1rem;
  width: 100%;
  margin-top: auto;
}

.meeting-urn-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-slate-50);
  border: 1px solid var(--color-slate-200);
  border-radius: 0.5rem;
  margin-top: 1.5rem;
}
.dark .meeting-urn-bar {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
}
.meeting-urn-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-slate-400);
  flex-shrink: 0;
}
.meeting-urn-value {
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 0.8125rem;
  color: var(--color-slate-700);
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
}
.dark .meeting-urn-value {
  color: var(--color-slate-300);
}
.meeting-urn-copy {
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
.meeting-urn-copy:hover,
.meeting-urn-copy:focus-visible {
  background: var(--color-blue-accent);
  border-color: var(--color-blue-accent);
  color: white;
  outline: none;
}
</style>