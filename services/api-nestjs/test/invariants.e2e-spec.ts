import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import helmet from 'helmet'
import { AppModule } from '../src/app.module'
import { AllExceptionsFilter } from '../src/common/exceptions.filter'
import { config } from '../src/config'

// Each test maps to an invariant in INVARIANTS.md. Red test = violated invariant.
describe('Yarova invariants (NestJS gold standard)', () => {
  let app: INestApplication
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    app.use(helmet())
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    app.useGlobalFilters(new AllExceptionsFilter())
    await app.init()
  })
  afterAll(async () => { await app.close() })

  it('I-3: protected route without a token is 401', async () => {
    await request(app.getHttpServer()).get('/users/me/items').expect(401)
  })
  it('I-4: a tampered token is rejected', async () => {
    await request(app.getHttpServer()).get('/users/me/items')
      .set('Authorization', 'Bearer not.a.realtoken').expect(401)
  })
  it('I-6: unknown body fields are rejected with 400', async () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.c', name: 'A' }, config.JWT_SECRET,
      { issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE })
    await request(app.getHttpServer()).post('/users/me/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'ok', hacker: 'x' }).expect(400)
  })
  it('I-10: liveness is 200', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200)
  })
  it('I-13: metrics expose the request-duration golden signal', async () => {
    const res = await request(app.getHttpServer()).get('/metrics').expect(200)
    expect(res.text).toContain('http_request_duration_seconds')
  })
  it('I-17: security headers are present', async () => {
    const res = await request(app.getHttpServer()).get('/health/live')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})
