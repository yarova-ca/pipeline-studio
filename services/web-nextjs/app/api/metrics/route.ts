import * as client from 'prom-client'

// I-13: golden-signal metrics in Prometheus format.
// One registry per server process; the default metrics cover the runtime.
const registry: client.Registry =
  (globalThis as { __reg?: client.Registry }).__reg ??
  (() => {
    const r = new client.Registry()
    client.collectDefaultMetrics({ register: r })
    new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['route'] as const,
      registers: [r],
    })
    ;(globalThis as { __reg?: client.Registry }).__reg = r
    return r
  })()

export async function GET() {
  const body = await registry.metrics()
  return new Response(body, { headers: { 'Content-Type': registry.contentType } })
}
