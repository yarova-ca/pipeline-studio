// Users route — CRUD for User's items (Fastify adapter).
//
// All routes require authentication (Bearer JWT or X-API-Key).
// Users can only access their own items — enforced by WHERE userId = req.user.id.
//
// GET  /users/me/items       → list all items for current user
// POST /users/me/items       → create a new item
// GET  /users/me/items/:id   → get one item
// PUT  /users/me/items/:id   → update one item
// DELETE /users/me/items/:id → delete one item

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'

export async function usersRoutes(fastify: FastifyInstance) {
  // All routes require auth
  fastify.addHook('preHandler', requireAuth)

  // ── List items ────────────────────────────────────────────────────────────
  fastify.get('/users/me/items', async (req: FastifyRequest, reply: FastifyReply) => {
    const items = await prisma.item.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    })
    reply.send({ items })
  })

  // ── Create item ───────────────────────────────────────────────────────────
  fastify.post('/users/me/items', async (req: FastifyRequest, reply: FastifyReply) => {
    const { title, description } = req.body as { title?: string; description?: string }
    if (!title) {
      reply.status(400).send({ error: 'title is required' })
      return
    }
    const item = await prisma.item.create({
      data: { title, description: description ?? null, userId: req.user!.id },
    })
    reply.status(201).send({ item })
  })

  // ── Get one item ──────────────────────────────────────────────────────────
  fastify.get('/users/me/items/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const item = await prisma.item.findFirst({ where: { id, userId: req.user!.id } })
    if (!item) {
      reply.status(404).send({ error: 'Item not found' })
      return
    }
    reply.send({ item })
  })

  // ── Update item ───────────────────────────────────────────────────────────
  fastify.put('/users/me/items/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const { title, description } = req.body as { title?: string; description?: string }
    const existing = await prisma.item.findFirst({ where: { id, userId: req.user!.id } })
    if (!existing) {
      reply.status(404).send({ error: 'Item not found' })
      return
    }
    const item = await prisma.item.update({
      where: { id },
      data: { ...(title && { title }), ...(description !== undefined && { description }) },
    })
    reply.send({ item })
  })

  // ── Delete item ───────────────────────────────────────────────────────────
  fastify.delete('/users/me/items/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const existing = await prisma.item.findFirst({ where: { id, userId: req.user!.id } })
    if (!existing) {
      reply.status(404).send({ error: 'Item not found' })
      return
    }
    await prisma.item.delete({ where: { id } })
    reply.status(204).send()
  })
}
