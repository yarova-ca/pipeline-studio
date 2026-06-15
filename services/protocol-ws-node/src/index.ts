// OTel must load first so auto-instrumentation can patch modules at require time.
// The import is a no-op unless OTEL_ENABLED=true (see src/tracing.ts).
import './tracing'

import * as http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { logger } from './logger'
import { register, httpDuration, wsConnections } from './metrics'
import { authenticateUpgrade } from './auth/ws-auth'
import { prisma } from './db/client'

// I-1: refuse to boot on missing or weak config.
const jwtSecret = process.env.JWT_SECRET ?? ''
if (jwtSecret.length < 32) {
  logger.error('FATAL: JWT_SECRET must be set and at least 32 characters')
  process.exit(1)
}

const port = parseInt(process.env.PORT ?? '8080', 10)

// I-17: security headers on every HTTP response.
function setSecurityHeaders(res: http.ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

const server = http.createServer(async (req, res) => {
  const start = process.hrtime.bigint()
  setSecurityHeaders(res)
  const url = req.url ?? '/'

  const done = (code: number, body?: unknown) => {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(body === undefined ? undefined : JSON.stringify(body))
    const seconds = Number(process.hrtime.bigint() - start) / 1e9
    httpDuration.labels(req.method ?? 'GET', String(code)).observe(seconds)
  }

  // I-10: liveness is true whenever the process is up.
  if (url.startsWith('/health/live')) {
    return done(200, { status: 'ok' })
  }

  // I-10: readiness is true only when the database is reachable.
  if (url.startsWith('/health/ready')) {
    try {
      await prisma.$queryRaw`SELECT 1`
      return done(200, { status: 'ok', db: 'connected' })
    } catch (err) {
      logger.error({ err }, 'health/ready db check failed')
      return done(503, { status: 'error', db: 'disconnected' })
    }
  }

  // I-13: Prometheus metrics.
  if (url.startsWith('/metrics')) {
    const body = await register.metrics()
    res.writeHead(200, { 'Content-Type': register.contentType })
    res.end(body)
    return
  }

  return done(404, { error: 'not found' })
})

// I-3: authenticate the WebSocket upgrade. Unauthenticated upgrades are rejected
// before the connection is established — no echo loop runs for anonymous clients.
const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  if (!req.url?.startsWith('/ws')) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.destroy()
    return
  }
  const user = authenticateUpgrade(req)
  if (!user) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
    ws.user = user
    wss.emit('connection', ws, req)
  })
})

wss.on('connection', (ws: WebSocket) => {
  wsConnections.inc()
  logger.info({ user: ws.user?.id }, 'client connected')
  ws.on('message', (msg) => {
    ws.send(JSON.stringify({ echo: msg.toString(), userId: ws.user?.id }))
  })
  ws.on('close', () => {
    wsConnections.dec()
    logger.info({ user: ws.user?.id }, 'client disconnected')
  })
})

server.listen(port, () => {
  logger.info({ port }, 'websocket server started')
})

// I-11: drain cleanly on SIGTERM.
function shutdown(signal: string): void {
  logger.info({ signal }, 'shutting down')
  wss.clients.forEach((c) => c.close())
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
