import { registry } from '$lib/metrics.js'
// I-13: Prometheus scrape endpoint.
export async function GET() {
  return new Response(await registry.metrics(), { headers: { 'Content-Type': registry.contentType } })
}
