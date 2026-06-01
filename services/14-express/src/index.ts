// tracing.js must be the very first import — OTel patches modules at load time.
import './tracing.js'
import { setupSwagger } from './swagger.js'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { randomUUID } from 'node:crypto'
import 'dotenv/config'
import { logger } from './logger.js'
import { prisma } from './db/client.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'

// Fix 14: Validate required environment variables at startup.
// JWT_SECRET validation also runs inside middleware/auth.ts on module load.
const requiredEnvVars = ['JWT_SECRET']
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v])
if (missingEnvVars.length > 0) {
  console.error(`Missing required env vars: ${missingEnvVars.join(', ')}`)
  process.exit(1)
}
// Warn about optional vars that disable features.
if (!process.env.AUTH_CLIENT_ID) console.warn('AUTH_CLIENT_ID not set — OAuth login disabled')
if (!process.env.DATABASE_URL) console.warn('DATABASE_URL not set — database features disabled')

const app = express()
const PORT = Number(process.env.PORT ?? '3000')

// Fix 6: Helmet sets secure HTTP response headers (XSS protection, HSTS, etc.).
// Must be first middleware so headers apply to every response.
app.use(helmet())

// Fix 10: Attach a unique request ID to every request for traceability.
app.use((req, res, next) => {
  const id = (req.headers['x-request-id'] as string) || randomUUID()
  req.headers['x-request-id'] = id
  res.setHeader('x-request-id', id)
  next()
})

// Fix 5: CORS — restrict origins to the configured allowlist.
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}))

// Fix 9: Cookie parser needed for OAuth state validation.
app.use(cookieParser())

// Fix 7: Limit request body size to prevent large-payload DoS.
app.use(express.json({ limit: '10KB' }))
app.use(express.urlencoded({ extended: true, limit: '10KB' }))

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
