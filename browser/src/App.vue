<template>
  <div class="scroll-progress" :style="{ '--progress': scrollPercent + '%' }"></div>
  <div class="site-brand-bar" aria-hidden="true"></div>
  <header id="nav-header" class="site-header">
    <div class="site-header__inner">
      <router-link :to="{ name: 'home' }" class="site-header__logo">
        <img src="/assets/oiml-logo.svg" alt="OIML" class="site-header__logo-img site-header__logo-img--theme">
        <span class="site-header__logo-text">
          {{ committee.name }}
          <span class="site-header__logo-subtitle">{{ committee.title }}</span>
        </span>
      </router-link>

      <nav class="site-header__nav">
        <router-link :to="{ name: 'home' }" class="site-header__nav-link" active-class="active">Resolutions</router-link>
        <router-link :to="{ name: 'meetings' }" class="site-header__nav-link" active-class="active">Meetings</router-link>
        <router-link :to="{ name: 'about' }" class="site-header__nav-link" active-class="active">About</router-link>
      </nav>

      <div class="site-header__actions">
        <!-- External Icons (Desktop) -->
        <div class="site-header__external-links">
          <a :href="committee.links.linkedin" target="_blank" rel="noopener noreferrer" class="site-header__icon-btn" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
          </a>
          <a :href="committee.links.github" target="_blank" rel="noopener noreferrer" class="site-header__icon-btn" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          <a :href="committee.links.committeeSite" target="_blank" rel="noopener noreferrer" class="site-header__icon-btn" aria-label="OIML website">
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
      <router-link :to="{ name: 'home' }" class="mobile-menu__link" @click="isMobileMenuOpen = false">Resolutions</router-link>
      <router-link :to="{ name: 'meetings' }" class="mobile-menu__link" @click="isMobileMenuOpen = false">Meetings</router-link>
      <router-link :to="{ name: 'about' }" class="mobile-menu__link" @click="isMobileMenuOpen = false">About</router-link>
      
      <span class="mobile-menu__section-title">External Links</span>
      <a :href="committee.links.committeeSite" target="_blank" rel="noopener noreferrer" class="mobile-menu__link">OIML Members</a>
      <a :href="committee.links.linkedin" target="_blank" rel="noopener noreferrer" class="mobile-menu__link">LinkedIn</a>
      <a :href="committee.links.github" target="_blank" rel="noopener noreferrer" class="mobile-menu__link">GitHub</a>
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
          <router-link :to="{ name: 'home' }" class="site-footer__logo">
            <img src="/assets/oiml-logo.svg" alt="OIML" class="site-footer__logo-img site-footer__logo-img--theme">
            <span class="site-footer__logo-text">{{ committee.name }}</span>
          </router-link>
          <p class="site-footer__tagline">{{ committee.title }}</p>
          <p class="site-footer__scope">
            {{ committee.scope }}
          </p>
        </div>
        
        <div>
          <h4 class="site-footer__heading">Committee</h4>
          <ul class="site-footer__facts">
            <li><strong>Secretariat:</strong> {{ committee.secretariat }}</li>
            <li><strong>Established:</strong> {{ committee.established }}</li>
            <li><strong>Member States:</strong> {{ committee.memberStates }}</li>
            <li><strong>Corresponding Members:</strong> {{ committee.correspondingMembers }}</li>
          </ul>
        </div>

        <div>
          <h4 class="site-footer__heading">Explore</h4>
          <ul class="site-footer__links">
            <li><router-link :to="{ name: 'home' }" class="site-footer__link">Resolutions</router-link></li>
            <li><router-link :to="{ name: 'meetings' }" class="site-footer__link">Meetings</router-link></li>
            <li><router-link :to="{ name: 'about' }" class="site-footer__link">About</router-link></li>
          </ul>
        </div>
        
        <div>
          <h4 class="site-footer__heading">Links</h4>
          <ul class="site-footer__links">
            <li><a :href="committee.links.oiml" class="site-footer__link" target="_blank" rel="noopener noreferrer">OIML.org</a></li>
            <li><a :href="committee.links.ciml" class="site-footer__link" target="_blank" rel="noopener noreferrer">CIML Meetings</a></li>
            <li><a :href="committee.links.conference" class="site-footer__link" target="_blank" rel="noopener noreferrer">Conferences</a></li>
            <li><a :href="committee.links.bulletin" class="site-footer__link" target="_blank" rel="noopener noreferrer">OIML Bulletin</a></li>
            <li><a :href="committee.links.github" class="site-footer__link" target="_blank" rel="noopener noreferrer">GitHub</a></li>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { committee } from './data/committee'

const router = useRouter()
const isDark = ref(false)
const isMobileMenuOpen = ref(false)
const showScrollTop = ref(false)
const scrollPercent = ref(0)
const THEME_KEY = 'theme'

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
      router.push({ name: 'home' }).then(() => {
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
