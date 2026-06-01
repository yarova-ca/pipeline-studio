// Auth helper for Bun native server — supports JWT and API key.
//
// Bun uses a fetch-style handler: (req: Request) => Response.
// requireAuth returns { user } on success, or a Response on failure.
//
// JWT: Authorization: Bearer <token>
// API key: X-API-Key header (DB lookup)

import jwt from 'jsonwebtoken'
import { prisma } from '../db/client.js'

export interface AuthUser {
  id: string
  email: string
  name: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

/** Returns the authenticated user or a 401 Response. */
export async function requireAuth(req: Request): Promise<AuthUser | Response> {
  const authHeader = req.headers.get('Authorization')
  const apiKey = req.headers.get('X-API-Key')

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
    if (!user) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 })
    }
    return { id: user.id, email: user.email, name: user.name }
  }

  return Response.json(
    { error: 'Authentication required. Provide Bearer token or X-API-Key header.' },
    { status: 401 }
  )
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}
