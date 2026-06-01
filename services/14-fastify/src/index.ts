import Fastify from 'fastify'
import 'dotenv/config'

export const app = Fastify({ logger: true })
const PORT = Number(process.env.PORT ?? '3000')

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

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: PORT, host: '0.0.0.0' })
}
