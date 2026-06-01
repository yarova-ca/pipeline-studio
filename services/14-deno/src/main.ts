import { Application, Router } from '@oak/oak'
import '@std/dotenv/load'
import authRouter from './routes/auth.ts'
import usersRouter from './routes/users.ts'

const app = new Application()
const router = new Router()
const PORT = Number(Deno.env.get('PORT') ?? '8000')

router
  .get('/', (ctx) => {
    ctx.response.body = { message: 'Hello from Deno 2.3', framework: '14-deno', version: '1.0.0' }
  })
  .get('/health', (ctx) => {
    ctx.response.body = { status: 'ok', version: '1.0.0' }
  })
  .get('/health/live', (ctx) => {
    ctx.response.body = { status: 'ok' }
  })
  .get('/health/ready', (ctx) => {
    ctx.response.body = { status: 'ok' }
  })

app.use(router.routes())
app.use(router.allowedMethods())

// ── Feature routes ─────────────────────────────────────────────────────────
app.use(authRouter.routes())
app.use(authRouter.allowedMethods())
app.use(usersRouter.routes())
app.use(usersRouter.allowedMethods())

console.log(`Deno running on port ${PORT}`)
await app.listen({ port: PORT })
