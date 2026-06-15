import * as client from 'prom-client'

// I-13: one Prometheus registry per server process.
const g = globalThis
if (!g.__reg) {
  g.__reg = new client.Registry()
  client.collectDefaultMetrics({ register: g.__reg })
  g.__hist = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [g.__reg],
  })
}

export const registry = g.__reg
export const httpDuration = g.__hist
