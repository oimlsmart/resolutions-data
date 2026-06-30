# 18 — Item 8: action vocabulary i18n

## Symptom
"action vocab like 'thanks', 'resolve' also need to be i18n."

## Current state
- `action-types.yaml` has 31 entries, each with `{bg, text}` colors.
- Browser renders the action type verbatim:
  `formatActionType('thanks')` → `'thanks'`.
- No FR translations.

## Proposed shape
Extend each entry in `action-types.yaml`:

```yaml
actionTypeColors:
  _default:
    bg: '#64748b'
    text: '#ffffff'
    labels:
      eng: Other
      fra: Autre
  accepts:
    bg: '#16a34a'
    text: '#ffffff'
    labels:
      eng: Accepts
      fra: Accepte
  acknowledges:
    bg: '#64748b'
    text: '#ffffff'
    labels:
      eng: Acknowledges
      fra: Prend acte
  ...
```

## Browser changes

1. **`actionTypes.ts`**: extend the typed config:
   ```ts
   export interface ActionTypeConfig {
     bg: string
     text: string
     labels: Partial<Record<'eng' | 'fra', string>>
   }
   ```
2. **New helper** `getActionLabel(type, lang)`:
   ```ts
   export function getActionLabel(type: string, lang: 'en' | 'fr'): string {
     const cfg = getActionColor(type)
     const iso639_3 = lang === 'fr' ? 'fra' : 'eng'
     return cfg.labels?.[iso639_3] || cfg.labels?.eng || type
   }
   ```
3. **Update call sites**:
   - `Home.vue` action chips: `{{ getActionLabel(actType, lang) }}`
   - `ResolutionDetail.vue` action card type label: same swap
   - `MeetingDetail.vue` action chips if any

## Considerations
- ~30 verbs × 2 languages = 60 translations. Need a French speaker
  to verify. Draft translations can be machine-generated and
  flagged for review.
- The action TYPE in the data model stays the English present-tense
  verb (`'thanks'`, `'approves'`) — that's the canonical identifier.
  Only the DISPLAY text is translated.

## Files touched
- `browser/src/data/action-types.yaml` — add `labels:` to every entry
- `browser/src/data/actionTypes.ts` — extend type, add `getActionLabel`
- `browser/src/views/Home.vue` — chip label uses `getActionLabel`
- `browser/src/views/ResolutionDetail.vue` — same
- `browser/src/views/MeetingDetail.vue` — same if applicable
- `browser/src/utils/actionType.ts` — `formatActionType` calls
  `getActionLabel` internally

## Verification
- Toggle UI to FR.
- Home page action chips show "Approuve" instead of "approves".
- Resolution detail page action card label shows "Remercie".
