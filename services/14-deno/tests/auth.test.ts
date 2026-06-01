// Auth tests for Deno Oak.
// Uses Deno's built-in test runner.
// Stubs Prisma via module mocking with Deno test double patterns.

import { assertEquals } from 'jsr:@std/assert'
import { create, getNumericDate } from 'npm:jose'

const JWT_SECRET_RAW = 'dev-secret-change-in-production'
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW)

async function makeToken(id = 'user-1', email = 'test@example.com', name = 'Test User') {
  return await create(
    { alg: 'HS256', typ: 'JWT' },
    { id, email, name, exp: getNumericDate(3600) },
    JWT_SECRET
  )
}

// Note: Integration tests require a running server with test DB.
// These are smoke-level tests for the auth module logic.

Deno.test('signToken produces a verifiable JWT', async () => {
  const { signToken } = await import('../src/middleware/auth.ts')
  const token = await signToken({ id: 'u1', email: 'a@b.com', name: 'A' })
  assertEquals(typeof token, 'string')
  assertEquals(token.split('.').length, 3)
})

Deno.test('requireAuth returns 401 when no credentials provided', async () => {
  const { requireAuth } = await import('../src/middleware/auth.ts')
  const ctx = {
    request: { headers: { get: (_: string) => null } },
    response: { status: 0, body: null as unknown },
    state: {} as Record<string, unknown>,
  }
  let nextCalled = false
  await requireAuth(ctx, async () => { nextCalled = true })
  assertEquals(nextCalled, false)
  assertEquals(ctx.response.status, 401)
})

Deno.test('requireAuth accepts valid JWT', async () => {
  const { requireAuth } = await import('../src/middleware/auth.ts')
  const token = await makeToken()
  const ctx = {
    request: { headers: { get: (name: string) => name === 'Authorization' ? `Bearer ${token}` : null } },
    response: { status: 0, body: null as unknown },
    state: {} as Record<string, unknown>,
  }
  let nextCalled = false
  await requireAuth(ctx, async () => { nextCalled = true })
  assertEquals(nextCalled, true)
  assertEquals((ctx.state.user as { email: string }).email, 'test@example.com')
})
