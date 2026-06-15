import { Controller, Get, Header } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import * as client from 'prom-client'
import { Public } from './public.decorator'

client.collectDefaultMetrics()
export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
})

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpDuration.startTimer({ method: req.method })
  res.on('finish', () => end({ route: req.path, status: String(res.statusCode) }))
  next()
}

@Controller('metrics')
export class MetricsController {
  @Public()
  @Get()
  @Header('Content-Type', client.register.contentType)
  async metrics(): Promise<string> {
    return client.register.metrics()
  }
}
