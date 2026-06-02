// Service-to-service authentication for internal API calls.
// Why: internal workers/jobs need to call this API without impersonating a user.
// Full mTLS requires Istio/Linkerd service mesh — this is the interim approach.
// Production: replace SERVICE_TOKEN with Kubernetes workload identity (SPIFFE/SPIRE).

import type { Request, Response, NextFunction } from 'express'
import { timingSafeEqual, createHash } from 'node:crypto'
import { auditLog } from './audit.js'

const SERVICE_TOKEN_HASH = process.env.SERVICE_TOKEN
  ? createHash('sha256').update(process.env.SERVICE_TOKEN).digest()
  : null

export function requireServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-service-token'] as string | undefined
  if (!token || !SERVICE_TOKEN_HASH) {
    auditLog('auth_failure', null, req, { reason: 'missing_service_token' })
    res.status(401).json({ error: 'Service token required' })
    return
  }
  const incoming = createHash('sha256').update(token).digest()
  if (!timingSafeEqual(incoming, SERVICE_TOKEN_HASH)) {
    auditLog('auth_failure', null, req, { reason: 'invalid_service_token' })
    res.status(401).json({ error: 'Invalid service token' })
    return
  }
  ;(req as any).service = { authenticated: true }
  next()
}
