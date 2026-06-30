// Bilingual string table for the OIML Resolutions archive UI.

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
  'home.subtitle':     {
    en: '{resolutions} resolutions from {meetings} meetings, spanning {earliest} to {latest}.',
    fr: '{resolutions} résolutions issues de {meetings} réunions, de {earliest} à {latest}.'
  },
  'home.tagline':      {
    en: 'Resolutions of the CIML and the OIML Conference',
    fr: 'Résolutions du CIML et de la Conférence OIML'
  },

  // Search
  'search.placeholder': { en: 'Search resolutions…', fr: 'Rechercher des résolutions…' },
  'search.results':     { en: '{count} resolutions', fr: '{count} résolutions' },

  // Meetings page
  'meetings.title':    { en: 'Meetings', fr: 'Réunions' },
  'meetings.subtitle': {
    en: 'Browse resolutions by CIML meeting or OIML Conference.',
    fr: 'Parcourir les résolutions par réunion du CIML ou Conférence OIML.'
  },
  'meetings.searchPlaceholder': {
    en: 'Search meetings by venue or year…',
    fr: 'Rechercher par lieu ou année…'
  },
  'meetings.body':         { en: 'Body',           fr: 'Instance' },
  'meetings.bodyAll':      { en: 'All',            fr: 'Toutes' },
  'meetings.bodyCiml':     { en: 'CIML Meetings',  fr: 'Réunions du CIML' },
  'meetings.bodyConf':     { en: 'OIML Conference', fr: 'Conférence OIML' },
  'meetings.year':         { en: 'Year',           fr: 'Année' },
  'meetings.country':      { en: 'Country',        fr: 'Pays' },
  'meetings.count':        { en: '{count} meetings',       fr: '{count} réunions' },
  'meetings.legendSize':   { en: 'Node size = resolution count', fr: "La taille du nœud = nombre de résolutions" },
  'meetings.legendHost':   { en: 'Host country',   fr: 'Pays hôte' },
  'meetings.legendVirtual':{ en: 'Virtual meeting', fr: 'Réunion en ligne' },
  'meetings.virtual':      { en: 'Virtual Meeting', fr: 'Réunion en ligne' },
  'meetings.empty':        { en: 'No meetings match the current filters.', fr: "Aucune réunion ne correspond aux filtres." },
  'meetings.back':         { en: 'Back to Meetings', fr: 'Retour aux réunions' },
  'meetings.resolutionsCount': { en: '{count} resolutions', fr: '{count} résolutions' },

  // Meeting body-type badges (used on list + detail)
  'meeting.ciml':         { en: 'CIML Meeting',    fr: 'Réunion du CIML' },
  'meeting.conference':   { en: 'OIML Conference', fr: 'Conférence OIML' },
  'meeting.meetingUrn':   { en: 'Meeting URN',     fr: 'URN de la réunion' },
  'meeting.meetingDoi':   { en: 'Meeting DOI',     fr: 'DOI de la réunion' },

  // Resolution detail
  'resolution.back':           { en: 'Back to results', fr: 'Retour aux résultats' },
  'resolution.subject':        { en: 'Subject',         fr: 'Sujet' },
  'resolution.actions':        { en: 'Actions',         fr: 'Actions' },
  'resolution.considerations': { en: 'Considerations',  fr: 'Considérations' },
  'resolution.approvals':      { en: 'Approvals',       fr: 'Approbations' },
  'resolution.dates':          { en: 'Dates',           fr: 'Dates' },
  'resolution.related':        { en: 'Related resolutions', fr: 'Résolutions liées' },
  'resolution.previous':       { en: 'Previous',        fr: 'Précédente' },
  'resolution.next':           { en: 'Next',            fr: 'Suivante' },
  'resolution.languageToggleLabel': { en: 'Language',   fr: 'Langue' },
  'resolution.frenchVersion':  { en: 'French version',  fr: 'Version française' },

  // About
  'about.title':       { en: 'About This Archive', fr: 'À propos de cette archive' },
  'about.technical':   { en: 'Technical information', fr: 'Informations techniques' },

  // Footer / generic
  'footer.back':       { en: 'Back', fr: 'Retour' },
  'footer.committee':  { en: 'Organization', fr: 'Organisation' },
  'footer.explore':    { en: 'Explore', fr: 'Explorer' },
  'footer.links':      { en: 'Links', fr: 'Liens' },
  'footer.secretariat':{ en: 'Secretariat:', fr: 'Secrétariat :' },
  'footer.established':{ en: 'Established:', fr: 'Fondée en :' },
  'footer.memberStates':{ en: 'Member States:', fr: "États membres :" },
  'footer.correspondingMembers':{ en: 'Corresponding Members:', fr: 'Membres correspondants :' },
  'footer.officialWebsite': { en: 'Official website', fr: 'Site officiel' },
  'footer.memberStatesLink':{ en: 'Member States', fr: 'États membres' },
  'common.all':        { en: 'All', fr: 'Tous' },
  // Committee identity (French mirrors what's on oiml.org/fr)
  'committee.name':  { en: 'OIML', fr: 'OIML' },
  'committee.title': {
    en: 'International Organization of Legal Metrology',
    fr: 'Organisation Internationale de Métrologie Légale',
  },
  'committee.scope': {
    en: 'Legal metrology — the practice and science of measurement that affects trade, health, safety, and the environment.',
    fr: "La métrologie légale — la pratique et la science de la mesure qui touche au commerce, à la santé, à la sécurité et à l'environnement.",
  },
  'committee.tagline': {
    en: 'Resolutions of the CIML and the OIML Conference',
    fr: 'Résolutions du CIML et de la Conférence OIML',
  },

  // About page headings
  'about.heroTitle':    { en: 'About This Archive', fr: 'À propos de cette archive' },
  'about.heroSubtitle': {
    en: 'A digital record of CIML Meeting and OIML Conference resolutions, 2004 to today.',
    fr: "Un registre numérique des résolutions des réunions du CIML et des Conférences OIML, de 2004 à aujourd'hui.",
  },
  'about.aboutCommittee': { en: 'About the OIML', fr: "À propos de l'OOIML" },
  'about.edoxen':       { en: 'Edoxen Format', fr: "Format Edoxen" },
  'about.lifecycle':    { en: 'Resolution Lifecycle', fr: "Cycle de vie d'une résolution" },
  'about.urnPattern':   { en: 'URN Pattern', fr: "Schéma d'URN" },
  'about.doiPattern':   { en: 'DOI Pattern', fr: 'Schéma de DOI' },

} as const

// Helper to interpolate {placeholder} strings.
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}
