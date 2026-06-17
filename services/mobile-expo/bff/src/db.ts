import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// I-15: all database access goes through the ORM (Prisma). No raw unsafe SQL.
//
// Prisma 7 requires a driver adapter for the connection. PrismaPg wraps the
// node-postgres (`pg`) pool; the connection string comes from DATABASE_URL,
// the same env var validated by the zod config schema at startup.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})
