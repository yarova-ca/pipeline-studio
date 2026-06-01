// Users CRUD route tests for Bun native server.
// Uses Bun's built-in test runner.
// Mocks Prisma using module-level substitution.

import { describe, it, expect, mock } from 'bun:test'
import jwt from 'jsonwebtoken'

// ── Shared test data ───────────────────────────────────────────────────────
const USER_ID = 'user-1'
const ITEM_1 = { id: 'item-1', title: 'First item', description: 'desc', userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }

// ── Mock Prisma ────────────────────────────────────────────────────────────
mock.module('@prisma/client', () => ({
  PrismaClient: class {
    item = {
      findMany: () => Promise.resolve([ITEM_1]),
      create: () => Promise.resolve({ ...ITEM_1, id: 'item-new', title: 'New item' }),
      findFirst: ({ where }: { where: { id: string; userId: string } }) => {
        if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
        return Promise.resolve(null)
      },
      update: () => Promise.resolve({ ...ITEM_1, title: 'Updated' }),
      delete: () => Promise.resolve(ITEM_1),
    }
    user = {
      findUnique: () => Promise.resolve(null),
      upsert: () => Promise.resolve(null),
      update: () => Promise.resolve(null),
    }
  },
}))

const { server } = await import('../src/index.js')

// ── Auth token ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const token = jwt.sign({ id: USER_ID, email: 'test@example.com', name: 'Test' }, JWT_SECRET, { expiresIn: '1h' })
const base = `http://localhost:${server.port}`
const auth = { Authorization: `Bearer ${token}` }

function makeReq(method: string, path: string, body?: object): RequestInit {
  return {
    method,
    headers: body ? { ...auth, 'Content-Type': 'application/json' } : auth,
    body: body ? JSON.stringify(body) : undefined,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('GET /users/me/items', () => {
  it('returns 200 with items array', async () => {
    const res = await fetch(`${base}/users/me/items`, makeReq('GET', '/users/me/items'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items[0].id).toBe('item-1')
  })
})

describe('POST /users/me/items', () => {
  it('returns 201 with created item', async () => {
    const res = await fetch(`${base}/users/me/items`, makeReq('POST', '/users/me/items', { title: 'New item' }))
    expect(res.status).toBe(201)
    expect((await res.json()).item.title).toBe('New item')
  })

  it('returns 400 when title is missing', async () => {
    const res = await fetch(`${base}/users/me/items`, makeReq('POST', '/users/me/items', {}))
    expect(res.status).toBe(400)
  })
})

describe('GET /users/me/items/:id', () => {
  it('returns 200 with the item', async () => {
    const res = await fetch(`${base}/users/me/items/item-1`, makeReq('GET', '/users/me/items/item-1'))
    expect(res.status).toBe(200)
    expect((await res.json()).item.id).toBe('item-1')
  })

  it('returns 404 when item does not exist', async () => {
    const res = await fetch(`${base}/users/me/items/nonexistent`, makeReq('GET', '/users/me/items/nonexistent'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /users/me/items/:id', () => {
  it('returns 200 with updated item', async () => {
    const res = await fetch(`${base}/users/me/items/item-1`, makeReq('PUT', '/users/me/items/item-1', { title: 'Updated' }))
    expect(res.status).toBe(200)
    expect((await res.json()).item.title).toBe('Updated')
  })
})

describe('DELETE /users/me/items/:id', () => {
  it('returns 204 on success', async () => {
    const res = await fetch(`${base}/users/me/items/item-1`, makeReq('DELETE', '/users/me/items/item-1'))
    expect(res.status).toBe(204)
  })
})
