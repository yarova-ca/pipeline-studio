// Jest setup — runs before any test module is loaded.
// Sets environment variables required by the app at startup.
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long'
process.env.NODE_ENV = 'test'
