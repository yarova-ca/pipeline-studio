// Prisma client singleton — one connection pool for the entire process.
// Why singleton: Prisma opens a connection pool per instance.
// Multiple instances = connection exhaustion under load.

import { PrismaClient } from '@prisma/client'
import { dbQueryDurationSeconds } from '../metrics.js'

// Add pool and timeout parameters to DATABASE_URL if not already present.
// statement_timeout: kills queries running longer than 5s — prevents DB monopolization.
// connection_limit: caps pool size to 10 — prevents connection exhaustion under load.
// pool_timeout: fails fast (10s) if no connection is available from the pool.
const rawUrl = process.env.DATABASE_URL ?? ''
const dbUrl = rawUrl.includes('?')
  ? rawUrl + '&statement_timeout=5000&connection_limit=10&pool_timeout=10'
  : rawUrl + '?statement_timeout=5000&connection_limit=10&pool_timeout=10'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    datasources: rawUrl ? { db: { url: dbUrl } } : undefined,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Instrument Prisma queries for slow query logging and metrics.
// Emits to dbQueryDurationSeconds histogram for Prometheus.
// Logs queries exceeding 100ms as warnings for investigation.
prisma.$on('query', (e) => {
  // Parse model from query (e.g., "SELECT ... FROM \"users\"" → "users")
  const model = e.query.match(/FROM\s+"?(\w+)"?/i)?.[1] ?? 'unknown'
  const operation = e.query.split(' ')[0].toLowerCase()
  const durationSeconds = e.duration / 1000

  dbQueryDurationSeconds.observe({ operation, model }, durationSeconds)

  if (e.duration > 100) {
    // Import logger dynamically to avoid circular dependency
    import('../logger.js').then(({ logger }) => {
      logger.warn({ query: e.query.substring(0, 200), duration: e.duration, params: e.params }, 'slow_query')
    })
  }
})

// Prisma error codes for transient failures (retryable)
// P1001: connection error
// P1002: connection timeout
// P1008: operation timed out
// P1017: server closed connection
const RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017'])

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 100,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      const code = err?.code ?? err?.meta?.code
      if (!RETRYABLE_CODES.has(code)) throw err    // Non-retryable: re-throw immediately
      if (attempt === retries) break
      const jitter = Math.random() * delayMs       // Jitter prevents thundering herd
      await new Promise(r => setTimeout(r, delayMs * attempt + jitter))
    }
  }
  throw lastError
}
