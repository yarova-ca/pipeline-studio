// Auth middleware for Fastify — supports JWT and API key.
//
// JWT: Authorization: Bearer <token>
// API key: X-API-Key header (DB lookup)
//
// On success: req.user is populated, handler continues.
// On failure: 401 is returned, request stops.

import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client.js'

export interface AuthUser {
  id: string
  email: string
  name: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization
  const apiKey = req.headers['x-api-key'] as string | undefined

  // ── Try JWT first ──────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser
      req.user = { id: payload.id, email: payload.email, name: payload.name }
      return
    } catch {
      // JWT invalid or expired — fall through to API key check
    }
  }

  // ── Try API key ────────────────────────────────────────────────────────────
  if (apiKey) {
    const user = await prisma.user.findUnique({ where: { apiKey } })
    if (!user) {
      reply.status(401).send({ error: 'Invalid API key' })
      return
    }
    req.user = { id: user.id, email: user.email, name: user.name }
    return
  }

  reply.status(401).send({ error: 'Authentication required. Provide Bearer token or X-API-Key header.' })
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}
