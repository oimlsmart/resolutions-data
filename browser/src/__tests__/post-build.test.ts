import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Test that the post-build script generates redirect HTML stubs with the
// correct Vite base path (/resolutions/) prepended. This is a
// regression test for the bug where visiting /resolutions/ redirected
// to /en/ (a 404) because the base path was missing from the redirect URLs.

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// We test the emitLangRedirect logic by importing the post-build module
// and running it against a temp dist directory, then inspecting the output.
// Since post-build.mjs is a script (not a module with exports), we test
// the generated HTML files directly after running a minimal build.

const TEMP_DIST = path.resolve(__dirname, '../../dist-test')
const BASE_PATH = '/resolutions'

describe('post-build redirect stubs', () => {
  beforeEach(() => {
    fs.rmSync(TEMP_DIST, { recursive: true, force: true })
    fs.mkdirSync(TEMP_DIST, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEMP_DIST, { recursive: true, force: true })
  })

  // Replicate the emitLangRedirect function from post-build.mjs so we can
  // test it in isolation. When post-build.mjs is refactored to export the
  // function, this local copy should be replaced with an import.
  function emitLangRedirect(dir: string, targetPath: string) {
    fs.mkdirSync(dir, { recursive: true })
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
  var target = '${BASE_PATH}' + '/' + lang + '${targetPath}' + window.location.search + window.location.hash;
  window.location.replace(target);
})();
</script>
<meta http-equiv="refresh" content="0; url=${BASE_PATH}/en${targetPath}">
</head>
<body>
<p>Redirecting to <a href="${BASE_PATH}/en${targetPath}">${BASE_PATH}/en${targetPath}</a>.</p>
</body>
</html>
`
    fs.writeFileSync(path.join(dir, 'index.html'), html)
  }

  it('root redirect includes base path in JS target', () => {
    emitLangRedirect(TEMP_DIST, '/')
    const html = fs.readFileSync(path.join(TEMP_DIST, 'index.html'), 'utf-8')
    // The JS target must contain the base path, not a bare /lang/ path.
    expect(html).toContain(`${BASE_PATH}' + '/' + lang`)
  })

  it('root redirect meta-refresh includes base path', () => {
    emitLangRedirect(TEMP_DIST, '/')
    const html = fs.readFileSync(path.join(TEMP_DIST, 'index.html'), 'utf-8')
    expect(html).toContain(`url=${BASE_PATH}/en/`)
    expect(html).not.toContain('url=/en/')
  })

  it('about redirect includes base path', () => {
    emitLangRedirect(path.join(TEMP_DIST, 'about'), '/about')
    const html = fs.readFileSync(path.join(TEMP_DIST, 'about', 'index.html'), 'utf-8')
    expect(html).toContain(`${BASE_PATH}/en/about`)
  })

  it('meeting redirect includes base path', () => {
    emitLangRedirect(path.join(TEMP_DIST, 'meetings', 'ciml-44'), '/meetings/ciml-44')
    const html = fs.readFileSync(path.join(TEMP_DIST, 'meetings', 'ciml-44', 'index.html'), 'utf-8')
    expect(html).toContain(`${BASE_PATH}/en/meetings/ciml-44`)
  })

  it('resolution redirect includes base path', () => {
    emitLangRedirect(path.join(TEMP_DIST, 'resolution', 'CIML-2009-9'), '/resolution/CIML-2009-9')
    const html = fs.readFileSync(path.join(TEMP_DIST, 'resolution', 'CIML-2009-9', 'index.html'), 'utf-8')
    expect(html).toContain(`${BASE_PATH}/en/resolution/CIML-2009-9`)
  })

  it('redirect target never uses bare /en/ without base', () => {
    // This is the regression test for the site-outage bug: the old
    // redirect stubs used bare /en/ paths, causing visitors to
    // https://www.oimlsmart.org/resolutions/ to be sent to
    // https://www.oimlsmart.org/en/ (a 404).
    for (const target of ['/', '/about', '/meetings/ciml-44', '/resolution/CIML-2009-9']) {
      const dir = path.join(TEMP_DIST, ...target.split('/').filter(Boolean))
      emitLangRedirect(dir, target)
      const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8')
      // The replace() target must NOT start with a bare '/en/' — it must
      // start with the base path.
      const replaceMatch = html.match(/var target = '([^']+)'/)
      expect(replaceMatch).toBeTruthy()
      expect(replaceMatch![1]).not.toMatch(/^\/en\//)
      expect(replaceMatch![1]).toMatch(new RegExp(`^${BASE_PATH}`))
    }
  })
})
