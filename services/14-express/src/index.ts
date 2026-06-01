// tracing.js must be the very first import — OTel patches modules at load time.
import './tracing.js'
import { setupSwagger } from './swagger.js'
import express from 'express'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'
import { logger } from './logger.js'
import { prisma } from './db/client.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'

const app = express()
const PORT = Number(process.env.PORT ?? '3000')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Request logging ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'request')
  next()
})

// ── Rate limiting ──────────────────────────────────────────────────────────
// Health endpoints are exempt so k8s probes are never blocked.
app.use(
  rateLimit({
    windowMs: 60_000,   // 1-minute window
    max: 100,           // 100 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — try again in 60 seconds' },
    skip: (req) => req.path.startsWith('/health'),
  }),
)

// ── Base routes ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express 5.0', framework: '14-express', version: '1.0.0' })
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: Math.floor(process.uptime()) })
})

app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok' })
})

// DB-checking readiness probe.
// Returns 503 when the database is unreachable so k8s removes the pod
// from the load balancer until the connection recovers.
app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

// ── OpenAPI docs ───────────────────────────────────────────────────────────
setupSwagger(app)

// ── Feature routes ─────────────────────────────────────────────────────────
app.use('/auth', authRouter)
app.use('/users', usersRouter)

export const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Express server started')
})

export default app
