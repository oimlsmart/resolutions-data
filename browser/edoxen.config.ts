import { defineConfig } from '@edoxen/browser/config'

export default defineConfig({
  site: {
    title: 'OIML Resolutions',
    description: 'Resolutions of the International Organization of Legal Metrology (OIML).',
    url: 'https://resolutions.oiml.org',
  },
  data: {
    decisions: '../edoxen-data/decisions',
    meetings: '../edoxen-data/meetings',
  },
  locales: [
    { code: 'en', label: 'English', routePrefix: '' },
    { code: 'fr', label: 'Français', routePrefix: 'fr' },
  ],
  theme: {
    primary: '#004996',
    accent: '#1a6fc2',
    surface: '#ffffff',
  },
  features: {
    search: true,
    timeline: true,
    urnCopy: true,
    doi: false,
    darkMode: true,
    printStyles: true,
  },
})
