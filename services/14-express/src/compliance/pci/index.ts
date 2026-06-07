import type { Express, Request, Response, NextFunction } from 'express'
export function applyCompliance(app: Express): void {
  for (const [k,v] of Object.entries(process.env))
    if (/SECRET|KEY|TOKEN|PASS/i.test(k) && v && v.length < 16)
      throw new Error(`PCI: ${k} weak/plaintext secret`)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto']=== 'http') { res.status(403).json({error:'PCI: TLS required'}); return }
    if (req.path.startsWith('/debug') || req.path==='/metrics') { res.status(404).end(); return }
    res.setHeader('X-PCI-DSS','enforced')
    res.setHeader('Strict-Transport-Security','max-age=63072000; includeSubDomains; preload')
    next()
  })
}
