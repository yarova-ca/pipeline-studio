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

// ── Shared test data ───────────────────────────────────────────────────────
const USER_ID = 'user-1'
const ITEM_1 = { id: 'item-1', title: 'First item', description: 'desc', userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }

// ── Mock Prisma ────────────────────────────────────────────────────────────
// mockPrisma is declared here so tests can call .mockResolvedValue() on it.
// The factory must NOT reference this variable because jest.mock() is hoisted
// before const declarations. Instead, the factory builds its own mock and
// assigns to this variable so tests can access the same mock instances.
let mockPrisma: ReturnType<typeof buildMockPrisma>

function buildMockPrisma() {
  return {
    item: {
      findMany: jest.fn().mockResolvedValue([ITEM_1]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'New item' }),
      findFirst: jest.fn().mockImplementation(({ where }: { where: { id: string; userId: string } }) => {
        if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
        return Promise.resolve(null)  // non-existent items return null
      }),
      update: jest.fn().mockResolvedValue({ ...ITEM_1, title: 'Updated' }),
      delete: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === 'item-1') return Promise.resolve(ITEM_1)
        return Promise.resolve(null)
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  }
}

jest.mock('@prisma/client', () => {
  // Build a fresh instance; assign to outer let so tests can access mock fns.
  // Note: ITEM_1 / USER_ID are module-level consts — they ARE accessible here
  // because the factory only runs once when the module is first required, which
  // is after the const initialisation order in Jest's CommonJS transform.
  const instance = {
    item: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'item-1', title: 'First item', description: 'desc', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
      ]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue({ id: 'item-new', title: 'New item', description: 'desc', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }),
      findFirst: jest.fn().mockImplementation(({ where }: { where: { id: string; userId: string } }) => {
        if (where.id === 'item-1' && where.userId === 'user-1') {
          return Promise.resolve({ id: 'item-1', title: 'First item', description: 'desc', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() })
        }
        return Promise.resolve(null)
      }),
      update: jest.fn().mockResolvedValue({ id: 'item-1', title: 'Updated', description: 'desc', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }),
      delete: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === 'item-1') return Promise.resolve({ id: 'item-1' })
        return Promise.resolve(null)
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).__mockPrismaInstance = instance
  return {
    PrismaClient: jest.fn().mockImplementation(() => instance),
  }
})

import app from '../src/index.js'

// Grab the shared mock instance so tests can call .mockResolvedValue() on it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockPrisma = (global as any).__mockPrismaInstance

// ── Auth token ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-that-is-at-least-32-chars-long'
const token = jwt.sign({ id: USER_ID, email: 'test@example.com', name: 'Test' }, JWT_SECRET, { expiresIn: '1h' })
const auth = { Authorization: `Bearer ${token}` }

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GET /users/me/items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findMany.mockResolvedValue([ITEM_1])
    mockPrisma.item.count.mockResolvedValue(1)
  })

  it('returns 200 with items array', async () => {
    const res = await request(app).get('/users/me/items').set(auth)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body.items[0].id).toBe('item-1')
  })
})

describe('POST /users/me/items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.create.mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'New item' })
  })

  it('returns 201 with created item', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({ title: 'New item' })
    expect(res.status).toBe(201)
    expect(res.body.item.title).toBe('New item')
  })

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })
})

describe('GET /users/me/items/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findFirst.mockImplementation(({ where }: { where: { id: string; userId: string } }) => {
      if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
      return Promise.resolve(null)
    })
  })

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
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findFirst.mockResolvedValue(ITEM_1)
    mockPrisma.item.update.mockResolvedValue({ ...ITEM_1, title: 'Updated' })
  })

  it('returns 200 with updated item', async () => {
    const res = await request(app).put('/users/me/items/item-1').set(auth).send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.item.title).toBe('Updated')
  })
})

describe('DELETE /users/me/items/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findFirst.mockImplementation(({ where }: { where: { id: string; userId: string } }) => {
      if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
      return Promise.resolve(null)
    })
    mockPrisma.item.delete.mockResolvedValue(ITEM_1)
  })

  it('returns 204 on success', async () => {
    const res = await request(app).delete('/users/me/items/item-1').set(auth)
    expect(res.status).toBe(204)
  })
})

describe('POST /users/me/items — validation edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.create.mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'New item' })
  })

  it('returns 400 when title is empty string', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({ title: '' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when title exceeds 500 characters', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({ title: 'a'.repeat(501) })
    expect(res.status).toBe(400)
  })

  it('returns 201 when title is exactly 500 characters', async () => {
    mockPrisma.item.create.mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'a'.repeat(500) })
    const res = await request(app).post('/users/me/items').set(auth).send({ title: 'a'.repeat(500) })
    expect(res.status).toBe(201)
  })

  it('returns 400 when description exceeds 2000 characters', async () => {
    const res = await request(app).post('/users/me/items').set(auth).send({ title: 'ok', description: 'x'.repeat(2001) })
    expect(res.status).toBe(400)
  })
})

describe('GET /users/me/items — pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findMany.mockResolvedValue([ITEM_1])
    mockPrisma.item.count.mockResolvedValue(1)
  })

  it('returns items with pagination metadata', async () => {
    const res = await request(app).get('/users/me/items?limit=5&offset=0').set(auth)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('total')
    expect(res.body).toHaveProperty('limit', 5)
    expect(res.body).toHaveProperty('offset', 0)
  })

  it('caps limit at 100', async () => {
    const res = await request(app).get('/users/me/items?limit=999').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.limit).toBe(100)
  })

  it('returns 400 for negative offset', async () => {
    const res = await request(app).get('/users/me/items?offset=-1').set(auth)
    expect(res.status).toBe(400)
  })
})

describe('GET /users/me/items/:id — not found', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findFirst.mockResolvedValue(null)
  })

  it('returns 404 when item does not exist', async () => {
    const res = await request(app).get('/users/me/items/nonexistent-id').set(auth)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /users/me/items/:id — not found', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.item.findFirst.mockResolvedValue(null)
  })

  it('returns 404 when item does not exist', async () => {
    const res = await request(app).delete('/users/me/items/nonexistent-id').set(auth)
    expect(res.status).toBe(404)
  })
})

describe('POST /auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when no Bearer token provided', async () => {
    const res = await request(app).post('/auth/refresh')
    expect(res.status).toBe(401)
  })

  it('returns new token when valid token provided', async () => {
    const res = await request(app).post('/auth/refresh').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })
})
