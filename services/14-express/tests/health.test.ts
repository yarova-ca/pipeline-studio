import request from 'supertest'
import app from '../src/index.js'
import { server } from '../src/index.js'

afterAll(() => server.close())

describe('14-express health endpoints', () => {
  it('GET / returns hello world', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/Express/i)
  })

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('GET /health/live returns ok', async () => {
    const res = await request(app).get('/health/live')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('GET /health/ready returns ok', async () => {
    const res = await request(app).get('/health/ready')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
