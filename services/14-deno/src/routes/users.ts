// Users routes for Deno Oak — CRUD for User's items.
//
// All routes require authentication.
//
// GET    /users/me/items       → list all items
// POST   /users/me/items       → create a new item
// GET    /users/me/items/:id   → get one item
// PUT    /users/me/items/:id   → update one item
// DELETE /users/me/items/:id   → delete one item

import { Router } from '@oak/oak'
import { prisma } from '../db/client.ts'
import { requireAuth } from '../middleware/auth.ts'

const router = new Router()

// ── List items ─────────────────────────────────────────────────────────────
router.get('/users/me/items', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  const items = await prisma.item.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  ctx.response.body = { items }
})

// ── Create item ────────────────────────────────────────────────────────────
router.post('/users/me/items', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  const body = (await ctx.request.body.json()) as { title?: string; description?: string }
  if (!body.title) {
    ctx.response.status = 400
    ctx.response.body = { error: 'title is required' }
    return
  }
  const item = await prisma.item.create({
    data: { title: body.title, description: body.description ?? null, userId: user.id },
  })
  ctx.response.status = 201
  ctx.response.body = { item }
})

// ── Get one item ───────────────────────────────────────────────────────────
router.get('/users/me/items/:id', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  const id = ctx.params.id
  const item = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!item) {
    ctx.response.status = 404
    ctx.response.body = { error: 'Item not found' }
    return
  }
  ctx.response.body = { item }
})

// ── Update item ────────────────────────────────────────────────────────────
router.put('/users/me/items/:id', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  const id = ctx.params.id
  const body = (await ctx.request.body.json()) as { title?: string; description?: string }
  const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!existing) {
    ctx.response.status = 404
    ctx.response.body = { error: 'Item not found' }
    return
  }
  const item = await prisma.item.update({
    where: { id },
    data: { ...(body.title && { title: body.title }), ...(body.description !== undefined && { description: body.description }) },
  })
  ctx.response.body = { item }
})

// ── Delete item ────────────────────────────────────────────────────────────
router.delete('/users/me/items/:id', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  const id = ctx.params.id
  const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
  if (!existing) {
    ctx.response.status = 404
    ctx.response.body = { error: 'Item not found' }
    return
  }
  await prisma.item.delete({ where: { id } })
  ctx.response.status = 204
})

export default router
