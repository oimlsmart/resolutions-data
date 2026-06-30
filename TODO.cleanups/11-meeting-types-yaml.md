# 11 — Meeting body types + colors from YAML

## Trigger
User direction: *"meeting types and meeting types colors should be set via YAML."*

Before this change, CIML/Conference colors were hard-coded across 8 CSS
rules in `filter.css` and `resolution.css` (each referencing
`var(--color-brand-600, #004996)` / `var(--color-teal, #024873)`).
Short chip labels (`"CIML"`, `"CONF"`) were inline literals in
`Meetings.vue`. Editing the brand palette meant touching CSS.

## What moved to YAML
`browser/src/data/meeting-types.yaml` — source of truth for body-type
colors and short chip labels:

```yaml
meetingTypes:
  ciml:
    id: ciml
    short: { en: CIML, fr: CIML }
    bg: '#004996'
    fg: '#ffffff'
    accent: '#003a78'
  conference:
    id: conference
    short: { en: CONF, fr: CONF }
    bg: '#024873'
    fg: '#ffffff'
    accent: '#013a5e'
```

`browser/src/data/meetingTypes.ts` exposes typed accessors:
* `meetingTypes` — the full record.
* `getMeetingType(id)` — config lookup with `conference` fallback.
* `getMeetingTypeShort(id, lang)` — chip text in current UI language.
* `mtStyle(id)` — returns `{ '--mt-bg': …, '--mt-fg': …, '--mt-accent': … }`
  for `:style` bindings.

## CSS migration
Hard-coded body-type modifiers were removed; base classes now read
`var(--mt-bg)`, `var(--mt-fg)`, `var(--mt-accent)`:

| File | Removed | Now reads |
| --- | --- | --- |
| `filter.css` | `.body-section--ciml`, `.body-section--conference`, `.body-section__badge--ciml`, `.body-section__badge--conference`, `.timeline-node--ciml`, `.timeline-node--conference`, `.timeline-entry--ciml:hover .timeline-year`, `.timeline-entry--conference:hover .timeline-year` | `.body-section`, `.body-section__badge`, `.timeline-node` `.timeline-entry:hover .timeline-year` reading `var(--mt-*)` |
| `resolution.css` | `.std-results__badge.badge-body--ciml`, `.std-results__badge.badge-body--conference`, `.timeline-meta .meta-body-type--ciml`, `.timeline-meta .meta-body-type--conference` | Single `.badge-body`/`.meta-body-type` rule reading `var(--mt-*)` |

## Template wiring
* `Meetings.vue` — `:style="mtStyle('ciml'|conference)"` on each body
  `<section>` and each `<router-link class="timeline-entry">`. Chip text
  reads `{{ getMeetingTypeShort(id, lang) }}` so a future language with
  a different abbreviation needs only one YAML edit.
* `MeetingDetail.vue` — `:style="mtStyle(meeting.body_type)"` on the
  body-type `<span>`. The body label text still comes from
  `translations.yaml` (`meeting.ciml` / `meeting.conference` — full
  names like "CIML Meeting" / "OIML Conference"); only the chip +
  colors are bound from the new YAML.

## Why inline `:style` (not `:root` injection)
Hover states (`.timeline-entry:hover .timeline-year`) require `--mt-accent`
to be defined on the entering element, not on `<html>`. The simplest
mechanism is to set per-element CSS custom properties via `:style` —
the variables then inherit to children (`.timeline-node`, badge text)
without any global pre-paint work, and `:hover` works because the
element owns the var.

## Verification
* `npm run build` exits 0; sitemap still 1,696 URLs.
* `dist/meetings/index.html` shows inline
  `style="--mt-bg:#004996;--mt-fg:#ffffff;--mt-accent:#003a78"` on
  CIML elements and `--mt-bg:#024873;…` on Conference elements.
* Chip text in built HTML is `CIML` and `CONF` (matching
  `meeting-types.yaml` `short.en`).
* MeetingDetail pages for `ciml-60-…` and `conference-17-…` carry the
  expected per-body-type colors.

## Editing guide
To change the brand palette:
1. Edit `browser/src/data/meeting-types.yaml` (`bg` / `fg` / `accent`).
2. `npm run build`. No other files need to change.

To change a chip's abbreviation or add a new locale:
1. Edit the `short` field of the body type.
2. `npm run build`.

## Out of scope
The long labels (`t('meetings.bodyCiml')`, `t('meeting.ciml')`) stay
in `translations.yaml`. Those are full display strings; the YAML only
owns the short chip abbreviation + colors.
