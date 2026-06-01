// Auth helper for Elysia — supports JWT and API key.
//
// Elysia uses a derive() pattern to add user to the context.
// requireAuth: called in onBeforeHandle, throws error({status:401}) on failure.
// resolveUser: derive function that returns { user } for guarded routes.

import jwt from 'jsonwebtoken'
import { error } from 'elysia'
import { prisma } from '../db/client.js'

export interface AuthUser {
  id: string
  email: string
  name: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

/** Resolves the authenticated user from the request.
 * Returns the AuthUser or throws an Elysia 401 error. */
export async function resolveUser(headers: {
  authorization?: string
  'x-api-key'?: string
}): Promise<AuthUser> {
  const authHeader = headers.authorization
  const apiKey = headers['x-api-key']

  // ── Try JWT first ──────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser
      return { id: payload.id, email: payload.email, name: payload.name }
    } catch {
      // JWT invalid or expired — fall through to API key check
    }
  }

  // ── Try API key ────────────────────────────────────────────────────────────
  if (apiKey) {
    const user = await prisma.user.findUnique({ where: { apiKey } })
    if (!user) throw error(401, { error: 'Invalid API key' })
    return { id: user.id, email: user.email, name: user.name }
  }

  throw error(401, { error: 'Authentication required. Provide Bearer token or X-API-Key header.' })
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}
