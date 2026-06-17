import { defineConfig } from 'vitest/config'

// setupFiles run before the test module graph is imported, so env vars read at
// module-load time (e.g. JWT_SECRET in src/auth/ws-auth.ts) are present.
export default defineConfig({
  test: {
    setupFiles: ['./src/test-setup.ts'],
  },
})
