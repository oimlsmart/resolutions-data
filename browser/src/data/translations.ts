// Bilingual string table for the OIML Resolutions archive UI.
// Add new keys here, with both English and French values.

export type Language = 'en' | 'fr'
export type TranslationKey = keyof typeof translations

export const translations = {
  // Site header / nav
  'nav.resolutions':   { en: 'Resolutions',  fr: 'Résolutions' },
  'nav.meetings':      { en: 'Meetings',     fr: 'Réunions' },
  'nav.about':         { en: 'About',        fr: 'À propos' },

  // Lang toggle aria
  'lang.toggle':       { en: 'Switch language', fr: 'Changer de langue' },
  'lang.en':           { en: 'English',      fr: 'Anglais' },
  'lang.fr':           { en: 'French',       fr: 'Français' },

  // Hero / home
  'home.heroLine1':    { en: 'Resolutions & Decisions', fr: 'Résolutions et décisions' },
  'home.heroLine2':    { en: 'of the CIML & OIML Conference', fr: 'du CIML et de la Conférence OIML' },
  'home.loading':      { en: 'Loading data...', fr: 'Chargement…' },
  'home.resolutionsLabel':  { en: 'Resolutions',  fr: 'Résolutions' },
  'home.meetingsLabel':     { en: 'Meetings',     fr: 'Réunions' },
  'home.memberStatesLabel': { en: 'Member States', fr: 'États membres' },
  'home.establishedLabel':  { en: 'Established',  fr: 'Fondée en' },

  // Home: subtitle template uses {{count}}, {{meetings}}, {{earliest}}, {{latest}}
  'home.subtitle':     {
    en: '{resolutions} resolutions from {meetings} meetings, spanning {earliest} to {latest}.',
    fr: '{resolutions} résolutions issues de {meetings} réunions, de {earliest} à {latest}.'
  },

  // Search
  'search.placeholder': { en: 'Search resolutions…', fr: 'Rechercher des résolutions…' },
  'search.results':     { en: '{count} resolutions', fr: '{count} résolutions' },

  // Meetings page
  'meetings.title':    { en: 'Meetings', fr: 'Réunions' },
  'meetings.subtitle': { en: 'Browse resolutions by CIML meeting or OIML Conference.', fr: 'Parcourir les résolutions par réunion du CIML ou Conférence OIML.' },
  'meetings.searchPlaceholder': { en: 'Search meetings by venue or year…', fr: 'Rechercher par lieu ou année…' },
  'meetings.body':     { en: 'Body', fr: 'Instance' },
  'meetings.bodyAll':  { en: 'All', fr: 'Toutes' },
  'meetings.bodyCiml': { en: 'CIML Meetings', fr: 'Réunions du CIML' },
  'meetings.bodyConf': { en: 'OIML Conference', fr: 'Conférence OIML' },
  'meetings.year':     { en: 'Year', fr: 'Année' },
  'meetings.country':  { en: 'Country', fr: 'Pays' },
  'meetings.count':    { en: '{count} meetings', fr: '{count} réunions' },

  // Resolution detail
  'resolution.subject':     { en: 'Subject', fr: 'Sujet' },
  'resolution.actions':     { en: 'Actions', fr: 'Actions' },
  'resolution.considerations': { en: 'Considerations', fr: 'Considérations' },
  'resolution.approvals':   { en: 'Approvals', fr: 'Approbations' },
  'resolution.dates':       { en: 'Dates', fr: 'Dates' },
  'resolution.relatedResolutions': { en: 'Related resolutions', fr: 'Résolutions liées' },
  'resolution.previous':    { en: 'Previous', fr: 'Précédente' },
  'resolution.next':        { en: 'Next', fr: 'Suivante' },
  'resolution.languageToggleLabel': { en: 'Language', fr: 'Langue' },

  // About
  'about.title':       { en: 'About This Archive', fr: 'À propos de cette archive' },
  'about.technical':   { en: 'Technical information', fr: 'Informations techniques' },

  // Footer / generic
  'footer.back':       { en: 'Back', fr: 'Retour' },
  'common.all':        { en: 'All', fr: 'Tous' },
} as const

// Helper to interpolate {placeholder} strings.
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}
