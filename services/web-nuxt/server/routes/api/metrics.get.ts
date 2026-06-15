import { registry } from '../../utils/metrics'

// I-13: Prometheus scrape endpoint.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', registry.contentType)
  return await registry.metrics()
})
