import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import { config } from './config'
import { logger } from './logger'
import { register, httpDuration } from './metrics'
import { compliance } from './compliance'
import { prisma } from './db'

interface AuthUser {
  id: string
  email: string
  name: string
}

const app = new Hono<{ Variables: { user: AuthUser } }>()

// I-17: security headers on every response. HSTS only when the active
// industry profile requires encryption in transit.
app.use('*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (compliance.controls.encryption_in_transit === true) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
})

// I-13: measure every request's duration into the histogram.
app.use('*', async (c, next) => {
  const start = process.hrtime.bigint()
  await next()
  const seconds = Number(process.hrtime.bigint() - start) / 1e9
  if (c.req.path !== '/metrics') {
    httpDuration.labels(c.req.method, String(c.res.status)).observe(seconds)
  }
})

// I-18: a small in-memory fixed-window rate limiter, per client IP.
// Health, metrics, and docs are exempt so probes and scrapes never throttle.
const hits = new Map<string, { count: number; reset: number }>()
app.use('*', async (c, next) => {
  const path = c.req.path
  if (path.startsWith('/health') || path === '/metrics' || path === '/docs.json') {
    return next()
  }
  const ip = c.req.header('x-forwarded-for') ?? 'local'
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 })
  } else if (entry.count >= config.RATE_LIMIT) {
    return c.json({ error: 'Too many requests — try again in 60 seconds' }, 429)
  } else {
    entry.count++
  }
  return next()
})

// ── Health (I-10) ──────────────────────────────────────────────────────────
app.get('/health/live', (c) => c.json({ status: 'ok' }))
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))
app.get('/health/ready', async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return c.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    logger.error({ err }, 'health/ready db check failed')
    return c.json({ status: 'error', db: 'disconnected' }, 503)
  }
})

// I-13: Prometheus scrape endpoint.
app.get('/metrics', async (c) => {
  return c.text(await register.metrics(), 200, { 'Content-Type': register.contentType })
})

// The active industry profile and the controls in effect (one repo, all industries).
app.get('/compliance', (c) =>
  c.json({
    profile: compliance.profile,
    name: compliance.name,
    jurisdiction: compliance.jurisdiction,
    controls: compliance.controls,
  }),
)

// I-7: OpenAPI spec served from the code.
const OPENAPI = {
  openapi: '3.0.3',
  info: { title: 'Hono Edge Service API', version: '1.0.0' },
  paths: {
    '/health/live': { get: { responses: { '200': { description: 'OK' } } } },
    '/health/ready': { get: { responses: { '200': { description: 'OK' }, '503': { description: 'DB down' } } } },
    '/users/me': { get: { responses: { '200': { description: 'OK' }, '401': { description: 'Unauthenticated' } } } },
  },
}
app.get('/docs.json', (c) => c.json(OPENAPI))

// I-3 / I-4: verify the bearer token. A bad token never reaches a handler.
function verify(token: string): AuthUser | null {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    }) as AuthUser
  } catch {
    return null
  }
}

// Protected: every route under /users requires a valid token.
app.use('/users/*', async (c, next) => {
  const header = c.req.header('Authorization')
  const user = header?.startsWith('Bearer ') ? verify(header.slice(7)) : null
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', user)
  return next()
})

app.get('/users/me', (c) => c.json(c.get('user')))

// Token TTL comes from the active profile. 0 means "no profile-imposed limit"
// in the catalog, so fall back to an 8-hour default.
const sessionTimeoutSeconds =
  typeof compliance.controls.session_timeout_seconds === 'number' &&
  compliance.controls.session_timeout_seconds > 0
    ? compliance.controls.session_timeout_seconds
    : 8 * 60 * 60

// Issue a token for a known user (TTL set by the active industry profile).
export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.JWT_SECRET, {
    expiresIn: sessionTimeoutSeconds,
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
  })
}

logger.info(
  { port: config.PORT, profile: compliance.profile, sessionTimeoutSeconds },
  'hono edge service starting',
)

const server = serve({ fetch: app.fetch, port: config.PORT, hostname: '0.0.0.0' })

// I-11: drain cleanly on SIGTERM.
function shutdown(signal: string): void {
  logger.info({ signal }, 'shutting down')
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
