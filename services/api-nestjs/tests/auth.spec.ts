// Auth tests for NestJS.
// Tests the AuthGuard using NestJS testing module.
// Prisma is mocked via jest.mock.

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import jwt from 'jsonwebtoken'
import { AppModule } from '../src/app.module'

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User', apiKey: 'yar_testkey123' }

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { apiKey?: string; id?: string } }) => {
        if (where.apiKey === 'yar_testkey123') return Promise.resolve(mockUser)
        if (where.id === 'user-1') return Promise.resolve(mockUser)
        return Promise.resolve(null)
      }),
      upsert: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
    item: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'item-1', title: 'Test', userId: 'user-1' }),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  })),
}))

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const validToken = jwt.sign({ id: mockUser.id, email: mockUser.email, name: mockUser.name }, JWT_SECRET, { expiresIn: '1h' })

describe('GET /auth/me — AuthGuard', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    await app.init()
  })

  afterAll(() => app.close())

  it('returns 401 when no auth provided', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 when JWT is invalid', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer bad.token')
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid JWT', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${validToken}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(mockUser.email)
  })

  it('returns 200 with valid API key', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me').set('X-API-Key', 'yar_testkey123')
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(mockUser.email)
  })

  it('returns 401 with invalid API key', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me').set('X-API-Key', 'yar_invalid')
    expect(res.status).toBe(401)
  })
})
