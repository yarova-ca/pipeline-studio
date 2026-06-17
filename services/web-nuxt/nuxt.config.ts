// Full-stack SSR (Tier B). The Nitro server holds the invariants; data and auth
// live in a BFF reached via BFF_URL.
export default defineNuxtConfig({
  // Nuxt 4: pin the major-version behaviour explicitly so the build is
  // deterministic and does not silently shift if the default changes.
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-01-01',
  ssr: true,
  // I-17 + C-6: security headers and a CSP on every response.
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy':
          "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
      },
    },
  },
  nitro: {
    preset: 'node-server',
  },
})
