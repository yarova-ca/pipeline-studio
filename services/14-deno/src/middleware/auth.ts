// Auth middleware for Deno Oak — supports JWT and API key.
//
// JWT: Authorization: Bearer <token>
// API key: X-API-Key header (DB lookup)
//
// On success: sets ctx.state.user, calls next().
// On failure: sets ctx.response.status = 401.

import { verify, create, getNumericDate } from 'npm:jose'
import { prisma } from '../db/client.ts'

export interface AuthUser {
  id: string
  email: string
  name: string
}

type RouterContext = {
  request: { headers: { get(name: string): string | null } }
  response: { status: number; body: unknown }
  state: Record<string, unknown>
}

const JWT_SECRET_RAW = Deno.env.get('JWT_SECRET') ?? 'dev-secret-change-in-production'
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW)

export async function requireAuth(
  ctx: RouterContext,
  next: () => Promise<unknown>
): Promise<void> {
  const authHeader = ctx.request.headers.get('Authorization')
  const apiKey = ctx.request.headers.get('X-API-Key')

  // ── Try JWT first ──────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const { payload } = await verify(token, JWT_SECRET)
      ctx.state.user = { id: payload.id, email: payload.email, name: payload.name }
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
      ctx.response.status = 401
      ctx.response.body = { error: 'Invalid API key' }
      return
    }
    ctx.state.user = { id: user.id, email: user.email, name: user.name }
    await next()
    return
  }

  ctx.response.status = 401
  ctx.response.body = { error: 'Authentication required. Provide Bearer token or X-API-Key header.' }
}

export async function signToken(user: AuthUser): Promise<string> {
  const token = await create(
    { alg: 'HS256', typ: 'JWT' },
    { id: user.id, email: user.email, name: user.name, exp: getNumericDate(8 * 60 * 60) },
    JWT_SECRET
  )
  return token
}
