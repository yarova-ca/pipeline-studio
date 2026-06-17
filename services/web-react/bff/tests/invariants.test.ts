import { describe, it, expect, beforeAll } from 'vitest'

// Server invariant suite for the web-react BFF (Hono).
// Each test maps to one server invariant by I-id.
//
// The BFF verifies bearer tokens with jsonwebtoken using JWT_SECRET / JWT_ISSUER
// / JWT_AUDIENCE from config. We set those env vars BEFORE importing the app so
// config.ts validates cleanly (it calls process.exit(1) on invalid config), then
// mint tokens via the app's own signToken — the exact path the server verifies.

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-32-characters-long-xx'
process.env.JWT_ISSUER = process.env.JWT_ISSUER ?? 'yarova'
process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'yarova-api'
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test'
process.env.RATE_LIMIT = process.env.RATE_LIMIT ?? '10000'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: { request: (input: string, init?: RequestInit) => Promise<Response> }
let signToken: (u: { id: string; email: string; name: string }) => string
let validToken = ''

beforeAll(async () => {
  const mod = await import('../src/index')
  app = mod.app as unknown as typeof app
  signToken = mod.signToken
  validToken = signToken({ id: 'u1', email: 'a@b.co', name: 'Tester' })
}, 60_000)

describe('BFF server invariants', () => {
  // I-3: protected route, no auth → 401
  it('I-3: GET /users/me without Authorization → 401', async () => {
    const res = await app.request('/users/me')
    expect(res.status).toBe(401)
  })

  // I-4: protected route, garbage/tampered token → 401
  it('I-4: GET /users/me with garbage bearer token → 401', async () => {
    const res = await app.request('/users/me', {
      headers: { Authorization: 'Bearer not.a.real.token' },
    })
    expect(res.status).toBe(401)
  })

  it('I-4: GET /users/me with a tampered valid token → 401', async () => {
    // Flip the last char of the signature segment to tamper the signature.
    const parts = validToken.split('.')
    const sig = parts[2]
    const tampered = `${parts[0]}.${parts[1]}.${sig.slice(0, -1)}${sig.endsWith('A') ? 'B' : 'A'}`
    const res = await app.request('/users/me', {
      headers: { Authorization: `Bearer ${tampered}` },
    })
    expect(res.status).toBe(401)
  })

  it('sanity: a valid minted token is accepted on the protected route → 200', async () => {
    const res = await app.request('/users/me', {
      headers: { Authorization: `Bearer ${validToken}` },
    })
    expect(res.status).toBe(200)
  })

  // I-6: POST protected route, valid token + unknown extra field → 400
  it('I-6: POST /users/me with valid token + unknown extra field → 400', async () => {
    const res = await app.request('/users/me', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', isAdmin: true }),
    })
    expect(res.status).toBe(400)
  })

  it('I-6: POST /users/me with valid token + only allowed fields → 200', async () => {
    const res = await app.request('/users/me', {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })
    expect(res.status).toBe(200)
  })

  // I-10: health/liveness route → 200
  it('I-10: GET /health/live → 200', async () => {
    const res = await app.request('/health/live')
    expect(res.status).toBe(200)
  })

  // I-13: /metrics → 200 with a request-duration golden-signal metric
  it('I-13: GET /metrics → 200 and includes http_request_duration_seconds', async () => {
    // Make one request so the duration histogram has been observed at least once.
    await app.request('/health/live')
    const res = await app.request('/metrics')
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('http_request_duration_seconds')
  })

  // I-17: response carries x-content-type-options: nosniff
  it('I-17: responses carry x-content-type-options: nosniff', async () => {
    const res = await app.request('/health/live')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
