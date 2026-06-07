import type { Express, Request, Response, NextFunction } from 'express'
import { logger } from '../../logger.js'
const PII = ['email','name','phone','address','sin']
const maskPii = (o: any): any => {
  if (!o || typeof o!=='object') return o
  const out: any = Array.isArray(o) ? [] : {}
  for (const [k,v] of Object.entries(o)) out[k] = PII.includes(k) ? '***' : (typeof v==='object' ? maskPii(v) : v)
  return out
}
export function applyCompliance(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Data-Residency','CA')
    if (['POST','PUT','PATCH'].includes(req.method) && req.headers['x-consent']!=='granted') {
      res.status(451).json({error:'PIPEDA: consent required (X-Consent: granted)'}); return
    }
    next()
  })
  const origInfo = logger.info.bind(logger)
  ;(logger as any).info = (o: any, m?: string) => origInfo(maskPii(o), m)
}
