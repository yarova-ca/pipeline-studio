// Auth middleware — supports two auth methods:
//   1. JWT (JSON Web Token) in Authorization header: Bearer <token>
//   2. API key in X-API-Key header
//
// JWT: a signed token containing user identity. Expires. No DB lookup needed.
// API key: a persistent secret. Requires DB lookup on every request.
//
// When JWT is valid: req.user is populated, next() is called.
// When JWT is invalid or missing: falls through to API key check.
// When API key is valid: req.user is populated, next() is called.
// When both are missing or invalid: 401 is returned, request stops.

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client.js'

export interface AuthUser {
  id: string
  email: string
  name: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

// Fix 2: Require JWT_SECRET at startup — no fallback allowed.
// Why: a hardcoded fallback secret means any dev/staging token is valid in prod.
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and be at least 32 characters long')
}

// In-memory token blacklist for revoked JWTs.
// Fix 12: revokeToken + isTokenRevoked exported for use in the logout route.
// Note: this is process-local. In a multi-instance deployment, use Redis instead.
const tokenBlacklist = new Set<string>()
export const revokeToken = (token: string): void => { tokenBlacklist.add(token) }
export const isTokenRevoked = (token: string): boolean => tokenBlacklist.has(token)

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  const apiKey = req.headers['x-api-key'] as string | undefined

  // ── Try JWT first ─────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    // Fix 12: Reject revoked tokens before verification.
    if (isTokenRevoked(token)) {
      res.status(401).json({ error: 'Token has been revoked' })
      return
    }

    try {
      // Fix 1: Lock algorithm to HS256 — prevents algorithm-confusion attacks.
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser
      req.user = { id: payload.id, email: payload.email, name: payload.name }
      next()
      return
    } catch {
      // JWT invalid or expired — fall through to API key check
    }
  }

  // ── Try API key ────────────────────────────────────────────────────────────
  if (apiKey) {
    // Fix 3: Reject empty strings, whitespace, or keys without the expected prefix.
    if (!apiKey.trim() || !apiKey.startsWith('yar_')) {
      res.status(401).json({ error: 'Invalid API key format' })
      return
    }

    // Fix 4: Proper async/await instead of .then().catch() chain.
    try {
      const user = await prisma.user.findUnique({ where: { apiKey } })
      if (!user) {
        res.status(401).json({ error: 'Invalid API key' })
        return
      }
      req.user = { id: user.id, email: user.email, name: user.name }
      next()
    } catch {
      res.status(500).json({ error: 'Auth check failed' })
    }
    return
  }

  res.status(401).json({ error: 'Authentication required. Provide Bearer token or X-API-Key header.' })
}

export function signToken(user: AuthUser): string {
  // Fix 1: Explicitly set algorithm on sign to match the verify constraint.
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h', algorithm: 'HS256' }
  )
}
