// Jest loads this before any test module. config.ts validates process.env at
// import time and calls process.exit(1) on a miss, so the required vars must
// exist before the first import. These are test-only fakes — never real secrets.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-value-at-least-32-characters-long'
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://app:test@localhost:5432/test'
