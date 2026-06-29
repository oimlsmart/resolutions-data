import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
import { buildResolutionRecord, sortResolutions } from './lib/transforms.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOLUTIONS_DIR = path.resolve(__dirname, '../../resolutions');
const OUTPUT_DIR = path.resolve(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'resolutions.json');

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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

    if (!parsed || !parsed.resolutions) continue;

    const source_file = file.replace(/\.ya?ml$/, '');
    const metadata = parsed.metadata || {};

    for (const res of parsed.resolutions) {
      allResolutions.push(buildResolutionRecord(res, source_file, metadata));
    }
  }

  allResolutions.sort(sortResolutions);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allResolutions), 'utf8');
  console.log(`Successfully built ${allResolutions.length} resolutions to ${OUTPUT_FILE}`);
}

main();
