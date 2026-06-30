// Bilingual venue translations.
// Most cities are written the same in EN/FR; only countries (and a few
// city names like "Cologne"/"Köln") need explicit mapping.

const COUNTRY_FR: Record<string, string> = {
  'germany':             'Allemagne',
  'united states':       'États-Unis',
  'usa':                 'États-Unis',
  'united kingdom':      'Royaume-Uni',
  'uk':                  'Royaume-Uni',
  'china':               'Chine',
  'p.r. china':          'République populaire de Chine',
  "people's republic of china": 'République populaire de Chine',
  'france':              'France',
  'korea':               'Corée',
  'south korea':         'Corée du Sud',
  'japan':               'Japon',
  'italy':               'Italie',
  'switzerland':         'Suisse',
  'australia':           'Australie',
  'sweden':              'Suède',
  'norway':              'Norvège',
  'canada':              'Canada',
  'portugal':            'Portugal',
  'south africa':        'Afrique du Sud',
  'spain':               'Espagne',
  'netherlands':         'Pays-Bas',
  'the netherlands':     'Pays-Bas',
  'kenya':               'Kenya',
  'czech republic':      'République tchèque',
  'czechia':             'République tchèque',
  'viet nam':            'Viêt Nam',
  'vietnam':             'Viêt Nam',
  'romania':             'Roumanie',
  'new zealand':         'Nouvelle-Zélande',
  'colombia':            'Colombie',
  'slovak republic':     'République slovaque',
  'slovakia':            'Slovaquie',
  'thailand':            'Thaïlande',
}

const CITY_FR: Record<string, string> = {
  'vienna':       'Vienne',
  'cologne':      'Cologne',
  'köln':         'Cologne',
  'munich':       'Munich',
  'lyon':         'Lyon',
  'paris':        'Paris',
  'berlin':       'Berlin',
  'rome':         'Rome',
  'madrid':       'Madrid',
  'lisbon':       'Lisbonne',
  'the hague':    'La Haye',
  'geneva':       'Genève',
  'turin':        'Turin',
  'florence':     'Florence',
  'mombasa':      'Mombasa',
  'sydney':       'Sydney',
  'cape town':    'Le Cap',
  'bucharest':    'Bucarest',
  'prague':       'Prague',
  'shanghai':     'Shanghai',
  'tokyo':        'Tokyo',
  'beijing':      'Pékin',
  'ho chi minh city': 'Hô Chi Minh-Ville',
  'chiang mai':   'Chiang Mai',
  'auckland':     'Auckland',
  'orlando':      'Orlando',
  'bratislava':   'Bratislava',
  'arcachon':     'Arcachon',
  'strasbourg':   'Strasbourg',
  'cartagena de indias': 'Carthagène des Indes',
  'hamburg':      'Hambourg',
  'stavanger':    'Stavanger',
}

const VIRTUAL_FR = 'Réunion en ligne'

/** Translate a "City, Country" venue into French. */
export function venueToFrench(venue: string | null | undefined): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower.includes('virtual') || lower.includes('online')) return VIRTUAL_FR

  const parts = venue.split(',').map(s => s.trim())
  const translated = parts.map((part) => {
    const key = part.toLowerCase()
    if (CITY_FR[key]) return CITY_FR[key]
    if (COUNTRY_FR[key]) return COUNTRY_FR[key]
    return part
  })
  return translated.join(', ')
}

/** Pick the venue in the requested UI language. */
export function venueForLang(venue: string | null | undefined, lang: 'en' | 'fr'): string {
  if (lang === 'fr') return venueToFrench(venue)
  return venue || ''
}
