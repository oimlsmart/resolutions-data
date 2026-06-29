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
  {
    path: '/meetings/:sourceFile',
    name: 'meeting-detail',
    component: () => import('../views/MeetingDetail.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/About.vue')
  }
]
