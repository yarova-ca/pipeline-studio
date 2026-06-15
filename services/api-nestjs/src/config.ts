import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ISSUER: z.string().min(1).default('yarova'),
  JWT_AUDIENCE: z.string().min(1).default('yarova-api'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  OTEL_ENABLED: z.enum(['true', 'false']).default('false'),
  RATE_LIMIT: z.coerce.number().int().positive().default(100),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // I-1: fail loud, exit non-zero, never print secret values
  // eslint-disable-next-line no-console
  console.error('FATAL: invalid configuration:', JSON.stringify(parsed.error.flatten().fieldErrors))
  process.exit(1)
}
export const config = parsed.data
