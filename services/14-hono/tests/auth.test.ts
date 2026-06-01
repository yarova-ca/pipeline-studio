// Auth middleware tests for Hono.
// Strategy: mock Prisma so no real DB is needed for CI.
// Uses Hono's built-in testClient via fetch.
//
// Tests assert:
//   1. No token → 401
//   2. Invalid JWT → 401
//   3. Valid JWT → 200 + user attached
//   4. Valid API key → 200 + user attached
//   5. Invalid API key → 401

import { describe, it, expect, vi, beforeAll } from 'vitest'
import jwt from 'jsonwebtoken'

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', apiKey: 'yar_testkey123' }

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { apiKey?: string } }) => {
        if (where.apiKey === 'yar_testkey123') return Promise.resolve(mockUser)
        return Promise.resolve(null)
      }),
      upsert: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue(mockUser),
    },
  })),
}))

// Import app after mocks are set up
const { default: app } = await import('../src/index.js')

// ── Test JWT ───────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const validToken = jwt.sign(
  { id: mockUser.id, email: mockUser.email, name: mockUser.name },
  JWT_SECRET,
  { expiresIn: '1h' }
)

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GET /auth/me — requireAuth middleware', () => {
  it('returns 401 when no auth provided', async () => {
    const res = await app.fetch(new Request('http://localhost/auth/me'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/Authentication required/)
  })

  it('returns 401 when JWT is invalid', async () => {
    const res = await app.fetch(new Request('http://localhost/auth/me', {
      headers: { Authorization: 'Bearer bad.token.here' },
    }))
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid JWT', async () => {
    const res = await app.fetch(new Request('http://localhost/auth/me', {
      headers: { Authorization: `Bearer ${validToken}` },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe(mockUser.email)
  })

  it('returns 200 with valid API key', async () => {
    const res = await app.fetch(new Request('http://localhost/auth/me', {
      headers: { 'X-API-Key': 'yar_testkey123' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe(mockUser.email)
  })

  it('returns 401 with invalid API key', async () => {
    const res = await app.fetch(new Request('http://localhost/auth/me', {
      headers: { 'X-API-Key': 'yar_invalid' },
    }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid API key/)
  })
})
