/**
 * @openapi
 * /users/me/items:
 *   get:
 *     summary: List all items for current user
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Paginated list of items
 *       400:
 *         description: Invalid pagination parameters
 *       401:
 *         description: Not authenticated
 *   post:
 *     summary: Create an item for current user
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 500
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Item created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *
 * /users/me/items/{id}:
 *   get:
 *     summary: Get one item by ID
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 *   put:
 *     summary: Update an item
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 500
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Item updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Item not found
 *   delete:
 *     summary: Delete an item
 *     tags: [users]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
// Users route — CRUD for User's items.
//
// All routes require authentication (Bearer JWT or X-API-Key).
// Users can only access their own items — enforced by WHERE userId = req.user.id.
//
// GET  /users/me/items       → list items (paginated, max 100 per page)
// POST /users/me/items       → create a new item
// GET  /users/me/items/:id   → get one item
// PUT  /users/me/items/:id   → update one item
// DELETE /users/me/items/:id → delete one item

import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth) // all routes in this file require auth

// Fix 8: Zod schemas for input validation — prevent unbounded strings.
const CreateItemSchema = z.object({
  title: z.string().min(1, 'title cannot be empty').max(500, 'title cannot exceed 500 characters'),
  description: z.string().max(2000, 'description cannot exceed 2000 characters').optional(),
})

const UpdateItemSchema = z.object({
  title: z.string().min(1, 'title cannot be empty').max(500, 'title cannot exceed 500 characters').optional(),
  description: z.string().max(2000, 'description cannot exceed 2000 characters').optional(),
})

// ── List items ─────────────────────────────────────────────────────────────
// Fix 11: Paginated response — max 100 per page.
router.get('/me/items', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100)
  const offset = Number(req.query.offset ?? 0)
  if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
    res.status(400).json({ error: 'Invalid pagination parameters' })
    return
  }
  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.item.count({ where: { userId: req.user!.id } }),
  ])
  res.json({ items, total, limit, offset })
})

// ── Create item ────────────────────────────────────────────────────────────
router.post('/me/items', async (req: Request, res: Response) => {
  // Fix 8: Validate + sanitise input with Zod before touching the DB.
  const result = CreateItemSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message })
    return
  }
  const { title, description } = result.data
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
  // Fix 8: Validate update body with Zod.
  const result = UpdateItemSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message })
    return
  }
  const { title, description } = result.data
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
