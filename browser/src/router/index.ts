import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/resolution/:id',
    name: 'resolution-detail',
    component: () => import('../views/ResolutionDetail.vue')
  },
  {
    path: '/meetings',
    name: 'meetings',
    component: () => import('../views/Meetings.vue')
  },
  // Canonical meeting route: /meetings/<slug> where slug is the URN-
  // derived identifier (e.g. "ciml-15", "conference-13"). Legacy URLs
  // that used source PDF filenames (/meetings/15CIML-1976-FR) are
  // detected by MeetingDetail.vue and replaced with the canonical URL.
  {
    path: '/meetings/:meetingSlug',
    name: 'meeting-detail',
    component: () => import('../views/MeetingDetail.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/About.vue')
  }
]
