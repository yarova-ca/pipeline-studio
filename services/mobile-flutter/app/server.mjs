import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'

// The static server serves the built SPA and proxies API calls to the BFF,
// so the client is same-origin: httpOnly cookies work and CSP stays 'self'.
const BFF_URL = process.env.BFF_URL ?? ''

// I-1 / C-2: refuse to start without the BFF the client depends on.
if (!BFF_URL) {
  console.error('FATAL: BFF_URL must be set')
  process.exit(1)
}

const dist = join(process.cwd(), 'dist')
const port = process.env.PORT ?? 8080
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

// C-6: security headers and a CSP on the served document. connect-src 'self'
// because all API calls are proxied through this same origin.
const CSP =
  "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-ancestors 'none'"

const PROXY_PREFIXES = ['/api', '/users', '/compliance', '/health/ready']

const server = http.createServer(async (req, res) => {
  const url = (req.url ?? '/').split('?')[0]

  // The static server's own liveness.
  if (url === '/health/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('{"status":"ok"}')
    return
  }

  // Proxy API/auth paths to the BFF.
  if (PROXY_PREFIXES.some((p) => url === p || url.startsWith(p + '/'))) {
    try {
      const upstream = await fetch(`${BFF_URL}${req.url}`, {
        method: req.method,
        headers: { cookie: req.headers.cookie ?? '', authorization: req.headers.authorization ?? '' },
      })
      const body = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' })
      res.end(body)
    } catch {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end('{"error":"bad gateway"}')
    }
    return
  }

  // Static files; unknown paths fall back to index.html (SPA routing).
  let p = normalize(url)
  if (p === '/' || !extname(p)) p = '/index.html'
  try {
    const body = await readFile(join(dist, p))
    res.writeHead(200, {
      'Content-Type': types[extname(p)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': CSP,
    })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('not found')
  }
})

server.listen(port, () => console.log(`react static server on ${port}, BFF ${BFF_URL}`))
