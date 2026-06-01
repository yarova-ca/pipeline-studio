// Auth middleware for Hono — supports JWT and API key.
//
// JWT: Authorization: Bearer <token>
// API key: X-API-Key header (DB lookup)
//
// On success: stores user in Hono context variable, calls next().
// On failure: returns 401 JSON response.

import type { MiddlewareHandler } from 'hono'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client.js'

export interface AuthUser {
  id: string
  email: string
  name: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const apiKey = c.req.header('X-API-Key')

  // ── Try JWT first ──────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser
      c.set('user', { id: payload.id, email: payload.email, name: payload.name })
      await next()
      return
    } catch {
      // JWT invalid or expired — fall through to API key check
    }
  }

  // ── Try API key ────────────────────────────────────────────────────────────
  if (apiKey) {
    const user = await prisma.user.findUnique({ where: { apiKey } })
    if (!user) {
      return c.json({ error: 'Invalid API key' }, 401)
    }
    c.set('user', { id: user.id, email: user.email, name: user.name })
    await next()
    return
  }

  return c.json({ error: 'Authentication required. Provide Bearer token or X-API-Key header.' }, 401)
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}
