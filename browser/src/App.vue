<template>
  <div class="scroll-progress" :style="{ '--progress': scrollPercent + '%' }"></div>
  <div class="site-brand-bar" aria-hidden="true"></div>
  <header id="nav-header" class="site-header">
    <div class="site-header__inner">
      <router-link :to="r('home')" class="site-header__logo">
        <img src="/assets/oiml-logo.svg" alt="OIML" class="site-header__logo-img site-header__logo-img--theme">
        <span class="site-header__logo-text">
          {{ t('committee.name') }}
          <span class="site-header__logo-subtitle">{{ t('committee.title') }}</span>
        </span>
      </router-link>

      <nav class="site-header__nav">
        <router-link :to="r('home')" class="site-header__nav-link" active-class="active">{{ t('nav.resolutions') }}</router-link>
        <router-link :to="r('meetings')" class="site-header__nav-link" active-class="active">{{ t('nav.meetings') }}</router-link>
        <router-link :to="r('about')" class="site-header__nav-link" active-class="active">{{ t('nav.about') }}</router-link>
      </nav>

      <div class="site-header__actions">
        <!-- Language toggle -->
        <div class="lang-toggle" role="group" :aria-label="t('lang.toggle')">
          <button
            class="lang-toggle__btn"
            :class="{ 'lang-toggle__btn--active': lang === 'en' }"
            @click="switchLang('en')"
            :aria-pressed="lang === 'en'"
          >EN</button>
          <button
            class="lang-toggle__btn"
            :class="{ 'lang-toggle__btn--active': lang === 'fr' }"
            @click="switchLang('fr')"
            :aria-pressed="lang === 'fr'"
          >FR</button>
        </div>

        <!-- External Icons (Desktop) -->
        <div class="site-header__external-links">
          <a :href="committee.links.oiml" target="_blank" rel="noopener noreferrer" class="site-header__icon-btn" :aria-label="t('footer.officialWebsite')" :title="t('footer.officialWebsite')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </a>
        </div>

        <!-- Theme Toggle -->
        <button @click="toggleTheme" type="button" class="site-header__icon-btn" aria-label="Toggle dark mode">
          <svg v-if="!isDark" class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

        <!-- Mobile Menu Toggle -->
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" type="button" class="site-header__icon-btn site-header__icon-btn--mobile" aria-label="Menu">
          <svg v-if="!isMobileMenuOpen" class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          <svg v-else class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-show="isMobileMenuOpen" class="mobile-menu" :class="{ 'mobile-menu--open': isMobileMenuOpen }">
      <router-link :to="r('home')" class="mobile-menu__link" @click="isMobileMenuOpen = false">{{ t('nav.resolutions') }}</router-link>
      <router-link :to="r('meetings')" class="mobile-menu__link" @click="isMobileMenuOpen = false">{{ t('nav.meetings') }}</router-link>
      <router-link :to="r('about')" class="mobile-menu__link" @click="isMobileMenuOpen = false">{{ t('nav.about') }}</router-link>
    </div>
  </header>

  <main class="site-main">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <router-link :to="r('home')" class="site-footer__logo">
            <img src="/assets/oiml-logo.svg" alt="OIML" class="site-footer__logo-img site-footer__logo-img--theme">
            <span class="site-footer__logo-text">{{ t('committee.name') }}</span>
          </router-link>
          <p class="site-footer__tagline">{{ t('committee.title') }}</p>
          <p class="site-footer__scope">
            {{ t('committee.scope') }}
          </p>
        </div>
        
        <div>
          <h4 class="site-footer__heading">{{ t('footer.committee') }}</h4>
          <ul class="site-footer__facts">
            <li><strong>{{ t('footer.secretariat') }}</strong> {{ committee.secretariat }}</li>
            <li><strong>{{ t('footer.established') }}</strong> {{ committee.established }}</li>
            <li><strong>{{ t('footer.memberStates') }}</strong> {{ committee.memberStates }}</li>
            <li><strong>{{ t('footer.correspondingMembers') }}</strong> {{ committee.correspondingMembers }}</li>
          </ul>
        </div>

        <div>
          <h4 class="site-footer__heading">{{ t('footer.explore') }}</h4>
          <ul class="site-footer__links">
            <li><router-link :to="r('home')" class="site-footer__link">{{ t('nav.resolutions') }}</router-link></li>
            <li><router-link :to="r('meetings')" class="site-footer__link">{{ t('nav.meetings') }}</router-link></li>
            <li><router-link :to="r('about')" class="site-footer__link">{{ t('nav.about') }}</router-link></li>
          </ul>
        </div>

        <div>
          <h4 class="site-footer__heading">{{ t('footer.links') }}</h4>
          <ul class="site-footer__links">
            <li><a :href="committee.links.oiml" class="site-footer__link" target="_blank" rel="noopener noreferrer">{{ t('footer.officialWebsite') }}</a></li>
            <li><a :href="committee.links.ciml" class="site-footer__link" target="_blank" rel="noopener noreferrer">{{ t('footer.linksCiml') }}</a></li>
            <li><a :href="committee.links.conference" class="site-footer__link" target="_blank" rel="noopener noreferrer">{{ t('footer.linksConference') }}</a></li>
            <li><a :href="committee.links.bulletin" class="site-footer__link" target="_blank" rel="noopener noreferrer">{{ t('footer.linksBulletin') }}</a></li>
            <li><a :href="committee.links.github" class="site-footer__link" target="_blank" rel="noopener noreferrer">{{ t('footer.github') }}</a></li>
            <li><a :href="committee.links.linkedin" class="site-footer__link" target="_blank" rel="noopener noreferrer">{{ t('footer.linkedin') }}</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <p class="site-footer__copy">
          &copy; {{ new Date().getFullYear() }} {{ committee.name }}
        </p>
      </div>
    </div>
  </footer>

  <!-- Scroll to Top Button -->
  <button 
    class="scroll-to-top" 
    :class="{ 'scroll-to-top--visible': showScrollTop }" 
    @click="scrollToTop" 
    aria-label="Scroll to top"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { committee } from './data/committee'
