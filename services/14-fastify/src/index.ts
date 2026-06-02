import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import 'dotenv/config'
import { authRoutes } from './routes/auth.js'
import { usersRoutes } from './routes/users.js'

export const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT ?? '3000')

await app.register(fastifyCookie)

app.get('/', async () => {
  return { message: 'Hello from Fastify 5.2', framework: '14-fastify', version: '1.0.0' }
})

app.get('/health', async () => {
  return { status: 'ok', version: '1.0.0' }
})

app.get('/health/live', async () => {
  return { status: 'ok' }
})

app.get('/health/ready', async () => {
  return { status: 'ok' }
})

// ── Feature routes ─────────────────────────────────────────────────────────
await app.register(authRoutes)
await app.register(usersRoutes)

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: PORT, host: '0.0.0.0' })
}

// Graceful shutdown — drains in-flight requests before exiting.
process.on('SIGTERM', () => {
  const srv = (global as any).__server
  if (srv) srv.close(() => process.exit(0))
  else process.exit(0)
})
