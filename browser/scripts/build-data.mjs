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

    // Track per-source-file meeting metadata
    if (!meetingsMap.has(source_file)) {
      const dates = metadata.dates || []
      const meetingDate = dates.length > 0 ? dates[0].start : ''
      const year = meetingDate ? meetingDate.substring(0, 4) : ''
      meetingsMap.set(source_file, {
        source_file,
        source_title: metadata.title || '',
        meeting_date: meetingDate,
        venue: metadata.venue || '',
        city: metadata.city || '',
        country_code: metadata.country_code || '',
        year,
        body_type: bodyTypeFromSourceFile(source_file),
        language: metadata.language || '',
        doi: buildMeetingDoi(metadata, source_file),
        resolution_count: 0,
      })
    }

    for (const res of parsed.resolutions) {
      allResolutions.push(buildResolutionRecord(res, source_file, metadata));
      meetingsMap.get(source_file).resolution_count++
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
