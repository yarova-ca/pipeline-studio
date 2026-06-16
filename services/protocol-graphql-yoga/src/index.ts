// OTel must load first so auto-instrumentation can patch modules at require time.
// The import is a no-op unless OTEL_ENABLED=true (see src/tracing.ts).
import './tracing'

import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { createSchema, createYoga } from 'graphql-yoga'
import { GraphQLError } from 'graphql'
import { logger } from './logger'
import { register, httpDuration } from './metrics'
import { prisma } from './db/client'
import { buildContext, GraphQLContext } from './auth/context'
import { activeCompliance } from './compliance'

// I-1: refuse to boot on missing or weak config.
if ((process.env.JWT_SECRET ?? '').length < 32) {
  logger.error('FATAL: JWT_SECRET must be set and at least 32 characters')
  process.exit(1)
}

// I-6 is enforced by the GraphQL type system: unknown fields fail validation.
// I-3: `me` is a protected query — it throws UNAUTHENTICATED without a valid token.
const schema = createSchema<GraphQLContext>({
  typeDefs: `
    type User { id: ID!  email: String!  name: String! }
    type Query {
      health: String!
      me: User!
    }
  `,
  resolvers: {
    Query: {
      health: () => 'ok',
      me: (_parent, _args, ctx) => {
        if (!ctx.user) {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
          })
        }
        return ctx.user
      },
    },
  },
})

const yoga = createYoga<GraphQLContext>({
  schema,
  context: buildContext,
  // I-9: do not leak internal error details to clients in production.
  maskedErrors: process.env.NODE_ENV === 'production',
})

// I-17: security headers on every HTTP response.
function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const start = process.hrtime.bigint()
  setSecurityHeaders(res)
  const url = req.url ?? '/'

  const json = (code: number, body: unknown) => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(body))
    const seconds = Number(process.hrtime.bigint() - start) / 1e9
    httpDuration.labels(req.method ?? 'GET', String(code)).observe(seconds)
  }

  // I-10: liveness is true whenever the process is up.
  if (url.startsWith('/health/live')) return json(200, { status: 'ok' })

  // I-10: readiness is true only when the database is reachable.
  if (url.startsWith('/health/ready')) {
    try {
      await prisma.$queryRaw`SELECT 1`
      return json(200, { status: 'ok', db: 'connected' })
    } catch (err) {
      logger.error({ err }, 'health/ready db check failed')
      return json(503, { status: 'error', db: 'disconnected' })
    }
  }

  // Reports the active industry profile and its controls. Switch with
  // COMPLIANCE_PROFILE — the recipe changes with no code change, no rebuild.
  if (url.startsWith('/compliance')) return json(200, activeCompliance())

  // I-13: Prometheus metrics.
  if (url.startsWith('/metrics')) {
    const body = await register.metrics()
    res.writeHead(200, { 'Content-Type': register.contentType })
    res.end(body)
    return
  }

  // Everything else is GraphQL.
  return yoga(req, res)
}

const port = parseInt(process.env.PORT ?? '4000', 10)
const server = createServer((req, res) => {
  handler(req, res).catch((err) => {
    logger.error({ err }, 'unhandled request error')
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Internal server error' }))
    }
  })
})

server.listen(port, () => {
  logger.info({ port }, 'graphql yoga server started')
})

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
