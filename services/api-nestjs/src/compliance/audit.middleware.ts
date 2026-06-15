import { Request, Response, NextFunction } from 'express'
import { logger } from '../logger'
import { compliance } from './compliance'

// HIPAA/FedRAMP require an audit trail of every access to regulated data.
// When the active profile sets audit_logging, every mutating request emits a
// structured audit line with the actor, action, and resource.
// When the profile does not require it, this is a no-op — zero overhead.
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  if (!compliance.auditLogging || !MUTATING.has(req.method)) {
    next()
    return
  }
  res.on('finish', () => {
    logger.info(
      {
        audit: true,
        profile: compliance.profile,
        actor: (req as Request & { user?: { id?: string } }).user?.id ?? 'anonymous',
        action: req.method,
        resource: req.originalUrl,
        status: res.statusCode,
        requestId: req.headers['x-request-id'],
      },
      'audit',
    )
  })
  next()
}
