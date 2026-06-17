import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import * as h3 from 'h3'

// Invariant suite for the Nuxt SSR golden service (Tier B).
// Tier B holds the SERVER invariants on its Nitro server routes PLUS the
// cheaply-testable CLIENT invariants on its rendered output.
//
// SSR adaptation: Nuxt server routes use auto-imported globals
// (defineEventHandler, setResponseStatus, setHeader, ...). The tests install
// those globals from the real `h3` package, then import the REAL handler
// modules and invoke them against a synthetic h3 event built on a Node
// req/res pair. This exercises the genuine handler code paths — no handler
// logic is re-implemented in the test.

// --- install Nuxt auto-imports as globals (real h3 implementations) ---
const g = globalThis as unknown as Record<string, unknown>
beforeAll(() => {
  g.defineEventHandler = h3.defineEventHandler
  g.defineNitroPlugin = (fn: unknown) => fn
  g.setResponseStatus = h3.setResponseStatus
  g.setHeader = h3.setHeader
  g.getHeader = h3.getHeader
  g.parseCookies = h3.parseCookies
  g.readBody = h3.readBody
  g.createError = h3.createError
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const ROOT = process.cwd()

// Build a synthetic h3 event with a controllable Node req/res.
function makeEvent(opts: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: string
} = {}) {
  const { method = 'GET', url = '/', headers = {}, body } = opts
  const req = Object.assign(new EventEmitter(), {
    method,
    url,
    headers: { 'content-type': 'application/json', ...headers },
    // h3.readRawBody reads from req.body (Buffer) when present.
    ...(body !== undefined ? { body: Buffer.from(body) } : {}),
  }) as unknown as import('node:http').IncomingMessage
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200,
    _headers: {} as Record<string, string>,
    setHeader(k: string, v: string) {
      this._headers[k.toLowerCase()] = v
    },
    getHeader(k: string) {
      return this._headers[k.toLowerCase()]
    },
    end() {
      this.emit('finish')
    },
  }) as unknown as import('node:http').ServerResponse

  return h3.createEvent(req, res)
}

async function loadHandler(rel: string) {
  const mod = await import(rel)
  return mod.default as (event: ReturnType<typeof makeEvent>) => unknown | Promise<unknown>
}