import { useI18n, setLangInternal } from './composables/useI18n'
import { useLocalizedRoute } from './composables/useLocalizedRoute'

const router = useRouter()
const route = useRoute()
const { t, lang } = useI18n()
const r = useLocalizedRoute()
const isDark = ref(false)
const isMobileMenuOpen = ref(false)
const showScrollTop = ref(false)
const scrollPercent = ref(0)
const THEME_KEY = 'theme'

// Two-way sync between the route's :lang prefix and the i18n state.
// - Route → i18n: when the URL changes (browser back/forward, manual
//   edit, redirect), update currentLang so t() renders the right
//   language.
// - i18n → route: when the user clicks EN/FR in the header, rewrite
//   the URL to swap the prefix. This keeps the URL shareable and the
//   language state in sync.
watch(() => route.params.lang, (newLang) => {
  if (newLang === 'en' || newLang === 'fr') {
    setLangInternal(newLang)
  }
}, { immediate: true })

function switchLang(target: 'en' | 'fr') {
  if (target === lang.value) return
  setLangInternal(target)
  // Rewrite the path: replace the leading /<lang>/ segment.
  const newPath = route.fullPath.replace(/^\/(en|fr)(\/|$)/, `/${target}$2`)
  router.push(newPath)
}

onMounted(() => {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark') {
    isDark.value = true
  } else if (saved === 'light') {
    isDark.value = false
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
  }

  document.documentElement.classList.toggle('dark', isDark.value)

  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('keydown', handleGlobalSearch)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleGlobalSearch)
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
}

function handleScroll() {
  showScrollTop.value = window.scrollY > 500
  
  const docElement = document.documentElement
  const bodyElement = document.body
  const scrollTop = docElement.scrollTop || bodyElement.scrollTop
  const scrollHeight = docElement.scrollHeight || bodyElement.scrollHeight
  const clientHeight = docElement.clientHeight
  const height = scrollHeight - clientHeight
  
  if (height > 0) {
    scrollPercent.value = (scrollTop / height) * 100
  } else {
    scrollPercent.value = 0
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleGlobalSearch(e: KeyboardEvent) {
  // If user presses '/' and isn't already focused on an input
  if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault()
    // Navigate to home page and focus search
    if (router.currentRoute.value.name !== 'home') {
      router.push({ name: 'home', params: { lang: lang.value } }).then(() => {
        // Wait for page to render and input to be available
        setTimeout(() => {
          const input = document.querySelector('.hero-search-input') as HTMLInputElement
          if (input) {
            input.focus()
            const resultsEl = document.getElementById('results-section')
            if (resultsEl) {
              const y = resultsEl.getBoundingClientRect().top + window.scrollY - 100
              window.scrollTo({ top: y, behavior: 'smooth' })
            }
          }
        }, 100)
      })
    } else {
      // Already on home page
      const input = document.querySelector('.hero-search-input') as HTMLInputElement
      if (input) {
        input.focus()
        const resultsEl = document.getElementById('results-section')
        if (resultsEl) {
          const y = resultsEl.getBoundingClientRect().top + window.scrollY - 100
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }
    }
  }
}
</script>

<style>
.scroll-progress {
  position: fixed;
  top: 0; left: 0;
  width: var(--progress);
  height: 3px;
  background: linear-gradient(90deg, #0061ad, var(--color-teal));
  z-index: 100;
  transition: width 0.1s linear;
}

.scroll-to-top {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background-color: var(--color-blue-accent);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 15px -3px rgba(0, 97, 173, 0.4), 0 4px 6px -2px rgba(0, 97, 173, 0.2);
  z-index: 50;
}

.scroll-to-top--visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.scroll-to-top:hover {
  background-color: #005090;
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 97, 173, 0.5), 0 10px 10px -5px rgba(0, 97, 173, 0.2);
}

.scroll-to-top svg {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
