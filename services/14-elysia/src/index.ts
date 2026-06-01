import { Elysia } from 'elysia'

const PORT = Number(process.env.PORT ?? '3000')

export const app = new Elysia()
  .get('/', () => ({ message: 'Hello from Elysia 1.2', framework: '14-elysia', version: '1.0.0' }))
  .get('/health', () => ({ status: 'ok', version: '1.0.0' }))
  .get('/health/live', () => ({ status: 'ok' }))
  .get('/health/ready', () => ({ status: 'ok' }))

if (import.meta.main) {
  app.listen(PORT, () => console.log(`Elysia running on port ${PORT}`))
}
