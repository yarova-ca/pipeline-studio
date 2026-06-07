import type { Express, Request, Response, NextFunction } from 'express'
import { logger } from '../../logger.js'
export function applyCompliance(app: Express): void {
  app.set('env','production')
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info({ soc2_audit: true, actor: (req as any).user?.id ?? 'anon',
      action: req.method, resource: req.path }, 'soc2_audit')
    next()
  })
}
