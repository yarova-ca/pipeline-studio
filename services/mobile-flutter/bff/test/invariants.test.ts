import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

// ── Hermetic env ────────────────────────────────────────────────────────────
// Set before importing the app so config.ts validates and never process.exit()s.
// NODE_ENV=test also stops src/index.ts from binding a port (see entrypoint
// guard), so the suite drives the app purely through app.fetch().
const JWT_SECRET = 'test-secret-at-least-32-characters-long-xx'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = JWT_SECRET
process.env.JWT_ISSUER = 'yarova'
process.env.JWT_AUDIENCE = 'yarova-api'
process.env.DATABASE_URL = 'postgresql://app:devpassword@localhost:5432/test'

type App = { fetch: (req: Request) => Response | Promise<Response> }
let app: App

function validToken(): string {
  return jwt.sign(
    { id: 'u1', email: 'a@b.com', name: 'Ada' },
    JWT_SECRET,
    { issuer: 'yarova', audience: 'yarova-api', expiresIn: 3600 },
  )
}

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://test.local${path}`, init)
}

beforeAll(async () => {
  // Dynamic import so the env above is in place before config.ts runs.
  app = (await import('../src/index')).app as App
})

describe('bff server invariants', () => {
  // I-3: protected route, no auth header → 401.
  it('I-3: GET /users/me with no auth → 401', async () => {
    const res = await app.fetch(req('/users/me'))
    expect(res.status).toBe(401)
  })

  // I-4: protected route, garbage/tampered token → 401.
  it('I-4: GET /users/me with garbage token → 401', async () => {
    const res = await app.fetch(
      req('/users/me', { headers: { Authorization: 'Bearer not.a.real.jwt' } }),
    )
    expect(res.status).toBe(401)
  })

  it('I-4: GET /users/me with tampered valid token → 401', async () => {
    const good = validToken()
    // Flip the last char of the signature segment to tamper without re-signing.
    const parts = good.split('.')
    parts[2] = parts[2].slice(0, -1) + (parts[2].endsWith('a') ? 'b' : 'a')
    const tampered = parts.join('.')
    const res = await app.fetch(
      req('/users/me', { headers: { Authorization: `Bearer ${tampered}` } }),
    )
    expect(res.status).toBe(401)
  })

  // Sanity: a valid token is accepted, proving 401s above are real, not blanket.
  it('I-3/I-4 control: valid token → 200', async () => {
    const res = await app.fetch(
      req('/users/me', { headers: { Authorization: `Bearer ${validToken()}` } }),
    )
    expect(res.status).toBe(200)
  })

  // I-6: POST protected route, valid token + unknown extra field → 400.
  it('I-6: POST /users/me with unknown extra field → 400', async () => {
    const res = await app.fetch(
      req('/users/me', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Ada', email: 'a@b.com', isAdmin: true }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('I-6 control: POST /users/me with only known fields → 200', async () => {
    const res = await app.fetch(
      req('/users/me', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Ada', email: 'a@b.com' }),
      }),
    )
    expect(res.status).toBe(200)
  })

  // I-10: health/liveness → 200.
  it('I-10: GET /health/live → 200', async () => {
    const res = await app.fetch(req('/health/live'))
    expect(res.status).toBe(200)
  })

  // I-13: /metrics → 200 with the request-duration golden-signal metric.
  it('I-13: GET /metrics → 200 with http_request_duration_seconds', async () => {
    // Drive one request first so the histogram is populated.
    await app.fetch(req('/health/live'))
    const res = await app.fetch(req('/metrics'))
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('http_request_duration_seconds')
  })

  // I-17: every response carries x-content-type-options: nosniff.
  it('I-17: response carries x-content-type-options: nosniff', async () => {
    const res = await app.fetch(req('/health/live'))
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
