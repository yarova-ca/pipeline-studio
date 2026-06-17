// Yarova platform invariant suite for the GraphQL Yoga protocol server.
//
// Each test maps to a runtime invariant by I-id. The server speaks GraphQL over
// HTTP, so auth/validation invariants are asserted at the protocol level:
//   - auth = a protected GraphQL operation rejected without a valid token
//   - input validation = the GraphQL schema rejecting an unknown field
//
// The suite boots the real exported `server` on an ephemeral port and drives it
// over real HTTP. The JWT is minted exactly how the server verifies it.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { AddressInfo } from 'node:net'

// I-1 requires JWT_SECRET >= 32 chars. Set it BEFORE importing the server, since
// src/middleware/auth.ts reads process.env.JWT_SECRET at module load.
const TEST_SECRET = 'test-secret-value-that-is-long-enough-32+'
process.env.JWT_SECRET = TEST_SECRET
process.env.NODE_ENV = 'test'

// Imported after the secret is set.
import { server } from '../src/index'
import { signToken } from '../src/middleware/auth'

let baseUrl = ''

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

// Minted exactly how the server verifies it: HS256 over JWT_SECRET.
const validToken = () =>
  signToken({ id: 'u1', email: 'u1@yarova.ca', name: 'User One' })

async function gql(query: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ query }),
  })
  const body = await res.json()
  return { res, body }
}

describe('Yoga GraphQL protocol invariants', () => {
  // I-3: auth required — a protected operation without a token is rejected.
  it('I-3: `me` query without a token returns an UNAUTHENTICATED GraphQL error', async () => {
    const { body } = await gql('{ me { id } }')
    expect(body.data?.me ?? null).toBeNull()
    expect(body.errors, 'expected a GraphQL error').toBeTruthy()
    const codes = body.errors.map((e: any) => e.extensions?.code)
    expect(codes).toContain('UNAUTHENTICATED')
  })

  // I-3 positive control: a valid token resolves the protected operation.
  it('I-3: `me` query WITH a valid token resolves the user (no auth error)', async () => {
    const { body } = await gql('{ me { id email name } }', {
      authorization: `Bearer ${validToken()}`,
    })
    expect(body.errors ?? null).toBeNull()
    expect(body.data.me.id).toBe('u1')
  })

  // I-4: bad token rejected — a garbage/tampered token is rejected the same way
  // as no token at all (verifyToken returns null -> ctx.user null -> UNAUTHENTICATED).
  it('I-4: `me` query with a garbage Bearer token returns UNAUTHENTICATED', async () => {
    const { body } = await gql('{ me { id } }', {
      authorization: 'Bearer not.a.real.jwt',
    })
    expect(body.data?.me ?? null).toBeNull()
    const codes = body.errors.map((e: any) => e.extensions?.code)
    expect(codes).toContain('UNAUTHENTICATED')
  })

  // I-4: a token signed with the WRONG secret must also be rejected.
  it('I-4: a token signed with the wrong secret is rejected as UNAUTHENTICATED', async () => {
    const jwt = (await import('jsonwebtoken')).default
    const forged = jwt.sign({ id: 'evil', email: 'e@e', name: 'e' }, 'a-totally-different-secret-32-characters!')
    const { body } = await gql('{ me { id } }', { authorization: `Bearer ${forged}` })
    expect(body.data?.me ?? null).toBeNull()
    const codes = body.errors.map((e: any) => e.extensions?.code)
    expect(codes).toContain('UNAUTHENTICATED')
  })

  // I-6: input validation — the GraphQL type system rejects an unknown field.
  // Protocol equivalent of "unknown field in an input type is a validation error".
  it('I-6: selecting an unknown field is a GraphQL validation error (no data)', async () => {
    const { body } = await gql('{ me { id totallyNotAField } }', {
      authorization: `Bearer ${validToken()}`,
    })
    expect(body.data ?? null).toBeNull()
    expect(body.errors, 'expected a validation error').toBeTruthy()
    const msg = body.errors.map((e: any) => e.message).join(' ')
    expect(msg).toMatch(/totallyNotAField/)
  })

  // I-6: a malformed (unparseable) GraphQL document is rejected, not executed.
  it('I-6: a syntactically invalid query is rejected with a GraphQL error', async () => {
    const { body } = await gql('{ me { id ')
    expect(body.data ?? null).toBeNull()
    expect(body.errors).toBeTruthy()
  })

  // I-10: liveness — GET /health/live returns 200.
  it('I-10: GET /health/live returns 200', async () => {
    const res = await fetch(`${baseUrl}/health/live`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  // I-13: metrics — GET /metrics returns 200 with the request-duration golden signal.
  it('I-13: GET /metrics returns 200 with http_request_duration_seconds', async () => {
    const res = await fetch(`${baseUrl}/metrics`)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('http_request_duration_seconds')
  })

  // I-17: security headers — responses carry x-content-type-options: nosniff.
  it('I-17: HTTP responses carry x-content-type-options: nosniff', async () => {
    const res = await fetch(`${baseUrl}/health/live`)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
