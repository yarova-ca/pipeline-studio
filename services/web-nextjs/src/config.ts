import { z } from 'zod'

// Full-stack SSR: the server tier holds the 23 invariants; data and auth live
// in a backend-for-frontend (BFF), one of the Tier-A golden services.
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  // The BFF this SSR app proxies data and auth to.
  BFF_URL: z.string().url('BFF_URL must be a valid URL'),
  // Signs the session cookie holding the OAuth tokens.
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
})

export type AppConfig = z.infer<typeof schema>

// I-1: validate at server start and exit non-zero on failure.
// Called from instrumentation.ts so it runs at runtime, never at build time.
export function validateConfig(): AppConfig {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    console.error('FATAL: invalid configuration:', JSON.stringify(parsed.error.flatten().fieldErrors))
    process.exit(1)
  }
  return parsed.data
}

// Lazy access for route handlers — reads env without exiting (boot already validated).
export function bffUrl(): string {
  return process.env.BFF_URL ?? ''
}
