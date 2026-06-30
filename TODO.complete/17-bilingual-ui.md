# 17 — Item 6: bilingual UI polish (EN / FR / both toggle)

## Symptom
"In a resolution, if it has English + French versions, indicate both
exist (can switch between en, fr, or en+fr together)."

## Current state
`ResolutionDetail.vue` already has a 3-way toggle
(`activeLang: 'en' | 'fr' | 'both'`) — see lines around 402. The
toggle:
- Looks up sibling rows by canonical identifier across `source_file`s
- Renders the primary resolution in `activeLang`
- In `'both'` mode, renders the FR half as a side-by-side secondary
  block

## Gaps
1. **Toggle only shows when both EN and FR records exist.** The
   indicator badge ("EN+FR available") isn't rendered — users have
   no signal that another language exists.
2. **`'both'` mode** only shows FR side-by-side, not EN+FR
   interleaved. For formal OIML resolutions, interleaved is more
   useful (each action paired with its translation).
3. **Language choice isn't URL-driven.** A `/resolution/CIML-2025-44?lang=fr`
   URL should deep-link to the FR view; current code uses
   `localStorage` only.
4. **`activeLang` resets on every navigation.** Should persist
   across route changes within a session.

## Proposed design
1. **Badge on cards**: When a resolution has 2+ localizations, the
   Home/MeetingDetail card shows a "EN+FR" pill next to the
   identifier.
2. **URL query param**: `?lang=en|fr|both` reflects the active
   language. Updates on toggle click; read on mount.
3. **`'both'` mode** renders each action/consideration as a two-row
   block (EN on top, FR below, separated by a hairline).
4. **Persisted preference**: `localStorage['oiml-res-lang']` saves
   the last choice; default is the UI language from `useI18n`.

## Files touched
- `browser/src/views/ResolutionDetail.vue` — toggle + URL sync +
  both-mode rendering
- `browser/src/router/index.ts` — accept `?lang=` query
- `browser/src/data/translations.yaml` — add
  `resolution.langBadge.{en,fr,both}` labels
- `browser/src/composables/useResolutionLanguage.ts` — new
  composable wrapping the active-lang state + URL sync

## Verification
- Open `/resolution/CIML-2025-44` → defaults to UI lang.
- Click "FR" → URL becomes `?lang=fr`, content swaps.
- Click "EN / FR" → URL becomes `?lang=both`, action cards split.
- Direct-link to `?lang=fr` → opens in FR view.
- Reload page → preference persists.
