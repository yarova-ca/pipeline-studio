// Auth variant: active — placeholder replaced at Docker build time.
// At build: COPY src/auth/${AUTH}/ ./src/auth/active/
// Default AUTH=all — both JWT and API key are enforced.
//
// This file is overwritten by the build-arg selected variant.
// It must not be imported directly — import from ../auth/active/index.js
// so the build-arg substitution takes effect.

export { requireAuth, signToken, revokeToken, isTokenRevoked } from '../all/index.js'
export type { AuthUser } from '../all/index.js'
