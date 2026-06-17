// Runs before any test module is imported. Sets the JWT secret so that
// src/middleware/auth.ts captures a valid value at module-load time.
process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough-32+'
process.env.NODE_ENV = 'test'
