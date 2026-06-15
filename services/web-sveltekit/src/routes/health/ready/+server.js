import { json } from '@sveltejs/kit'
// I-10: readiness is true only when the BFF (which owns the DB) is reachable.
export async function GET() {
  try {
    const res = await fetch(`${process.env.BFF_URL}/health/ready`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) return json({ status: 'ok', bff: 'reachable' })
    return json({ status: 'error', bff: 'unhealthy' }, { status: 503 })
  } catch {
    return json({ status: 'error', bff: 'unreachable' }, { status: 503 })
  }
}
