// Auth tests for Elysia using Bun test runner.

import { describe, it, expect, mock } from 'bun:test'
import jwt from 'jsonwebtoken'

const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', apiKey: 'yar_testkey123' }

mock.module('@prisma/client', () => ({
  PrismaClient: class {
    user = {
      findUnique: ({ where }: { where: { apiKey?: string } }) => {
        if (where.apiKey === 'yar_testkey123') return Promise.resolve(mockUser)
        return Promise.resolve(null)
      },
      upsert: () => Promise.resolve(mockUser),
      update: () => Promise.resolve(mockUser),
    }
    item = { findMany: () => Promise.resolve([]), create: () => Promise.resolve({}), findFirst: () => Promise.resolve(null), update: () => Promise.resolve({}), delete: () => Promise.resolve({}) }
  },
}))

const { app } = await import('../src/index.js')

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const validToken = jwt.sign(
  { id: mockUser.id, email: mockUser.email, name: mockUser.name },
  JWT_SECRET,
  { expiresIn: '1h' }
)

function makeReq(headers: Record<string, string>) {
  return new Request('http://localhost/auth/me', { headers })
}

describe('GET /auth/me — requireAuth', () => {
  it('returns 401 when no auth provided', async () => {
    const res = await app.handle(makeReq({}))
    expect(res.status).toBe(401)
  })

  it('returns 401 when JWT is invalid', async () => {
    const res = await app.handle(makeReq({ Authorization: 'Bearer bad.token' }))
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid JWT', async () => {
    const res = await app.handle(makeReq({ Authorization: `Bearer ${validToken}` }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe(mockUser.email)
  })

  it('returns 200 with valid API key', async () => {
    const res = await app.handle(makeReq({ 'X-API-Key': 'yar_testkey123' }))
    expect(res.status).toBe(200)
  })

  it('returns 401 with invalid API key', async () => {
    const res = await app.handle(makeReq({ 'X-API-Key': 'yar_invalid' }))
    expect(res.status).toBe(401)
  })
})
