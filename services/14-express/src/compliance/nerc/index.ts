import type { Express, Request, Response, NextFunction } from 'express'
export function applyCompliance(app: Express): void {
  process.env.NO_EGRESS = 'true'
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-OT-IT-Boundary','enforced')
    res.setHeader('X-Network-Isolation','on')
    next()
  })
}
