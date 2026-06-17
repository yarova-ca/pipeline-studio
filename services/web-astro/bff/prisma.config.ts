import { defineConfig } from 'prisma/config'

// Prisma 7: the datasource URL lives here, not in schema.prisma.
// `prisma migrate` / `prisma db` read this file. Runtime queries use the
// driver adapter in src/db.ts (see @prisma/adapter-pg).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    // DATABASE_URL is validated by src/config.ts at runtime.
    path: 'prisma/migrations',
  },
})
