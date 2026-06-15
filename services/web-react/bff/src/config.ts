import { z } from 'zod'

// I-1: a typed config schema validated at startup; the process exits non-zero
// on failure so a misconfigured edge service fails loud, not insecure.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().positive().default(8080),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ISSUER: z.string().min(1).default('yarova'),
  JWT_AUDIENCE: z.string().min(1).default('yarova-api'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  RATE_LIMIT: z.coerce.number().int().positive().default(100),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // Never print secret values — only which keys are invalid.
  console.error('FATAL: invalid configuration:', JSON.stringify(parsed.error.flatten().fieldErrors))
  process.exit(1)
}

export const config = parsed.data
