import * as client from 'prom-client'

// I-13: golden-signal metrics in Prometheus format at /metrics.
export const register = new client.Registry()
client.collectDefaultMetrics({ register })

export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})