describe('web-nuxt invariants', () => {
  // -------- I-3: protected server route, NO auth → 401 --------
  it('I-3: protected route /api/users/me with no auth cookie → 401', async () => {
    const handler = await loadHandler('../server/routes/api/users/me.get.ts')
    const event = makeEvent({ headers: {} }) // no Cookie header
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const out = await handler(event)
    expect(event.node.res.statusCode).toBe(401)
    expect(out).toEqual({ error: 'Unauthorized' })
    // No auth → the SSR must NOT forward to the BFF.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  // -------- I-4: protected server route, garbage/tampered token → 401 --------
  it('I-4: protected route with a tampered token the BFF rejects → 401', async () => {
    const handler = await loadHandler('../server/routes/api/users/me.get.ts')
    const event = makeEvent({ headers: { cookie: 'access_token=tampered.garbage.token' } })
    // The BFF is the token authority; a tampered token comes back 401.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 })),
    )

    const out = await handler(event)
    expect(event.node.res.statusCode).toBe(401)
    expect(out).toEqual({ error: 'Unauthorized' })
  })

  // Sanity: a VALID token (BFF accepts) is forwarded and passes through.
  it('I-4 control: a valid token the BFF accepts → 200 passthrough', async () => {
    const handler = await loadHandler('../server/routes/api/users/me.get.ts')
    const event = makeEvent({ headers: { cookie: 'access_token=valid.token.here' } })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ id: 'u1' }), { status: 200 })),
    )
    const out = await handler(event)
    expect(event.node.res.statusCode).toBe(200)
    expect(out).toEqual({ id: 'u1' })
  })

  // -------- I-6: POST(PATCH) with VALID token + unknown extra field → 400 --------
  it('I-6: protected write with a valid token + unknown extra field → 400 (unknown rejected)', async () => {
    const handler = await loadHandler('../server/routes/api/users/me.patch.ts')
    const event = makeEvent({
      method: 'PATCH',
      headers: { cookie: 'access_token=valid.token.here' },
      body: JSON.stringify({ displayName: 'Rohith', isAdmin: true }),
    })
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
    // The unknown field must be rejected BEFORE any call reaches the BFF.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('I-6 control: a valid token + only known fields → forwarded (200)', async () => {
    const handler = await loadHandler('../server/routes/api/users/me.patch.ts')
    const event = makeEvent({
      method: 'PATCH',
      headers: { cookie: 'access_token=valid.token.here' },
      body: JSON.stringify({ displayName: 'Rohith' }),
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    )
    const out = await handler(event)
    expect(event.node.res.statusCode).toBe(200)
    expect(out).toEqual({ ok: true })
  })

  // -------- I-10: health/liveness route → 200 --------
  it('I-10: /health/live returns ok with a 200 default status', async () => {
    const handler = await loadHandler('../server/routes/health/live.get.ts')
    const event = makeEvent({ url: '/health/live' })
    const out = await handler(event)
    expect(out).toEqual({ status: 'ok' })
    // h3 default status is 200; the handler never overrides it.
    expect(event.node.res.statusCode).toBe(200)
  })

  // -------- I-13: metrics route → 200 with request-duration golden signal --------
  it('I-13: /api/metrics exposes http_request_duration_seconds', async () => {
    // Observe one request so the histogram emits samples.
    const { httpDuration } = await import('../server/utils/metrics.ts')
    httpDuration.labels('GET', '200').observe(0.012)

    const handler = await loadHandler('../server/routes/api/metrics.get.ts')
    const event = makeEvent({ url: '/api/metrics' })
    const body = (await handler(event)) as string

    // Content-Type is the Prometheus exposition type, set on the event.
    expect(String(event.node.res.getHeader('content-type'))).toMatch(/text\/plain/)
    expect(body).toContain('http_request_duration_seconds')
    // Golden signal: the histogram bucket/count series must be present.
    expect(body).toMatch(/http_request_duration_seconds_bucket/)
  })

  // -------- I-17 + C-6: nosniff + CSP security headers on every response --------
  // SSR adaptation: in Nuxt these headers are applied by Nitro from
  // nuxt.config.ts routeRules (not inside handler code). The config is the
  // single source of truth, so the invariant is asserted against it.
  it('I-17: every response carries x-content-type-options: nosniff (routeRules /**)', () => {
    const cfg = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')
    expect(cfg).toMatch(/['"]\/\*\*['"]\s*:/) // a /** route rule exists
    expect(cfg).toMatch(/X-Content-Type-Options['"]\s*:\s*['"]nosniff['"]/i)
  })

  it('C-6: served document sets a Content-Security-Policy and framing protections', () => {
    const cfg = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')
    expect(cfg).toMatch(/Content-Security-Policy/i)
    expect(cfg).toMatch(/default-src 'self'/)
    expect(cfg).toMatch(/frame-ancestors 'none'/)
    expect(cfg).toMatch(/X-Frame-Options['"]\s*:\s*['"]DENY['"]/i)
  })

  // -------- C-1: no secret reaches the client bundle --------
  // The client surface is app.vue + any non-server source. Server-only files
  // live under server/ and are never bundled into the client.
  it('C-1: no secret-bearing env reaches client source; only PUBLIC_/NUXT_PUBLIC_ allowed', () => {
    const SECRET_PATTERNS = [
      /SESSION_SECRET/,
      /process\.env\.BFF_URL/,
      /Bearer\s+\$\{/,
      /access_token/,
    ]
    // Collect client-side source: everything outside server/, node_modules, build dirs.
    const clientFiles: string[] = []
    const skip = new Set(['node_modules', 'server', '.nuxt', '.output', 'tests', 'compliance', 'integrations'])
    function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        if (skip.has(name) || name.startsWith('.')) continue
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.(vue|ts|js|mjs)$/.test(name)) clientFiles.push(full)
      }
    }
    walk(ROOT)
    expect(clientFiles.length).toBeGreaterThan(0)

    for (const f of clientFiles) {
      const src = readFileSync(f, 'utf8')
      for (const pat of SECRET_PATTERNS) {
        expect(pat.test(src), `secret pattern ${pat} found in client file ${f}`).toBe(false)
      }
      // Any env reference in client code must be PUBLIC_ / NUXT_PUBLIC_ prefixed.
      const envRefs = src.match(/(?:process\.env|import\.meta\.env)\.([A-Z0-9_]+)/g) ?? []
      for (const ref of envRefs) {
        const name = ref.split('.').pop() as string
        expect(
          /^(PUBLIC_|NUXT_PUBLIC_)/.test(name),
          `client env ${name} in ${f} is not PUBLIC_-prefixed`,
        ).toBe(true)
      }
    }
  })
})
