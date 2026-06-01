import { describe, it, expect } from 'vitest'
import app from '../src/index.js'

describe('14-hono health endpoints', () => {
  it('GET / returns hello', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/Hono/i)
  })

  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('ok')
  })

  it('GET /health/live returns ok', async () => {
    const res = await app.request('/health/live')
    expect(res.status).toBe(200)
  })

  it('GET /health/ready returns ok', async () => {
    const res = await app.request('/health/ready')
    expect(res.status).toBe(200)
  })
})
