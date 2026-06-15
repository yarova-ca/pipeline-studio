import { registry, httpDuration } from '../utils/metrics'

// I-13: measure every request's duration into the histogram.
export default defineEventHandler((event) => {
  if (event.path === '/api/metrics') return
  const start = process.hrtime.bigint()
  event.node.res.on('finish', () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9
    httpDuration.labels(event.method, String(event.node.res.statusCode)).observe(seconds)
  })
  // Touch registry so the import is retained.
  void registry
})
