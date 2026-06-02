import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'

const app = new Hono()
const PORT = Number(process.env.PORT ?? '3000')

app.get('/', (c) => c.json({ message: 'Hello from Hono 4.7', framework: '14-hono', version: '1.0.0' }))
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }))
app.get('/health/live', (c) => c.json({ status: 'ok' }))
app.get('/health/ready', (c) => c.json({ status: 'ok' }))

// ── Feature routes ─────────────────────────────────────────────────────────
app.route('/', authRouter)
app.route('/', usersRouter)

export default app

if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port: PORT }, () => console.log(`Hono running on port ${PORT}`))
}

// Graceful shutdown — drains in-flight requests before exiting.
process.on('SIGTERM', () => {
  const srv = (global as any).__server
  if (srv) srv.close(() => process.exit(0))
  else process.exit(0)
})
