import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

// ─────────────────────────────────────────────────────────────────────────────
// Yarova platform runtime invariants — edge-hono (Tier-A EDGE server).
//
// Each test maps to one platform invariant by I-id. The app is driven
// in-process via `app.request(new Request(...))`, the same Hono fetch handler
// the Worker/Node server serves in production. No real socket is opened.
//
// The config module (src/config.ts) validates process.env at import and calls
// process.exit(1) on failure. So required env MUST be set before the app is
// imported. vitest sets NODE_ENV=test, which also keeps start() from binding a
// port (see src/index.ts). We set the rest here, then dynamically import.
// ─────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-secret-at-least-32-characters-long-aaaa'
const JWT_ISSUER = 'yarova'
const JWT_AUDIENCE = 'yarova-api'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = JWT_SECRET
process.env.JWT_ISSUER = JWT_ISSUER
process.env.JWT_AUDIENCE = JWT_AUDIENCE
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://app:devpassword@localhost:5432/test_dev'

// Loaded in beforeAll, after env is set, so config validation passes.
let app: { request: (input: Request | string, init?: RequestInit) => Promise<Response> }

// Mint a valid token EXACTLY how the auth middleware verifies it: same secret,
// same issuer, same audience. Anything else fails jwt.verify and is rejected.
function validToken(): string {
  return jwt.sign(
    { id: 'u_1', email: 'rohith@yarova.ca', name: 'Rohith' },
    JWT_SECRET,
    { expiresIn: 3600, issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
  )
}

beforeAll(async () => {
  const mod = await import('./index')
  app = mod.app as typeof app
})

// I-3 — a protected route with NO Authorization header is rejected with 401.
describe('I-3: protected route rejects missing auth', () => {
  it('GET /users/me with no Authorization header → 401', async () => {
    const res = await app.request(new Request('http://local/users/me'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })
})

// I-4 — a protected route with a garbage/tampered bearer token is rejected 401.
describe('I-4: protected route rejects tampered token', () => {
  it('GET /users/me with a garbage Bearer token → 401', async () => {
    const res = await app.request(
      new Request('http://local/users/me', {
        headers: { Authorization: 'Bearer not.a.real.jwt' },
      }),
    )
    expect(res.status).toBe(401)
  })

  it('GET /users/me with a token signed by the wrong secret → 401', async () => {
    const forged = jwt.sign({ id: 'u_x', email: 'e', name: 'n' }, 'wrong-secret-wrong-secret-wrong-secret', {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    const res = await app.request(
      new Request('http://local/users/me', {
        headers: { Authorization: `Bearer ${forged}` },
      }),
    )
    expect(res.status).toBe(401)
  })
})

// I-6 — POST to a protected route with a VALID token + an unknown extra JSON
// field is rejected with 400. The body schema is zod `.strict()`, so unknown
// fields fail closed. A valid body still succeeds (control case).
describe('I-6: protected mutation rejects unknown fields', () => {
  it('POST /users/profile with an unknown field → 400', async () => {
    const res = await app.request(
      new Request('http://local/users/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Rohith', is_admin: true }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('POST /users/profile with a valid body → 200 (control case)', async () => {
    const res = await app.request(
      new Request('http://local/users/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Rohith', bio: 'builds for ND brains' }),
      }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Rohith')
  })

  it('POST /users/profile with an unknown field but NO token → 401 (auth runs first)', async () => {
    const res = await app.request(
      new Request('http://local/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'x', is_admin: true }),
      }),
    )
    expect(res.status).toBe(401)
  })
})

// I-10 — liveness probe returns 200.
describe('I-10: liveness endpoint', () => {
  it('GET /health/live → 200', async () => {
    const res = await app.request(new Request('http://local/health/live'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })
})

// I-13 — golden-signal observability endpoint.
//
// edge-hono runs on @hono/node-server with prom-client, so it serves a REAL
// Prometheus /metrics pull endpoint — I-13 is satisfied directly, not adapted.
// The request-duration golden-signal histogram is named
// `http_request_duration_seconds`. We hit a route first so a sample exists,
// then assert the metric is present in the scrape body.
describe('I-13: metrics endpoint exposes request-duration golden signal', () => {
  it('GET /metrics → 200 and body contains http_request_duration_seconds', async () => {
    // Generate at least one observed request so the histogram has a sample.
    await app.request(new Request('http://local/health/live'))

    const res = await app.request(new Request('http://local/metrics'))
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('http_request_duration_seconds')
    // Histogram exposes _bucket/_count/_sum series in Prometheus text format.
    expect(body).toContain('http_request_duration_seconds_count')
  })
})

// I-17 — responses carry the nosniff security header.
describe('I-17: security headers present', () => {
  it('response carries x-content-type-options: nosniff', async () => {
    const res = await app.request(new Request('http://local/health/live'))
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('the nosniff header is also present on a 401 response', async () => {
    const res = await app.request(new Request('http://local/users/me'))
    expect(res.status).toBe(401)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
