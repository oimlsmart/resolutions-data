// Generate static HTML redirect files for legacy URLs.
//
// After TODO.complete/13 (single-file-per-meeting), URLs changed from
// `/meetings/ciml-39-decisions-en` to `/meetings/ciml-39-decisions`.
// External links still point at the old paths. Each redirect is a
// static index.html with both a `<meta http-equiv="refresh">` (for
// browsers) and a `<link rel="canonical">` (for search engines).
//
// The `base` is the deployment base path (matches Vite's
// `import.meta.env.BASE_URL` so it works on GitHub Pages subpaths).

import fs from 'node:fs';
import path from 'node:path';

const LEGACY_SUFFIXES = ['-en', '-fr', '-bilingual-en', '-bilingual-fr'];

export function writeLegacyMeetingRedirects(distDir, meetingSlugs, base = '/') {
  let count = 0;
  for (const slug of meetingSlugs) {
    const canonical = path.join(distDir, 'meetings', slug, 'index.html');
    if (!fs.existsSync(canonical)) continue;
    for (const suffix of LEGACY_SUFFIXES) {
      const legacy = `${slug}${suffix}`;
      const target = `${base.replace(/\/$/, '')}/meetings/${slug}`;
      writeRedirectFile(
        path.join(distDir, 'meetings', legacy, 'index.html'),
        target,
      );
      count++;
    }
  }
  return count;
}

function writeRedirectFile(targetPath, absoluteTargetUrl) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${absoluteTargetUrl}">
<meta http-equiv="refresh" content="0; url=${absoluteTargetUrl}">
<script>location.replace('${absoluteTargetUrl}' + location.search + location.hash);</script>
</head>
<body>
<p>Redirecting to <a href="${absoluteTargetUrl}">${absoluteTargetUrl}</a>.</p>
</body>
</html>
`;
  fs.writeFileSync(targetPath, html);
}
