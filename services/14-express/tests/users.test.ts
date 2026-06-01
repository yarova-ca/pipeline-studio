// Users CRUD route tests.
// All routes require auth — tests use a valid JWT for all requests.
// Prisma is mocked — no real DB needed in CI.
//
// Tests assert:
//   GET    /users/me/items       → 200 + items array
//   POST   /users/me/items       → 201 + created item
//   POST   /users/me/items       → 400 when title missing
//   GET    /users/me/items/:id   → 200 + item
//   GET    /users/me/items/:id   → 404 when not found
//   PUT    /users/me/items/:id   → 200 + updated item
//   DELETE /users/me/items/:id   → 204

import request from 'supertest'
import jwt from 'jsonwebtoken'
import app from '../src/index.js'

// ── Shared test data ───────────────────────────────────────────────────────
const USER_ID = 'user-1'
const ITEM_1 = { id: 'item-1', title: 'First item', description: 'desc', userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  item: {
    findMany: jest.fn().mockResolvedValue([ITEM_1]),
    create: jest.fn().mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'New item' }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
      return Promise.resolve(null)
    }),
    update: jest.fn().mockResolvedValue({ ...ITEM_1, title: 'Updated' }),
    delete: jest.fn().mockResolvedValue(ITEM_1),
  },
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}))

// ── Auth token ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const token = jwt.sign({ id: USER_ID, email: 'test@example.com', name: 'Test' }, JWT_SECRET, { expiresIn: '1h' })
const auth = { Authorization: `Bearer ${token}` }

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GET /users/me/items', () => {
  it('returns 200 with items array', async () => {
    const res = await request(app).get('/users/me/items').set(auth)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.items[0].id).toBe('item-1')
  })
})

describe('POST /users/me/items', () => {
  it('returns 201 with created item', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({ title: 'New item' })
    expect(res.status).toBe(201)
    expect(res.body.item.title).toBe('New item')
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/title/)
  })
})

describe('GET /users/me/items/:id', () => {
  it('returns 200 with the item', async () => {
    const res = await request(app).get('/users/me/items/item-1').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.item.id).toBe('item-1')
  })

  it('returns 404 when item does not exist', async () => {
    const res = await request(app).get('/users/me/items/nonexistent').set(auth)
    expect(res.status).toBe(404)
  })
})

describe('PUT /users/me/items/:id', () => {
  it('returns 200 with updated item', async () => {
    const res = await request(app).put('/users/me/items/item-1').set(auth).send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.item.title).toBe('Updated')
  })
})

describe('DELETE /users/me/items/:id', () => {
  it('returns 204 on success', async () => {
    const res = await request(app).delete('/users/me/items/item-1').set(auth)
    expect(res.status).toBe(204)
  })
})
