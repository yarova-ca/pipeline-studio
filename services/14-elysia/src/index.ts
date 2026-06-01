import { Elysia } from 'elysia'
import { authRoutes } from './routes/auth.js'
import { usersRoutes } from './routes/users.js'

const PORT = Number(process.env.PORT ?? '3000')

export const app = new Elysia()
  .get('/', () => ({ message: 'Hello from Elysia 1.2', framework: '14-elysia', version: '1.0.0' }))
  .get('/health', () => ({ status: 'ok', version: '1.0.0' }))
  .get('/health/live', () => ({ status: 'ok' }))
  .get('/health/ready', () => ({ status: 'ok' }))
  // ── Feature routes ─────────────────────────────────────────────────────
  .use(authRoutes)
  .use(usersRoutes)

if (import.meta.main) {
  app.listen(PORT, () => console.log(`Elysia running on port ${PORT}`))
}
