// Users route smoke tests for Deno.
// Tests the auth gate — full CRUD tests require a DB.

import { assertEquals } from 'jsr:@std/assert'
import { create, getNumericDate } from 'npm:jose'

const JWT_SECRET = new TextEncoder().encode('dev-secret-change-in-production')

async function makeToken() {
  return await create(
    { alg: 'HS256', typ: 'JWT' },
    { id: 'user-1', email: 'test@example.com', name: 'Test', exp: getNumericDate(3600) },
    JWT_SECRET
  )
}

Deno.test('requireAuth rejects unauthenticated users route access', async () => {
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

Deno.test('requireAuth allows valid JWT to pass through', async () => {
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
})
