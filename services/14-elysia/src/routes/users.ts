// Users routes for Elysia — CRUD for User's items.
//
// All routes resolve the auth user first.
//
// GET    /users/me/items       → list all items
// POST   /users/me/items       → create a new item
// GET    /users/me/items/:id   → get one item
// PUT    /users/me/items/:id   → update one item
// DELETE /users/me/items/:id   → delete one item

import { Elysia } from 'elysia'
import { prisma } from '../db/client.js'
import { resolveUser } from '../middleware/auth.js'

export const usersRoutes = new Elysia()
  .get('/users/me/items', async ({ headers }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    const items = await prisma.item.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return { items }
  })

  .post('/users/me/items', async ({ headers, body }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    const { title, description } = body as { title?: string; description?: string }
    if (!title) return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 })
    const item = await prisma.item.create({
      data: { title, description: description ?? null, userId: user.id },
    })
    return new Response(JSON.stringify({ item }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  })

  .get('/users/me/items/:id', async ({ headers, params }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    const { id } = params as { id: string }
    const item = await prisma.item.findFirst({ where: { id, userId: user.id } })
    if (!item) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404 })
    return { item }
  })

  .put('/users/me/items/:id', async ({ headers, params, body }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    const { id } = params as { id: string }
    const { title, description } = body as { title?: string; description?: string }
    const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
    if (!existing) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404 })
    const item = await prisma.item.update({
      where: { id },
      data: { ...(title && { title }), ...(description !== undefined && { description }) },
    })
    return { item }
  })

  .delete('/users/me/items/:id', async ({ headers, params }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    const { id } = params as { id: string }
    const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
    if (!existing) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404 })
    await prisma.item.delete({ where: { id } })
    return new Response(null, { status: 204 })
  })
