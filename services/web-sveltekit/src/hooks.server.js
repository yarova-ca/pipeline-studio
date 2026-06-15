import { httpDuration } from '$lib/metrics.js'

// I-1: validate config at server start; exit non-zero on failure.
// This module loads when the node server starts, not during the build.
if (!process.env.BFF_URL || (process.env.SESSION_SECRET ?? '').length < 32) {
  console.error('FATAL: BFF_URL must be set and SESSION_SECRET must be at least 32 characters')
  process.exit(1)
}

const CSP =
  "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-ancestors 'none'"

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const start = process.hrtime.bigint()
  const response = await resolve(event)

  // I-17 + C-6: security headers and a CSP on every response.
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', CSP)

  // I-13: measure every request's duration.
  if (event.url.pathname !== '/api/metrics') {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9
    httpDuration.labels(event.request.method, String(response.status)).observe(seconds)
  }

  return response
}
