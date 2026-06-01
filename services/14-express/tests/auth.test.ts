// Auth middleware tests.
// Strategy: mock Prisma so no real DB is needed for CI.
// Prisma mock: jest.mock replaces @prisma/client with a jest.fn() stub.
//
// Tests assert:
//   1. No token → 401
//   2. Invalid JWT → 401
//   3. Valid JWT → 200 + user attached
//   4. Valid API key → 200 + user attached
//   5. Invalid API key → 401

import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/index.js'

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', apiKey: 'yar_testkey123' }

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.apiKey === 'yar_testkey123') return Promise.resolve(mockUser)
          return Promise.resolve(null)
        }),
        upsert: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
    })),
  }
})

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
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Authentication required/)
  })

  it('returns 401 when JWT is invalid', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer bad.token.here')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid JWT', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${validToken}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(mockUser.email)
  })

  it('returns 200 with valid API key', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('X-API-Key', 'yar_testkey123')
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(mockUser.email)
  })

  it('returns 401 with invalid API key', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('X-API-Key', 'yar_invalid')
    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/Invalid API key/)
  })
})
