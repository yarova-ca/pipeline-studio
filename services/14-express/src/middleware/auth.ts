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
import { Redis } from 'ioredis'
import { prisma } from '../db/client.js'
import { logger } from '../logger.js'
import { auditLog } from './audit.js'
import { dbCircuitBreaker } from './circuit-breaker.js'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'SERVICE'
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

// Redis (in-memory database) for distributed token revocation.
// Why Redis: the in-memory Set only revokes on the current pod.
// In a 3-pod deployment, logout on pod A keeps the token valid on pods B+C.
// Redis is shared across all pods — revocation is cluster-wide.
// Fallback: if Redis is unavailable, fall back to in-memory Set with a warning.

let redisClient: Redis | null = null
const fallbackBlacklist = new Set<string>()

function getRedis(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    redisClient = new Redis(url, { lazyConnect: true, enableOfflineQueue: false })
    redisClient.on('error', (err: Error) => {
      logger.warn({ err: err.message }, 'redis_blacklist_error — falling back to in-memory')
    })
    return redisClient
  } catch {
    return null
  }
}

export const revokeToken = async (token: string, ttlSeconds = 8 * 3600): Promise<void> => {
  const redis = getRedis()
  if (redis) {
    await redis.setex(`revoked:${token}`, ttlSeconds, '1').catch(() => {
      // Redis failed — fall back to in-memory
      fallbackBlacklist.add(token)
      logger.warn('token_revocation_redis_failed — using in-memory fallback')
    })
  } else {
    fallbackBlacklist.add(token)
  }
}

export const isTokenRevoked = async (token: string): Promise<boolean> => {
  if (fallbackBlacklist.has(token)) return true
  const redis = getRedis()
  if (!redis) return false
  try {
    const result = await redis.get(`revoked:${token}`)
    return result === '1'
  } catch {
    return fallbackBlacklist.has(token) // fall back to local Set
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  const apiKey = req.headers['x-api-key'] as string | undefined

  // ── Try JWT first ─────────────────────────────────────────────────────────
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    if (await isTokenRevoked(token)) {
      auditLog('token_rejected', null, req, { reason: 'revoked' })
      res.status(401).json({ error: 'Token has been revoked' })
      return
    }

    try {
      // Fix 1: Lock algorithm to HS256 — prevents algorithm-confusion attacks.
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser
      req.user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role ?? 'USER' }
      auditLog('api_key_used', payload.id, req, { method: 'jwt' })
      next()
      return
    } catch {
      auditLog('token_rejected', null, req, { reason: 'invalid_jwt' })
      // JWT invalid or expired — fall through to API key check
    }
  }

  // ── Try API key ────────────────────────────────────────────────────────────
  if (apiKey) {
    // Fix 3: Reject empty strings, whitespace, or keys without the expected prefix.
    if (!apiKey.trim() || !apiKey.startsWith('yar_')) {
      auditLog('auth_failure', null, req, { reason: 'malformed_api_key' })
      res.status(401).json({ error: 'Invalid API key format' })
      return
    }

    // Fix 4: Wrap DB lookup in circuit breaker — fast-fail when DB is recovering.
    try {
      const user = await dbCircuitBreaker.execute(
        () => prisma.user.findUnique({ where: { apiKey } })
      )
      if (!user) {
        auditLog('auth_failure', null, req, { reason: 'invalid_api_key' })
        res.status(401).json({ error: 'Invalid API key' })
        return
      }
      req.user = { id: user.id, email: user.email, name: user.name, role: (user.role as any) ?? 'USER' }
      auditLog('api_key_used', user.id, req, { method: 'api_key' })
      next()
    } catch (err: any) {
      if (err.message?.includes('Circuit breaker OPEN')) {
        res.status(503).json({ error: 'Service temporarily unavailable — database is recovering. Try again in 30 seconds.' })
      } else {
        res.status(500).json({ error: 'Auth check failed' })
      }
    }
    return
  }

  auditLog('auth_failure', null, req, { reason: 'no_credentials' })
  res.status(401).json({ error: 'Authentication required. Provide Bearer token or X-API-Key header.' })
}

export function signToken(user: AuthUser): string {
  // Fix 1: Explicitly set algorithm on sign to match the verify constraint.
  // kid: key ID header enables key rotation — clients can identify which secret signed the token.
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role ?? 'USER' },
    JWT_SECRET,
    {
      expiresIn: '8h',
      algorithm: 'HS256',
      keyid: process.env.JWT_SECRET_KID ?? 'v1',
    }
  )
}
