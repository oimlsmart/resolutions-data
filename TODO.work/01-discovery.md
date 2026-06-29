# 01 — Discovery

## Goal
Find every resolution/decision PDF published on the OIML CIML and Conference
index pages (EN + FR), filtered to resolutions only (no minutes / summary reports).

## Inputs
Four index pages from oiml.org (Plone backend):
- https://www.oiml.org/en/structure/ciml/sites
- https://www.oiml.org/fr/structure/ciml/sites
- https://www.oiml.org/en/structure/conference/sites
- https://www.oiml.org/fr/structure/conference/sites-web-de-conferences

## Method
`curl -sL` each page, then `grep -oE 'href="[^"]*\.pdf[^"]*"'`, sort -u.
Plone renders each PDF cell as `<a href="..."><img alt="PDF"></a>` — direct
href extraction works.

Filter regex: filename must contain `resolution` or `decision` (case-insensitive).
Drops: `minutes`, `summary-report`, `draft-minutes`.

## Result — 51 resolution/decision PDFs

### CIML (41 PDFs across 22 meetings, 39th–60th)
| Mtg | Year | Venue | Doc kind | Languages |
|---|---|---|---|---|
| 39 | 2004 | Berlin, DE | decisions | en, fr |
| 40 | 2005 | Lyon, FR | decisions | en, fr |
| 41 | 2006 | Cape Town, ZA | decisions | en, fr |
| 42 | 2007 | Shanghai, CN | decisions | en, fr |
| 43 | 2008 | Sydney, AU | resolutions | bilingual (one file) |
| 44 | 2009 | Mombasa, KE | resolutions | en, fr |
| 45 | 2010 | Orlando, US | resolutions | en, fr |
| 46 | 2011 | Prague, CZ | resolutions | en, fr |
| 47 | 2012 | Bucharest, RO | resolutions | en, fr |
| 48 | 2013 | Ho Chi Minh City, VN | resolutions | en, fr |
| 49 | 2014 | Auckland, NZ | resolutions | en, fr |
| 50 | 2015 | Arcachon, FR | resolutions | en, fr |
| 51 | 2016 | Strasbourg, FR | resolutions | en, fr |
| 52 | 2017 | Cartagena, CO | resolutions | en, fr |
| 53 | 2018 | Hamburg, DE | resolutions | en, fr |
| 54 | 2019 | Bratislava, SK | resolutions | en, fr |
| 55 | 2020 | Online | resolutions | en, fr |
| 56 | 2021 | Online | resolutions | en, fr |
| 57 | 2022 | Online | resolutions | en, fr |
| 58 | 2023 | Chiang Mai, TH | resolutions | en, fr |
| 59 | 2024 | Online | resolutions | en (no FR published) |
| 60 | 2025 | Paris, FR | resolutions | en (no FR published) |

### Conference (10 PDFs across 6 sessions, 12th–17th)
| Sess | Year | Venue | Doc kind | Languages |
|---|---|---|---|---|
| 12 | 2004 | Berlin, DE | decisions (EN is joint CIML-39 + DC; FR is conf-only decisions) | en, fr |
| 13 | 2008 | Sydney, AU | resolutions | bilingual (one file) |
| 14 | 2012 | Bucharest, RO | resolutions | en, fr |
| 15 | 2016 | Strasbourg, FR | resolutions | en, fr |
| 16 | 2021 | Online | resolutions | en, fr |
| 17 | 2025 | Paris, FR | resolutions | en (no FR published) |

## URL naming patterns observed (Plone)
- CIML 39–42: `{N}-ciml-decisions-{english|french}.pdf`
- CIML 43: `43-ciml-resolutions-bilingual.pdf` (same URL on EN + FR index — single doc)
- CIML 44–59: `{N}-ciml-resolutions-{english|french}.pdf`
- CIML 60: `60ciml_resolutions.pdf` (newer naming, underscore, no `-english` suffix)
- Conf 12 EN: `12-conf-39-ciml-dc-decisions.pdf` (joint with 39th CIML and DC)
- Conf 12 FR: `12-conf-decisions-french.pdf`
- Conf 13: `13-conf-resolutions-bilingual.pdf`
- Conf 14–16: `{N}-conf-resolutions-{english|french}.pdf`
- Conf 17: `17conference_resolutions.pdf` (newer naming, no `-english` suffix)

## Outputs
- This file (full table for reference)
- `scripts/manifest.yaml` (next phase)

## Issues / notes
- CIML 59 and 60 have **no FR version** published. May arrive later; not assumed.
- Conference 12 has **asymmetric EN/FR**: EN is the joint CIML-39 + DC doc,
  FR is conference-only decisions. Different content — keep both, tag the EN
  with `doc_kind: decisions-joint-ciml-dc`.
- CIML 39–42 use "decisions" terminology; from 43 onward it's "resolutions".
  Slug preserves the original term to stay honest about source naming.
- CIML 60 / Conf 17 use a newer Plone filename convention (no hyphens, no
  `-english` suffix). Slug normalizes to `ciml-60-resolutions-en` /
  `conference-17-resolutions-en` for consistency.

## Next
Phase 02 — write `scripts/manifest.yaml` from this table.
