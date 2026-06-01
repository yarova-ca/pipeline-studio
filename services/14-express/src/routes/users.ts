// Users route — CRUD for User's items.
//
// All routes require authentication (Bearer JWT or X-API-Key).
// Users can only access their own items — enforced by WHERE userId = req.user.id.
//
// GET  /users/me/items       → list all items for current user
// POST /users/me/items       → create a new item
// GET  /users/me/items/:id   → get one item
// PUT  /users/me/items/:id   → update one item
// DELETE /users/me/items/:id → delete one item

import { Router, type Request, type Response } from 'express'
import { prisma } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth) // all routes in this file require auth

// ── List items ─────────────────────────────────────────────────────────────
router.get('/me/items', async (req: Request, res: Response) => {
  const items = await prisma.item.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ items })
})

// ── Create item ────────────────────────────────────────────────────────────
router.post('/me/items', async (req: Request, res: Response) => {
  const { title, description } = req.body as { title?: string; description?: string }
  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const item = await prisma.item.create({
    data: { title, description: description ?? null, userId: req.user!.id },
  })
  res.status(201).json({ item })
})

// ── Get one item ───────────────────────────────────────────────────────────
router.get('/me/items/:id', async (req: Request, res: Response) => {
  const item = await prisma.item.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!item) {
    res.status(404).json({ error: 'Item not found' })
    return
  }
  res.json({ item })
})

// ── Update item ────────────────────────────────────────────────────────────
router.put('/me/items/:id', async (req: Request, res: Response) => {
  const { title, description } = req.body as { title?: string; description?: string }
  const existing = await prisma.item.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!existing) {
    res.status(404).json({ error: 'Item not found' })
    return
  }
  const item = await prisma.item.update({
    where: { id: req.params.id },
    data: { ...(title && { title }), ...(description !== undefined && { description }) },
  })
  res.json({ item })
})

// ── Delete item ────────────────────────────────────────────────────────────
router.delete('/me/items/:id', async (req: Request, res: Response) => {
  const existing = await prisma.item.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  })
  if (!existing) {
    res.status(404).json({ error: 'Item not found' })
    return
  }
  await prisma.item.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

export default router
