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
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const resolutionIds = data.map((r) => r.id);
const meetingFiles = [...new Set(data.map((r) => r.source_file))];

const staticPages = [
  { url: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
  { url: `${baseUrl}/meetings`, priority: '0.8', changefreq: 'monthly' },
  { url: `${baseUrl}/about`, priority: '0.5', changefreq: 'yearly' },
];

const resolutionPages = resolutionIds.map((id) => ({
  url: `${baseUrl}/resolution/${id}`,
  priority: '0.7',
  changefreq: 'yearly',
}));

const meetingPages = meetingFiles.map((sf) => ({
  url: `${baseUrl}/meetings/${sf}`,
  priority: '0.6',
  changefreq: 'yearly',
}));

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

const robots = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;

fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
console.log('Generated robots.txt');
