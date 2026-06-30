import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
import {
  buildResolutionRecord,
  buildMeetingDoi,
  bodyTypeFromSourceFile,
  sortResolutions,
} from './lib/transforms.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOLUTIONS_DIR = path.resolve(__dirname, '../../resolutions');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');
const RESOLUTIONS_FILE = path.join(OUTPUT_DIR, 'resolutions.json');
const MEETINGS_FILE = path.join(OUTPUT_DIR, 'meetings.json');

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(RESOLUTIONS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  const allResolutions = [];
  const meetingsMap = new Map();

  for (const file of files) {
    const filePath = path.join(RESOLUTIONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    let parsed;
    try {
      parsed = yaml.load(content);
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message);
      continue;
    }

    if (!parsed || !parsed.resolutions) continue;

    const source_file = file.replace(/\.ya?ml$/, '');
    const metadata = parsed.metadata || {}

    if (!meetingsMap.has(source_file)) {
      const dates = metadata.dates || []
      const dateRange = dates[0] || {}
      const meetingDate = dateRange.start || ''
      const year = meetingDate ? meetingDate.substring(0, 4) : ''
      const sourceUrls = metadata.source_urls || []
      const titleLocalized = metadata.title_localized || []
      const langs = Array.from(new Set(sourceUrls.map(u => u && u.language_code).filter(Boolean)))

      meetingsMap.set(source_file, {
        source_file,
        source_title: metadata.title || '',
        title_localized: titleLocalized,
        meeting_date: meetingDate,
        date_start: dateRange.start || '',
        date_end: dateRange.end || '',
        venue: metadata.venue || '',
        city: metadata.city || '',
        city_code: /^[A-Z]{3}$/.test(metadata.city || '') ? metadata.city : '',
        country_code: metadata.country_code || '',
        year,
        body_type: bodyTypeFromSourceFile(source_file),
        languages: langs,
        source_urls: sourceUrls,
        default_source_url: (sourceUrls.find(u => u.language_code === 'eng') || sourceUrls[0] || {}).ref || '',
        doi: buildMeetingDoi(metadata, source_file),
        resolution_count: 0,
      })
    }

    for (const res of parsed.resolutions) {
      // Each resolution carries multiple localizations; flatten one
      // JSON row per (resolution, localization).
      const localizations = res.localizations || []
      for (const loc of localizations) {
        const record = buildResolutionRecord(res, source_file, metadata, loc)
        if (record) {
          allResolutions.push(record)
          meetingsMap.get(source_file).resolution_count++
        }
      }
    }
  }

  allResolutions.sort(sortResolutions);
  const meetings = Array.from(meetingsMap.values()).sort((a, b) =>
    (b.meeting_date || '').localeCompare(a.meeting_date || '')
  )

  fs.writeFileSync(RESOLUTIONS_FILE, JSON.stringify(allResolutions), 'utf8');
  fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings), 'utf8');
  console.log(`Successfully built ${allResolutions.length} resolutions to ${RESOLUTIONS_FILE}`);
  console.log(`Successfully built ${meetings.length} meetings to ${MEETINGS_FILE}`);
}

main();
