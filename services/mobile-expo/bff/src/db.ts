import { PrismaClient } from '@prisma/client'

// I-15: all database access goes through the ORM (Prisma). No raw unsafe SQL.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})
