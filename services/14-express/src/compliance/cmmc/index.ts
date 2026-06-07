import type { Express, Request, Response, NextFunction } from 'express'
import { logger } from '../../logger.js'
export function applyCompliance(app: Express): void {
  app.set('env','production')
  process.env.NO_EGRESS = 'true'
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info({ cmmc_audit: true, actor: (req as any).user?.id ?? 'anon',
      action: req.method, resource: req.path }, 'cmmc_audit')
    if (req.path.startsWith('/debug')) { res.status(404).end(); return }
    next()
  })
}
