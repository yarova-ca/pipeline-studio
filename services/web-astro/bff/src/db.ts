import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// I-15: all database access goes through the ORM (Prisma). No raw unsafe SQL.
// Prisma 7: the runtime connection is supplied by a driver adapter, not by a
// `url` in schema.prisma. The pg adapter opens the Postgres connection.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})
