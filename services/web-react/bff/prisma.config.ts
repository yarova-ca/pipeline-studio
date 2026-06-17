import { defineConfig, env } from 'prisma/config'

// Prisma 7 moved the connection URL out of schema.prisma into this config file.
// The CLI (generate/migrate) reads the datasource URL from here; the runtime
// client connects via the @prisma/adapter-pg driver adapter (see src/db.ts).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
