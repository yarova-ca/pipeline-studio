import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// I-15: all database access goes through the ORM (Prisma). No raw unsafe SQL.
// Prisma 7 connects through a driver adapter instead of the schema `url`.
// The Postgres connection string still comes from DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})
