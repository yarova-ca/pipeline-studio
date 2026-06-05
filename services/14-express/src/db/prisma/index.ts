import { PrismaClient } from "@prisma/client"
import type { Db } from "../index.js"

const prisma = new PrismaClient()

export const db: Db = {
  ping: async () => { await prisma.$queryRaw`SELECT 1` },
  findUserByApiKey: async (apiKey) => prisma.user.findUnique({ where: { apiKey } }) as any,
  disconnect: () => prisma.$disconnect(),
}

export { prisma }
