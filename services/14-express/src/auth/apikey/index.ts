// Auth variant: apikey — API key-only authentication.
// JWT branch is removed.
//
// When API key is valid: req.user is populated, next() is called.
// When API key is missing, malformed, or invalid: 401 is returned, request stops.
// No JWT support — any Authorization: Bearer header is ignored.

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../db/client.js'
import { auditLog } from '../../middleware/audit.js'
import { dbCircuitBreaker } from '../../middleware/circuit-breaker.js'

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

// signToken is not meaningful for API key auth — no JWT is issued.
// Exported to satisfy the variant interface contract.
export function signToken(_user: AuthUser): string {
  return ''
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined

  if (!apiKey) {
    auditLog('auth_failure', null, req, { reason: 'no_credentials' })
    res.status(401).json({ error: 'Authentication required. Provide an X-API-Key header.' })
    return
  }

  // Reject empty strings, whitespace, or keys without the expected prefix.
  if (!apiKey.trim() || !apiKey.startsWith('yar_')) {
    auditLog('auth_failure', null, req, { reason: 'malformed_api_key' })
    res.status(401).json({ error: 'Invalid API key format' })
    return
  }

  // Wrap DB lookup in circuit breaker — fast-fail when DB is recovering.
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
}
