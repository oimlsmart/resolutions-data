import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Generated 404.html as SPA fallback for GitHub Pages');
} else {
  console.error('index.html not found in dist/');
  process.exit(1);
}

const baseUrl = 'https://oiml.org/resolutions';
const dataPath = path.resolve(__dirname, '../public/data/resolutions.json');
const meetingsPath = path.resolve(__dirname, '../public/data/meetings.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const meetings = JSON.parse(fs.readFileSync(meetingsPath, 'utf-8'));

const resolutionIds = data.map((r) => r.id);
// Canonical meeting URLs are keyed by meeting_slug (URN-derived).
// Legacy source_file URLs are emitted as HTTP-equivalent redirect HTML
// stubs below so existing links don't 404.
const meetingSlugs = meetings.map((m) => m.meeting_slug);

// Build legacy-source-file → canonical-slug redirect map.
const legacyRedirects = new Map();
for (const m of meetings) {
  for (const sf of m.source_files || []) {
    if (!legacyRedirects.has(sf)) legacyRedirects.set(sf, m.meeting_slug);
  }
}

// Sitemap: emit canonical URLs for both language variants of every
// page (e.g. /en/about and /fr/about). Each language is a separate
// <url> entry so search engines index both.
const langs = ['en', 'fr']

const staticPages = []
for (const lng of langs) {
  staticPages.push({ url: `${baseUrl}/${lng}/`, priority: '1.0', changefreq: 'weekly' })
  staticPages.push({ url: `${baseUrl}/${lng}/meetings`, priority: '0.8', changefreq: 'monthly' })
  staticPages.push({ url: `${baseUrl}/${lng}/about`, priority: '0.5', changefreq: 'yearly' })
}

const resolutionPages = []
for (const lng of langs) {
  for (const id of resolutionIds) {
    resolutionPages.push({
      url: `${baseUrl}/${lng}/resolution/${id}`,
      priority: '0.7',
      changefreq: 'yearly',
    })
  }
}

const meetingPages = []
for (const lng of langs) {
  for (const slug of meetingSlugs) {
    meetingPages.push({
      url: `${baseUrl}/${lng}/meetings/${slug}`,
      priority: '0.6',
      changefreq: 'yearly',
    })
  }
}

const allPages = [...staticPages, ...resolutionPages, ...meetingPages];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log(`Generated sitemap.xml with ${allPages.length} URLs`);

// Emit minimal HTML redirect stubs for legacy source_file-based meeting
// URLs (e.g. /meetings/15CIML-1976-FR → /meetings/ciml-15). GitHub Pages
// serves whatever index.html exists at a path, so a <meta refresh> +
// <link rel=canonical> stub is enough to keep old bookmarks working
// without breaking search-engine indexing.
let redirectCount = 0;
for (const [legacy, canonical] of legacyRedirects.entries()) {
  const legacyDir = path.join(distDir, 'meetings', legacy);
  fs.mkdirSync(legacyDir, { recursive: true });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=../${canonical}">
<link rel="canonical" href="../${canonical}">
<title>Redirecting…</title>
</head>
<body>
<p>This page has moved to <a href="../${canonical}">${canonical}</a>.</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(legacyDir, 'index.html'), html);
  redirectCount++;
}
if (redirectCount > 0) {
  console.log(`Generated ${redirectCount} legacy-URL redirect stub(s) under dist/meetings/`);
}

// Emit HTML redirect stubs for legacy unprefixed paths so cold requests
// to `/`, `/about`, `/meetings`, `/meetings/<slug>`, `/resolution/<id>`
// (old bookmarks, search-engine results) don't 404. The stub runs a
// tiny JS snippet that picks the user's preferred language and rewrites
// the URL to /<lang>/...
//
// IMPORTANT: the redirect target must include the Vite base path
// (/resolutions/) because these stubs are served from GitHub
// Pages under that sub-path, not from the domain root. Using bare
// absolute paths like /en/about would redirect to
// https://www.oimlsmart.org/en/about instead of
// https://www.oimlsmart.org/resolutions/en/about.
const BASE_PATH = '/resolutions';
function emitLangRedirect(dir, targetPath) {
  fs.mkdirSync(dir, { recursive: true })
  const base = BASE_PATH;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<script>
(function () {
  var saved = null;
  try { saved = localStorage.getItem('oiml-lang'); } catch (e) {}
  var nav = (navigator.language || '').toLowerCase();
  var lang = (saved === 'fr' || saved === 'en') ? saved : (nav.indexOf('fr') === 0 ? 'fr' : 'en');
  var target = '${base}' + '/' + lang + '${targetPath}' + window.location.search + window.location.hash;
  window.location.replace(target);
})();
</script>
<meta http-equiv="refresh" content="0; url=${base}/en${targetPath}">
</head>
<body>
<p>Redirecting to <a href="${base}/en${targetPath}">${base}/en${targetPath}</a>.</p>
</body>
</html>
`
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

// Root + static bare paths.
emitLangRedirect(path.join(distDir), '/')
emitLangRedirect(path.join(distDir, 'about'), '/about')
emitLangRedirect(path.join(distDir, 'meetings'), '/meetings')

// Bare per-resolution and per-meeting paths.
for (const id of resolutionIds) {
  emitLangRedirect(path.join(distDir, 'resolution', id), `/resolution/${id}`)
}
for (const slug of meetingSlugs) {
  emitLangRedirect(path.join(distDir, 'meetings', slug), `/meetings/${slug}`)
}

const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
console.log('Generated robots.txt');
