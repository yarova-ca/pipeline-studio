import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { join } from 'node:path'

// Invariant suite for the web-nextjs Tier-B SSR service.
//
// Each test maps to a Yarova platform invariant by I-id (server tier) or
// C-id (rendered client). The service has its OWN server tier (Next.js Route
// Handlers) AND a rendered client, so it must uphold both.
//
// Strategy: build once, then run the REAL production server (`next start`)
// over HTTP. Headers (I-17 / C-6) come from next.config.ts and are only
// applied by the running server, never by a route handler called in
// isolation, so an end-to-end HTTP test is the only honest way to assert them.
//
// Auth model (important SSR adaptation): this service does NOT verify a JWT
// locally. The OAuth access token lives in an httpOnly cookie (C-4) and is
// forwarded to the BFF as a Bearer token. The BFF decides valid vs invalid.
// So: "valid token"  = a cookie the stub BFF accepts -> 200.
//     "garbage token" = a cookie the stub BFF rejects -> 401.

const ROOT = join(__dirname, '..')
const APP_PORT = 3461
const BFF_PORT = 3462
const APP = `http://127.0.0.1:${APP_PORT}`

// Tokens the stub BFF recognises.
const VALID_TOKEN = 'valid-bff-session-token'

let bff: Server
let app: ChildProcess

function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        await fetch(url)
        resolve()
      } catch {
        if (Date.now() > deadline) reject(new Error(`timeout waiting for ${url}`))
        else setTimeout(tick, 300)
      }
    }
    tick()
  })
}

beforeAll(async () => {
  // Stub BFF: validates the forwarded Bearer token exactly how the SSR relies
  // on it. Unknown/garbage token -> 401. Valid token -> 200.
  bff = createServer((req, res) => {
    const auth = req.headers['authorization'] ?? ''
    const ok = auth === `Bearer ${VALID_TOKEN}`
    if (req.url === '/health/ready') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok' }))
      return
    }
    if (!ok) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'bff rejects token' }))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ id: 'u1', email: 'a@b.ca' }))
  })
  await new Promise<void>((r) => bff.listen(BFF_PORT, '127.0.0.1', r))

  app = spawn('./node_modules/.bin/next', ['start', '-p', String(APP_PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      BFF_URL: `http://127.0.0.1:${BFF_PORT}`,
      SESSION_SECRET: '0123456789012345678901234567890123',
      PORT: String(APP_PORT),
    },
    stdio: 'ignore',
  })

  await waitForHttp(`${APP}/health/live`, 60_000)
}, 120_000)

afterAll(async () => {
  if (app) app.kill('SIGKILL')
  if (bff) await new Promise<void>((r) => bff.close(() => r()))
})

// ---------------------------------------------------------------------------
// SERVER INVARIANTS — asserted on Next.js Route Handlers over real HTTP.
// ---------------------------------------------------------------------------

describe('server invariants (Next.js Route Handlers)', () => {
  it('I-3: protected route with NO auth -> 401', async () => {
    const res = await fetch(`${APP}/api/users/me`)
    expect(res.status).toBe(401)
  })

  it('I-4: protected route with a garbage/tampered token -> 401', async () => {
    // A cookie present but holding a token the BFF rejects.
    const res = await fetch(`${APP}/api/users/me`, {
      headers: { cookie: 'access_token=tampered.garbage.token' },
    })
    expect(res.status).toBe(401)
  })

  it('I-3 (positive): protected route with a token the BFF accepts -> 200', async () => {
    const res = await fetch(`${APP}/api/users/me`, {
      headers: { cookie: `access_token=${VALID_TOKEN}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.email).toBe('a@b.ca')
  })

  it('I-6: POST with VALID token + unknown extra field -> 400 (strict schema)', async () => {
    const res = await fetch(`${APP}/api/users/me/preferences`, {
      method: 'POST',
      headers: {
        cookie: `access_token=${VALID_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ theme: 'dark', locale: 'en-CA', is_admin: true }),
    })
    expect(res.status).toBe(400)
  })

  it('I-6 (positive): POST with VALID token + only known fields -> 200', async () => {
    const res = await fetch(`${APP}/api/users/me/preferences`, {
      method: 'POST',
      headers: {
        cookie: `access_token=${VALID_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ theme: 'dark', locale: 'en-CA' }),
    })
    expect(res.status).toBe(200)
  })

  it('I-10: health/liveness route -> 200', async () => {
    const res = await fetch(`${APP}/health/live`)
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('ok')
  })

  it('I-13: metrics route -> 200 with a request-duration golden-signal metric', async () => {
    const res = await fetch(`${APP}/api/metrics`)
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('http_request_duration_seconds')
  })

  it('I-17: a response carries x-content-type-options: nosniff', async () => {
    const res = await fetch(`${APP}/health/live`)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})

// ---------------------------------------------------------------------------
// CLIENT INVARIANTS (Tier B) — asserted on the rendered client / built output.
// ---------------------------------------------------------------------------

describe('client invariants (rendered SSR client)', () => {
  it('C-6: the served document sets CSP + security headers', async () => {
    const res = await fetch(`${APP}/`)
    expect(res.status).toBe(200)
    const csp = res.headers.get('content-security-policy') ?? ''
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('C-1: no secret reaches the client bundle; only NEXT_PUBLIC_ env is inlined', async () => {
    const { readFileSync, readdirSync } = await import('node:fs')
    const { join: pjoin } = await import('node:path')

    // Walk the built client chunks shipped to the browser.
    const chunkDir = pjoin(ROOT, '.next', 'static')
    const files: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = pjoin(dir, e.name)
        if (e.isDirectory()) walk(full)
        else if (/\.(js|mjs)$/.test(e.name)) files.push(full)
      }
    }
    walk(chunkDir)
    expect(files.length).toBeGreaterThan(0)

    // Server-only secrets that must never appear in the client bundle.
    const forbidden = [
      'SESSION_SECRET',
      '0123456789012345678901234567890123', // the secret VALUE used at build
      'OAUTH_CLIENT_SECRET',
      'AUTH_CLIENT_SECRET',
      VALID_TOKEN,
    ]
    for (const f of files) {
      const src = readFileSync(f, 'utf8')
      for (const needle of forbidden) {
        expect(src.includes(needle), `secret "${needle}" leaked into ${f}`).toBe(false)
      }
    }

    // Source-level guard: every process.env read in client-reachable source
    // must target a NEXT_PUBLIC_-prefixed var. Server-only files (route
    // handlers, src/*, instrumentation) are allowed private env.
    const clientSource = pjoin(ROOT, 'app', 'page.tsx')
    const pageSrc = readFileSync(clientSource, 'utf8')
    const envReads = pageSrc.match(/process\.env\.([A-Z0-9_]+)/g) ?? []
    for (const read of envReads) {
      expect(read.startsWith('process.env.NEXT_PUBLIC_'), `non-public env in client: ${read}`).toBe(
        true,
      )
    }
  })
})
