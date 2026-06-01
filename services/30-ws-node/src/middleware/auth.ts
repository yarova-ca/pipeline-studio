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

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const apiKey = req.headers['x-api-key'] as string | undefined

  // ── Try JWT first ─────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser
      req.user = { id: payload.id, email: payload.email, name: payload.name }
      next()
      return
    } catch {
      // JWT invalid or expired — fall through to API key check
    }
  }

  // ── Try API key ────────────────────────────────────────────────────────────
  if (apiKey) {
    prisma.user
      .findUnique({ where: { apiKey } })
      .then((user) => {
        if (!user) {
          res.status(401).json({ error: 'Invalid API key' })
          return
        }
        req.user = { id: user.id, email: user.email, name: user.name }
        next()
      })
      .catch(() => {
        res.status(500).json({ error: 'Auth check failed' })
      })
    return
  }

  res.status(401).json({ error: 'Authentication required. Provide Bearer token or X-API-Key header.' })
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}
