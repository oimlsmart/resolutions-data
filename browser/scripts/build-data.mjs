import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
import {
  buildResolutionRecords,
  buildMeetingDoi,
  sortResolutions,
} from './lib/transforms.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOLUTIONS_DIR = path.resolve(__dirname, '../../resolutions');
const MEETINGS_YAML_DIR = path.resolve(__dirname, '../../meetings');
const AGENDAS_DIR = path.resolve(__dirname, '../../agendas');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');
const RESOLUTIONS_FILE = path.join(OUTPUT_DIR, 'resolutions.json');
const MEETINGS_FILE = path.join(OUTPUT_DIR, 'meetings.json');

// Derive the canonical URL slug for a meeting from its URN.
//   urn:oiml:ciml:meeting:ciml-15        → ciml-15
//   urn:oiml:conference:meeting:conf-13  → conf-13
// Returns null when the URN doesn't match the expected shape.
function meetingSlugFromUrn(urn) {
  if (!urn) return null;
  const m = String(urn).match(/:meeting:([-\w]+)$/);
  return m ? m[1] : null;
}

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

// Read agendas/<slug>.yaml and return the items array. Returns [] if
// no agenda file exists.
function loadAgendaItems(slug) {
  const agendaPath = path.join(AGENDAS_DIR, `${slug}.yaml`);
  if (!fs.existsSync(agendaPath)) return [];
  try {
    const data = yaml.load(fs.readFileSync(agendaPath, 'utf8'));
    return data?.items || [];
  } catch {
    return [];
  }
}

// Read meetings/*.yaml. Each meeting YAML is the canonical record for one
// CIML meeting or OIML Conference session. Returns a Map keyed by
// meeting_slug (the URL-safe slug derived from the meeting's URN).
function loadMeetingYamls() {
  const bySlug = new Map();
  if (!fs.existsSync(MEETINGS_YAML_DIR)) return bySlug;

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

    const slug = meetingSlugFromUrn(parsed.urn) || file.replace(/\.ya?ml$/, '');
    const localizations = (parsed.localizations || []).map(loc => ({
      language_code: loc.language_code,
      script: loc.script,
      title: loc.title,
      general_area: loc.general_area,
    }));

    bySlug.set(slug, {
      meeting_slug: slug,
      source_files: [],
      urn: parsed.urn,
      committee: parsed.committee || '',
      virtual: !!parsed.virtual,
      localizations,
      minutes: (parsed.minutes || []).map(m => ({
        urn: m.urn,
        language_code: m.language_code,
      })),
      resolution_ref: parsed.resolution_refs || [],
      agenda_items: loadAgendaItems(slug),
      // Per-meeting metadata; the first resolution YAML we encounter
      // for this meeting will fill in source_title/venue/date/city/...
      source_title: localizations[0]?.title || '',
      meeting_date: parsed.date_range?.start || '',
      venue: parsed.general_area || '',
      city: parsed.city || '',
      country_code: parsed.country_code || '',
      year: parsed.year ? String(parsed.year) : '',
      body_type: parsed.committee?.includes('Conference') ? 'conference' : 'ciml',
      doi: buildMeetingDoi(parsed, slug),
      resolution_count: 0,
      acclamation_count: 0,
    });
  }
  return bySlug;
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const meetingsBySlug = loadMeetingYamls();

  // Build a source_file → meeting_slug lookup so each resolution YAML can
  // be linked to its canonical meeting. The mapping comes from the
  // meeting YAML's resolution_refs list (each ref's URN encodes the
  // source_file slug).
  const sourceFileToSlug = new Map();
  for (const [slug, meeting] of meetingsBySlug.entries()) {
    for (const ref of meeting.resolution_refs || []) {
      const sf = sourceFileFromResolutionRefUrn(ref);
      if (sf) sourceFileToSlug.set(sf, slug);
    }
  }

  const files = fs.readdirSync(RESOLUTIONS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  const allResolutions = [];

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

    if (!parsed || !parsed.decisions) continue;

    const source_file = file.replace(/\.ya?ml$/, '');
    const metadata = parsed.metadata || {};

    // The meeting_slug is the canonical identifier derived from the
    // resolution YAML's metadata.meeting_urn (preferred) or via the
    // source_file → slug lookup table.
    const meetingSlug =
      meetingSlugFromUrn(metadata.meeting_urn) ||
      sourceFileToSlug.get(source_file) ||
      null;

    if (!meetingSlug) {
      console.warn(`  ${file}: no meeting_urn in metadata and source_file "${source_file}" not in any meeting YAML — skipping`);
      continue;
    }

    const meeting = meetingsBySlug.get(meetingSlug);
    if (!meeting) {
      console.warn(`  ${file}: meeting_slug "${meetingSlug}" has no meetings/*.yaml — skipping`);
      continue;
    }

    // Track this source_file on the meeting so the UI can list all PDFs
    // that contributed resolutions.
    if (!meeting.source_files.includes(source_file)) {
      meeting.source_files.push(source_file);
    }

    // First source_file wins for the meeting-level metadata; meetings
    // that have no metadata at all (e.g. CIML 15-37 Bulletin, where the
    // meeting YAML only carries localizations) inherit it from the first
    // resolutions YAML we see.
    if (!meeting.source_title && metadata.title) meeting.source_title = metadata.title;
    if (!meeting.meeting_date && metadata.dates?.[0]?.start) {
      meeting.meeting_date = metadata.dates[0].start;
      meeting.year = meeting.meeting_date.substring(0, 4);
    }
    if (!meeting.venue && metadata.venue) meeting.venue = metadata.venue;
    if (!meeting.city && metadata.city) meeting.city = metadata.city;
    if (!meeting.country_code && metadata.country_code) meeting.country_code = metadata.country_code;

    // Track unique resolution identifiers seen for this meeting so the
    // count reflects logical resolutions (not one-per-language). The
    // merged YAMLs already collapse EN+FR into localizations[], so one
    // record per identifier is the natural count.
    if (!meeting._seenIdentifiers) meeting._seenIdentifiers = new Set();
    for (const res of parsed.decisions) {
      const records = buildResolutionRecords(res, source_file, metadata);
      for (const record of records) {
        record.meeting_slug = meetingSlug;
        record.meeting_urn = meeting.urn;
        allResolutions.push(record);
      }
      const key = records[0]?.identifier || records[0]?.id;
      if (key && !meeting._seenIdentifiers.has(key)) {
        meeting._seenIdentifiers.add(key);
        meeting.resolution_count++;
        if (records[0]?.is_acclamation) meeting.acclamation_count++;
      }
    }
  }

  // Strip the temporary identifier-tracking set before serialising.
  for (const m of meetingsBySlug.values()) {
    delete m._seenIdentifiers;
  }

  allResolutions.sort(sortResolutions);
  const meetings = Array.from(meetingsBySlug.values())
    .sort((a, b) => (b.meeting_date || '').localeCompare(a.meeting_date || ''));

  fs.writeFileSync(RESOLUTIONS_FILE, JSON.stringify(allResolutions), 'utf8');
  fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings), 'utf8');
  console.log(`Successfully built ${allResolutions.length} resolutions to ${RESOLUTIONS_FILE}`);
  console.log(`Successfully built ${meetings.length} meetings to ${MEETINGS_FILE}`);
}

main();
