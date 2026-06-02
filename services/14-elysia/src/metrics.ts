// Prometheus metrics for 14-express.
// Prometheus: time-series monitoring system that scrapes /metrics endpoint.
// Counter: monotonically increasing number (total requests, total errors).
// Histogram: distribution of values (request latency buckets).
// Gauge: value that goes up and down (active connections).
import { Counter, Histogram, Gauge, register, collectDefaultMetrics } from 'prom-client'

// Collect Node.js default metrics (event loop lag, GC, memory, etc.)
collectDefaultMetrics({ prefix: 'nodejs_' })

// HTTP request counter — labels: method, path (template), status
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
})

// HTTP request duration histogram — p50, p95, p99 latency
export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
})

// Auth events counter — labels: event type, result
export const authEventsTotal = new Counter({
  name: 'auth_events_total',
  help: 'Authentication events',
  labelNames: ['event', 'result'],
})

// DB query duration histogram
export const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
})

// Active requests gauge
export const activeRequests = new Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests being processed',
})

export { register }
