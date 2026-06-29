import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const DIST = path.resolve(process.cwd(), 'dist')
const PORT = 8080
const BASE = '/resolutions-data'

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0])

  if (urlPath.startsWith(BASE)) {
    urlPath = urlPath.slice(BASE.length) || '/'
  }

  let filePath = path.join(DIST, urlPath)

  if (urlPath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html')
  } else if (!path.extname(filePath)) {
    const htmlPath = path.join(filePath, 'index.html')
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const fallback = path.join(DIST, '404.html')
      fs.readFile(fallback, (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return }
        res.writeHead(404, { 'Content-Type': 'text/html' })
        res.end(d2)
      })
      return
    }
    const ext = path.extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Serving ${DIST} at http://127.0.0.1:${PORT}${BASE}/`)
})
