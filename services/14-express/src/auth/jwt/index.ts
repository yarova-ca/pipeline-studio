// Auth variant: jwt — JWT-only authentication.
// API key branch is removed.
//
// When JWT is valid: req.user is populated, next() is called.
// When JWT is invalid, expired, or missing: 401 is returned, request stops.
// No fallback to API key — any X-API-Key header is ignored.

import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Redis } from 'ioredis'
import { logger } from '../../logger.js'
import { auditLog } from '../../middleware/audit.js'

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

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and be at least 32 characters long')
}

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
    return fallbackBlacklist.has(token)
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)

    if (await isTokenRevoked(token)) {
      auditLog('token_rejected', null, req, { reason: 'revoked' })
      res.status(401).json({ error: 'Token has been revoked' })
      return
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser
      req.user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role ?? 'USER' }
      auditLog('api_key_used', payload.id, req, { method: 'jwt' })
      next()
      return
    } catch {
      auditLog('token_rejected', null, req, { reason: 'invalid_jwt' })
    }
  }

  auditLog('auth_failure', null, req, { reason: 'no_credentials' })
  res.status(401).json({ error: 'Authentication required. Provide a Bearer token.' })
}

export function signToken(user: AuthUser): string {
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
