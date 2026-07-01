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
const MEETINGS_YAML_DIR = path.resolve(__dirname, '../../meetings');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');
const RESOLUTIONS_FILE = path.join(OUTPUT_DIR, 'resolutions.json');
const MEETINGS_FILE = path.join(OUTPUT_DIR, 'meetings.json');

// Map a meeting YAML's resolution_refs[0] URN to the source_file slug
// used by the resolutions/ directory (e.g.
// "urn:oiml:ciml:resolution-collection:ciml-39-resolutions" →
// "ciml-39-resolutions"). Returns null when the URN doesn't match the
// expected shape.
function sourceFileFromResolutionRefUrn(urn) {
  if (!urn) return null;
  const m = String(urn).match(/:resolution-collection:([-\w]+)$/);
  return m ? m[1] : null;
}

// Read meetings/*.yaml and index by source_file slug (when derivable
// from resolution_refs) and by URN. Returns { bySourceFile, byUrn }.
function loadMeetingYamls() {
  const bySourceFile = new Map();
  const byUrn = new Map();
  if (!fs.existsSync(MEETINGS_YAML_DIR)) return { bySourceFile, byUrn };

  const files = fs.readdirSync(MEETINGS_YAML_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  for (const file of files) {
    const filePath = path.join(MEETINGS_YAML_DIR, file);
    let parsed;
    try {
      parsed = yaml.load(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Error parsing meetings/${file}:`, e.message);
      continue;
    }
    if (!parsed || !parsed.urn) continue;

    const localizations = (parsed.localizations || []).map(loc => ({
      language_code: loc.language_code,
      script: loc.script,
      title: loc.title,
      general_area: loc.general_area,
    }));

    const record = {
      urn: parsed.urn,
      meeting_slug: file.replace(/\.ya?ml$/, ''),
      committee: parsed.committee || '',
      virtual: !!parsed.virtual,
      localizations,
      minutes: (parsed.minutes || []).map(m => ({
        urn: m.urn,
        language_code: m.language_code,
      })),
      resolution_refs: parsed.resolution_refs || [],
    };
    byUrn.set(parsed.urn, record);
    for (const ref of parsed.resolution_refs || []) {
      const sf = sourceFileFromResolutionRefUrn(ref);
      if (sf) bySourceFile.set(sf, record);
    }
  }
  return { bySourceFile, byUrn };
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const { bySourceFile: meetingYamlBySourceFile, byUrn: meetingYamlByUrn } = loadMeetingYamls();

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
    const meetingYaml = meetingYamlBySourceFile.get(source_file);

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
        // Enrichment from meetings/*.yaml (when matched):
        urn: meetingYaml?.urn || '',
        virtual: meetingYaml?.virtual || false,
        committee: meetingYaml?.committee || '',
        localizations: meetingYaml?.localizations || [],
        minutes: meetingYaml?.minutes || [],
      })
    }

    for (const res of parsed.resolutions) {
      allResolutions.push(buildResolutionRecord(res, source_file, metadata));
      meetingsMap.get(source_file).resolution_count++
    }
  }

  // Meetings present in meetings/*.yaml but with no resolutions/ source
  // (e.g. CIML 15-38 skeletons that only have minutes): emit a minimal
  // record so they still appear in the Meetings list.
  for (const [sourceFile, meetingYaml] of meetingYamlBySourceFile.entries()) {
    if (meetingsMap.has(sourceFile)) continue;
    const loc = meetingYaml.localizations[0] || {};
    meetingsMap.set(sourceFile, {
      source_file: sourceFile,
      source_title: loc.title || meetingYaml.meeting_slug,
      meeting_date: '',
      venue: loc.general_area || '',
      city: '',
      country_code: '',
      year: '',
      body_type: sourceFile.startsWith('ciml-') ? 'ciml' : 'conference',
      language: loc.language_code === 'fra' ? 'fr' : 'en',
      doi: '',
      resolution_count: 0,
      urn: meetingYaml.urn,
      virtual: meetingYaml.virtual,
      committee: meetingYaml.committee,
      localizations: meetingYaml.localizations,
      minutes: meetingYaml.minutes,
    });
  }

  allResolutions.sort(sortResolutions);
  const meetings = Array.from(meetingsMap.values()).sort((a, b) =>
    (b.meeting_date || '').localeCompare(a.meeting_date || '')
  )

  fs.writeFileSync(RESOLUTIONS_FILE, JSON.stringify(allResolutions), 'utf8');
  fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings), 'utf8');
  console.log(`Successfully built ${allResolutions.length} resolutions to ${RESOLUTIONS_FILE}`);
  console.log(`Successfully built ${meetings.length} meetings to ${MEETINGS_FILE} (${meetingYamlByUrn.size} from meetings/*.yaml)`);
}

main();
