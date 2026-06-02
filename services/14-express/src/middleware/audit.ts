// Audit logging — records all auth-relevant events with full context.
// Why: SOC2, ISO27001, and HIPAA all require an immutable audit trail of
// who performed what action on what resource, with timestamp and result.

import type { Request } from 'express'
import { logger } from '../logger.js'

export type AuditEvent =
  | 'login_initiated'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'token_issued'
  | 'token_refreshed'
  | 'token_revoked'
  | 'token_rejected'
  | 'api_key_generated'
  | 'api_key_used'
  | 'api_key_revoked'
  | 'auth_failure'
  | 'access_denied'

export function auditLog(
  event: AuditEvent,
  userId: string | null,
  req: Request,
  extra?: Record<string, unknown>,
): void {
  logger.info({
    audit: true,
    event,
    userId,
    ip: req.ip ?? req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
    ...extra,
  }, `AUDIT:${event}`)
}
