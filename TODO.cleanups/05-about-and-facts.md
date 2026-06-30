# 05 — About page restructure + correct OIML facts

## Goal
Address user feedback on the About page:
- "Edoxen format is unimportant — make it a collapse section, move to end
  under 'Technical information', default collapsed."
- "'Committee Page' should be 'Official website'."
- "'0 published standards' is incorrect — don't show."
- Member States count: 63 (per oiml.org memberslist_view?varMember=1)
- Corresponding Members count: 66 (per memberslist_view?varCorresponding=1)
- Add DOI pattern alongside URN pattern (as subsections under Technical
  information, alongside Edoxen format).
- Remove the "RFC 5141" note (we don't use RFC 5141).

## Done

### `browser/src/data/committee.ts`
Dropped `publishedStandards`, `participatingMembers`, `observingMembers`.
Added `memberStates: 63` and `correspondingMembers: 66` with source URLs in
comments.

### `browser/src/views/Home.vue`
"Member States" stat now uses `committee.memberStates`.

### `browser/src/App.vue`
Footer "Committee facts" block: removed the "Standards" line; replaced
"Members: X (P), Y (O)" with two lines — Member States (63) and
Corresponding Members (66).

### `browser/src/views/About.vue`
Restructured end-to-end:
- About Committee section: stat values now Member States + Corresponding
  Members (no more Published Standards / P-Members / O-Members)
- Links: "Committee Page" relabeled "Official website" pointing to
  oiml.org; second link relabeled "Member States" pointing to the OIML
  member list URL
- Removed the RFC 5141 paragraph
- **New "Technical information" section** at the end (after About
  Committee), wrapped in a native `<details>` element so it's collapsed by
  default. Contains three subsections:
  1. **Edoxen Format** — moved here verbatim from its old top-of-page slot
  2. **URN Pattern** — moved here from its old standalone slot, with
     concrete examples for CIML and Conference
  3. **DOI Pattern** — new subsection describing the `10.63493/resolutions/`
     scheme with examples linking to doi.org

### `browser/src/assets/css/standard-detail.css`
Added `.technical-details` / `.technical-summary` / `.technical-subheading`
/ `.technical-content` styles for the collapsible block (rotating ▸ marker,
brand-colored subheadings, vertical accent rule on the content).

## Verification
- Local build exits 0 (1696 sitemap URLs)
- About page renders with Technical information collapsed by default

## Outputs
- `browser/src/data/committee.ts`
- `browser/src/views/{Home,App,About}.vue`
- `browser/src/assets/css/standard-detail.css`
