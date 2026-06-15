// I-13: golden-signal metrics exported in Prometheus format at /metrics.
import * as client from 'prom-client'

export const register = new client.Registry()
client.collectDefaultMetrics({ register })

// Latency + traffic + errors: one histogram keyed by method and status.
export const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})

// Saturation: how many WebSocket clients are connected right now.
export const wsConnections = new client.Gauge({
  name: 'ws_active_connections',
  help: 'Number of currently connected WebSocket clients',
  registers: [register],
})
