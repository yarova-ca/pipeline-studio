// Integration test — requires a real running service.
// Run: npm run test:integration (starts docker-compose first)
// Why integration test: unit tests mock Prisma. This test hits a real DB.
//
// To run:
//   docker compose up -d db redis
//   npx prisma migrate deploy
//   npm run test:integration

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

describe('Integration — health endpoints', () => {
  it('GET /health returns 200', async () => {
    const res = await fetch(`${BASE}/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('GET /health/ready returns 200 when DB is up', async () => {
    const res = await fetch(`${BASE}/health/ready`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.db).toBe('connected')
  })
})

describe('Integration — auth flow', () => {
  it('POST /auth/dev/token returns JWT in development', async () => {
    if (process.env.NODE_ENV !== 'development') return
    const res = await fetch(`${BASE}/auth/dev/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'integration@test.com', name: 'Integration Test' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBeTruthy()
  })
})
