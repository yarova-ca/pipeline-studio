import { describe, it, expect } from 'bun:test'
import { app } from '../src/index'

describe('14-elysia health endpoints', () => {
  it('GET / returns hello', async () => {
    const res = await app.handle(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toContain('Elysia')
  })

  it('GET /health returns ok', async () => {
    const res = await app.handle(new Request('http://localhost/health'))
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('ok')
  })

  it('GET /health/live returns ok', async () => {
    const res = await app.handle(new Request('http://localhost/health/live'))
    expect(res.status).toBe(200)
  })

  it('GET /health/ready returns ok', async () => {
    const res = await app.handle(new Request('http://localhost/health/ready'))
    expect(res.status).toBe(200)
  })
})
