// Prisma client singleton for Deno.
// Uses npm: prefix since Deno supports Node modules via npm specifier.

import { PrismaClient } from 'npm:@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: Deno.env.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
  })

if (Deno.env.get('NODE_ENV') !== 'production') globalForPrisma.prisma = prisma
