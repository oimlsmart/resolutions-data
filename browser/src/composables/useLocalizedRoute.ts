// Helper to build router-link `:to` targets that auto-fill the language
// prefix required by the `/:lang(en|fr)` parent route. Use this instead
// of `{ name: 'home' }` etc. so call sites don't have to know about the
// current language.
//
//   import { useLocalizedRoute } from '@/composables/useLocalizedRoute'
//   const r = useLocalizedRoute()
//   <router-link :to="r('meeting-detail', { meetingSlug: 'ciml-44' })">
//
// The returned closure picks up `lang.value` reactively from useI18n,
// so the URL updates when the user toggles language.

import { useI18n } from './useI18n'

type RouteName =
  | 'home'
  | 'resolution-detail'
  | 'meetings'
  | 'meeting-detail'
  | 'about'

export function useLocalizedRoute() {
  const { lang } = useI18n()
  return (
    name: RouteName,
    params: Record<string, string> = {},
  ) => ({
    name,
    params: { lang: lang.value, ...params },
  })
}
