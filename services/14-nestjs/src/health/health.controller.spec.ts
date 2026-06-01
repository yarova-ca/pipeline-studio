import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../app.module'

describe('14-nestjs health endpoints', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    await app.init()
  })

  afterAll(() => app.close())

  it('GET / returns hello', () => request(app.getHttpServer()).get('/').expect(200).expect((r) => expect(r.body.message).toMatch(/NestJS/i)))
  it('GET /health returns ok', () => request(app.getHttpServer()).get('/health').expect(200).expect((r) => expect(r.body.status).toBe('ok')))
  it('GET /health/live returns ok', () => request(app.getHttpServer()).get('/health/live').expect(200))
  it('GET /health/ready returns ok', () => request(app.getHttpServer()).get('/health/ready').expect(200))
})
