import { describe, it, expect, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

// Server invariant suite. Each test maps to one I-id from the service spec.
// The Hono app is exercised in-process via `app.fetch` — no port is bound.
//
// Token minting: a valid token is signed with the EXACT secret, issuer and
// audience the BFF's `verify()` checks (see src/index.ts / src/config.ts).
// The values below are set on process.env BEFORE importing config so the
// app's zod config schema and JWT verification use the same inputs.

const JWT_SECRET = 'test-secret-at-least-32-characters-long-xx'
const JWT_ISSUER = 'yarova'
const JWT_AUDIENCE = 'yarova-api'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = JWT_SECRET
process.env.JWT_ISSUER = JWT_ISSUER
process.env.JWT_AUDIENCE = JWT_AUDIENCE
process.env.DATABASE_URL = 'postgresql://app:test@localhost:5432/test'

function validToken(): string {
  return jwt.sign(
    { id: 'u1', email: 'a@b.com', name: 'Test User' },
    JWT_SECRET,
    { expiresIn: 3600, issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: { fetch: (req: Request) => Promise<Response> }

beforeAll(async () => {
  // Import after env is set so config validation and verify() see test values.
  app = (await import('../src/index')).app
})

const BASE = 'http://localhost'

describe('server invariants', () => {
  it('I-3: protected route with no auth → 401', async () => {
    const res = await app.fetch(new Request(`${BASE}/users/me`))
    expect(res.status).toBe(401)
  })

  it('I-4: protected route with garbage/tampered token → 401', async () => {
    // Tamper: a real token with its last char flipped breaks the signature.
    const good = validToken()
    const tampered = good.slice(0, -1) + (good.endsWith('a') ? 'b' : 'a')

    const garbageRes = await app.fetch(
      new Request(`${BASE}/users/me`, {
        headers: { Authorization: 'Bearer not-a-real-jwt' },
      }),
    )
    const tamperedRes = await app.fetch(
      new Request(`${BASE}/users/me`, {
        headers: { Authorization: `Bearer ${tampered}` },
      }),
    )
    expect(garbageRes.status).toBe(401)
    expect(tamperedRes.status).toBe(401)
  })

  it('I-3 (positive control): valid token reaches the handler → 200', async () => {
    const res = await app.fetch(
      new Request(`${BASE}/users/me`, {
        headers: { Authorization: `Bearer ${validToken()}` },
      }),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { id: string }
    expect(body.id).toBe('u1')
  })

  it('I-6: POST protected route, valid token + unknown extra field → 400', async () => {
    const res = await app.fetch(
      new Request(`${BASE}/users/me`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken()}`,
          'Content-Type': 'application/json',
        },
        // `isAdmin` is an unknown field; the sealed (.strict) schema rejects it.
        body: JSON.stringify({ name: 'New', email: 'new@b.com', isAdmin: true }),
      }),
    )
    expect(res.status).toBe(400)
  })

  it('I-6 (positive control): POST with only known fields → 200', async () => {
    const res = await app.fetch(
      new Request(`${BASE}/users/me`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${validToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New', email: 'new@b.com' }),
      }),
    )
    expect(res.status).toBe(200)
  })

  it('I-10: health/liveness route → 200', async () => {
    const res = await app.fetch(new Request(`${BASE}/health/live`))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('ok')
  })

  it('I-13: /metrics → 200 with a request-duration golden-signal metric', async () => {
    // Drive one request first so the histogram has at least observed a sample.
    await app.fetch(new Request(`${BASE}/health/live`))
    const res = await app.fetch(new Request(`${BASE}/metrics`))
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('http_request_duration_seconds')
  })

  it('I-17: response carries x-content-type-options: nosniff', async () => {
    const res = await app.fetch(new Request(`${BASE}/health/live`))
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
