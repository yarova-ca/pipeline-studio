// Users CRUD route tests for Hono.
// All routes require auth — tests use a valid JWT.
// Prisma is mocked.
//
// Tests assert:
//   GET    /users/me/items       → 200 + items array
//   POST   /users/me/items       → 201 + created item
//   POST   /users/me/items       → 400 when title missing
//   GET    /users/me/items/:id   → 200 + item
//   GET    /users/me/items/:id   → 404 when not found
//   PUT    /users/me/items/:id   → 200 + updated item
//   DELETE /users/me/items/:id   → 204

import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'

// ── Shared test data ───────────────────────────────────────────────────────
const USER_ID = 'user-1'
const ITEM_1 = { id: 'item-1', title: 'First item', description: 'desc', userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }

// ── Mock Prisma ────────────────────────────────────────────────────────────
const mockPrisma = {
  item: {
    findMany: vi.fn().mockResolvedValue([ITEM_1]),
    create: vi.fn().mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'New item' }),
    findFirst: vi.fn().mockImplementation(({ where }: { where: { id: string; userId: string } }) => {
      if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
      return Promise.resolve(null)
    }),
    update: vi.fn().mockResolvedValue({ ...ITEM_1, title: 'Updated' }),
    delete: vi.fn().mockResolvedValue(ITEM_1),
  },
  user: {
    findUnique: vi.fn().mockResolvedValue(null),
    upsert: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}))

const { default: app } = await import('../src/index.js')

// ── Auth token ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const token = jwt.sign({ id: USER_ID, email: 'test@example.com', name: 'Test' }, JWT_SECRET, { expiresIn: '1h' })
const authHeaders = { Authorization: `Bearer ${token}` }

function makeReq(method: string, path: string, body?: object) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: body
      ? { ...authHeaders, 'Content-Type': 'application/json' }
      : authHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GET /users/me/items', () => {
  it('returns 200 with items array', async () => {
    const res = await app.fetch(makeReq('GET', '/users/me/items'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items[0].id).toBe('item-1')
  })
})

describe('POST /users/me/items', () => {
  it('returns 201 with created item', async () => {
    const res = await app.fetch(makeReq('POST', '/users/me/items', { title: 'New item' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.item.title).toBe('New item')
  })

  it('returns 400 when title is missing', async () => {
    const res = await app.fetch(makeReq('POST', '/users/me/items', {}))
    expect(res.status).toBe(400)
  })
})

describe('GET /users/me/items/:id', () => {
  it('returns 200 with the item', async () => {
    const res = await app.fetch(makeReq('GET', '/users/me/items/item-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.id).toBe('item-1')
  })

  it('returns 404 when item does not exist', async () => {
    const res = await app.fetch(makeReq('GET', '/users/me/items/nonexistent'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /users/me/items/:id', () => {
  it('returns 200 with updated item', async () => {
    const res = await app.fetch(makeReq('PUT', '/users/me/items/item-1', { title: 'Updated' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.item.title).toBe('Updated')
  })
})

describe('DELETE /users/me/items/:id', () => {
  it('returns 204 on success', async () => {
    const res = await app.fetch(makeReq('DELETE', '/users/me/items/item-1'))
    expect(res.status).toBe(204)
  })
})
