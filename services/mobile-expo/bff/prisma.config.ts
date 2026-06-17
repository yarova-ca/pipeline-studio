import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Prisma 7 moved the datasource connection URL out of schema.prisma and into
// this config file. The CLI (migrate / generate) reads the URL from here; the
// runtime PrismaClient connects via the @prisma/adapter-pg driver adapter
// (see src/db.ts) using the same DATABASE_URL env var.
//
// `prisma generate` does not connect to the database, so DATABASE_URL may be
// absent at build time (e.g. in the Docker build stage). Fall back to a
// placeholder so generate never fails for a missing URL; migrate still needs a
// real URL and will use the env value when present.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
})
