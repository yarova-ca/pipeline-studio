// Users CRUD tests for NestJS.

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import jwt from 'jsonwebtoken'
import { AppModule } from '../src/app.module'

const USER_ID = 'user-1'
const ITEM_1 = { id: 'item-1', title: 'First item', description: 'desc', userId: USER_ID, createdAt: new Date(), updatedAt: new Date() }

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    item: {
      findMany: jest.fn().mockResolvedValue([ITEM_1]),
      create: jest.fn().mockResolvedValue({ ...ITEM_1, id: 'item-new', title: 'New item' }),
      findFirst: jest.fn().mockImplementation(({ where }: { where: { id: string; userId: string } }) => {
        if (where.id === 'item-1' && where.userId === USER_ID) return Promise.resolve(ITEM_1)
        return Promise.resolve(null)
      }),
      update: jest.fn().mockResolvedValue({ ...ITEM_1, title: 'Updated' }),
      delete: jest.fn().mockResolvedValue(ITEM_1),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  })),
}))

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const token = jwt.sign({ id: USER_ID, email: 'test@example.com', name: 'Test' }, JWT_SECRET, { expiresIn: '1h' })
const auth = { Authorization: `Bearer ${token}` }

describe('Users CRUD routes', () => {
  let app: INestApplication

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = mod.createNestApplication()
    await app.init()
  })

  afterAll(() => app.close())

  it('GET /users/me/items returns 200 with items array', async () => {
    const res = await request(app.getHttpServer()).get('/users/me/items').set(auth)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.items)).toBe(true)
  })

  it('POST /users/me/items returns 201', async () => {
    const res = await request(app.getHttpServer()).post('/users/me/items').set(auth).send({ title: 'New item' })
    expect(res.status).toBe(201)
    expect(res.body.item.title).toBe('New item')
  })

  it('GET /users/me/items/:id returns 200', async () => {
    const res = await request(app.getHttpServer()).get('/users/me/items/item-1').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.item.id).toBe('item-1')
  })

  it('GET /users/me/items/:id returns 404 when not found', async () => {
    const res = await request(app.getHttpServer()).get('/users/me/items/nonexistent').set(auth)
    expect(res.status).toBe(404)
  })

  it('PUT /users/me/items/:id returns 200', async () => {
    const res = await request(app.getHttpServer()).put('/users/me/items/item-1').set(auth).send({ title: 'Updated' })
    expect(res.status).toBe(200)
    expect(res.body.item.title).toBe('Updated')
  })

  it('DELETE /users/me/items/:id returns 204', async () => {
    const res = await request(app.getHttpServer()).delete('/users/me/items/item-1').set(auth)
    expect(res.status).toBe(204)
  })
})
