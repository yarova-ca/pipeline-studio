// Users route for Hono — CRUD for User's items.
//
// All routes require authentication (Bearer JWT or X-API-Key).
// Users can only access their own items.
//
// GET    /users/me/items       → list all items
// POST   /users/me/items       → create a new item
// GET    /users/me/items/:id   → get one item
// PUT    /users/me/items/:id   → update one item
// DELETE /users/me/items/:id   → delete one item

import type { Context } from 'hono'
import { Hono } from 'hono'
import { prisma } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'

const router = new Hono()

// All routes in this router require auth
router.use('/users/*', requireAuth)

// ── List items ─────────────────────────────────────────────────────────────
router.get('/users/me/items', async (c: Context) => {
  const user = c.get('user')
  const items = await prisma.item.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ items })
})

// ── Create item ────────────────────────────────────────────────────────────
router.post('/users/me/items', async (c: Context) => {
  const user = c.get('user')
  const body = await c.req.json<{ title?: string; description?: string }>()
  if (!body.title) return c.json({ error: 'title is required' }, 400)

  const item = await prisma.item.create({
    data: { title: body.title, description: body.description ?? null, userId: user.id },
  })
  return c.json({ item }, 201)
})

// ── Get one item ───────────────────────────────────────────────────────────
router.get('/users/me/items/:id', async (c: Context) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const item = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!item) return c.json({ error: 'Item not found' }, 404)
  return c.json({ item })
})

// ── Update item ────────────────────────────────────────────────────────────
router.put('/users/me/items/:id', async (c: Context) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const body = await c.req.json<{ title?: string; description?: string }>()
  const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!existing) return c.json({ error: 'Item not found' }, 404)

  const item = await prisma.item.update({
    where: { id },
    data: { ...(body.title && { title: body.title }), ...(body.description !== undefined && { description: body.description }) },
  })
  return c.json({ item })
})

// ── Delete item ────────────────────────────────────────────────────────────
router.delete('/users/me/items/:id', async (c: Context) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!existing) return c.json({ error: 'Item not found' }, 404)

  await prisma.item.delete({ where: { id } })
  return new Response(null, { status: 204 })
})

export default router
