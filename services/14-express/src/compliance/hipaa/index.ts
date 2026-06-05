import type { Express, Request, Response, NextFunction } from 'express'
import { logger } from '../../logger.js'
const PHI = ['ssn','dob','mrn','diagnosis','patientName','address','phone']
const maskPhi = (o: unknown): unknown => {
  if (!o || typeof o !== 'object') return o
  const out: Record<string,unknown> = Array.isArray(o) ? [] as any : {}
  for (const [k,v] of Object.entries(o as Record<string,unknown>))
    out[k] = PHI.includes(k) ? '***REDACTED***' : (v && typeof v==='object') ? maskPhi(v) : v
  return out
}
export function applyCompliance(app: Express): void {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info({ audit: true, actor: (req as any).user?.id ?? 'anon',
      action: req.method, resource: req.path, reqId: req.headers['x-request-id'] }, 'hipaa_audit')
    next()
  })
  app.set('env', 'production')
  const origInfo = logger.info.bind(logger)
  ;(logger as any).info = (o: any, m?: string) => origInfo(maskPhi(o) as any, m)
}
