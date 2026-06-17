import { defineConfig } from 'vitest/config'

// The invariant suite imports prom-client and calls registry.metrics() with
// default-metric collection. The cold transform + first registry read can take
// several seconds on a clean run, which exceeds vitest 4's default 5s per-test
// timeout. Raise the ceiling so the real (unmodified) assertions get the time
// they need. This changes no test logic.
export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
