// Users routes for Bun native server — CRUD for User's items.
//
// All routes require authentication.
// Users can only access their own items.
//
// GET    /users/me/items       → list all items
// POST   /users/me/items       → create a new item
// GET    /users/me/items/:id   → get one item
// PUT    /users/me/items/:id   → update one item
// DELETE /users/me/items/:id   → delete one item

import { prisma } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'

export async function handleUsersRoutes(req: Request, url: URL): Promise<Response | null> {
  const { pathname, method } = { pathname: url.pathname, method: req.method }

  if (!pathname.startsWith('/users/')) return null

  // All user routes require auth
  const authResult = await requireAuth(req)
  if (authResult instanceof Response) return authResult
  const user = authResult

  // GET /users/me/items
  if (method === 'GET' && pathname === '/users/me/items') {
    const items = await prisma.item.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json({ items })
  }

  // POST /users/me/items
  if (method === 'POST' && pathname === '/users/me/items') {
    const body = (await req.json()) as { title?: string; description?: string }
    if (!body.title) return Response.json({ error: 'title is required' }, { status: 400 })
    const item = await prisma.item.create({
      data: { title: body.title, description: body.description ?? null, userId: user.id },
    })
    return Response.json({ item }, { status: 201 })
  }

  // Routes with item id: /users/me/items/:id
  const itemMatch = pathname.match(/^\/users\/me\/items\/([^/]+)$/)
  if (itemMatch) {
    const id = itemMatch[1]

    if (method === 'GET') {
      const item = await prisma.item.findFirst({ where: { id, userId: user.id } })
      if (!item) return Response.json({ error: 'Item not found' }, { status: 404 })
      return Response.json({ item })
    }

    if (method === 'PUT') {
      const body = (await req.json()) as { title?: string; description?: string }
      const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
      if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 })
      const item = await prisma.item.update({
        where: { id },
        data: { ...(body.title && { title: body.title }), ...(body.description !== undefined && { description: body.description }) },
      })
      return Response.json({ item })
    }

    if (method === 'DELETE') {
      const existing = await prisma.item.findFirst({ where: { id, userId: user.id } })
      if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 })
      await prisma.item.delete({ where: { id } })
      return new Response(null, { status: 204 })
    }
  }

  return null
}
