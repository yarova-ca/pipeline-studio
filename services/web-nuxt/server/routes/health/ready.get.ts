// I-10: readiness is true only when the BFF (which owns the DB) is reachable.
export default defineEventHandler(async (event) => {
  try {
    const res = await fetch(`${process.env.BFF_URL}/health/ready`, {
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) return { status: 'ok', bff: 'reachable' }
    setResponseStatus(event, 503)
    return { status: 'error', bff: 'unhealthy' }
  } catch {
    setResponseStatus(event, 503)
    return { status: 'error', bff: 'unreachable' }
  }
})
