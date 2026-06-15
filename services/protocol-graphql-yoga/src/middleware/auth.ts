// Auth helpers for the GraphQL context.
//   1. JWT (JSON Web Token) in Authorization: Bearer <token> — no DB hit.
//   2. API key in X-API-Key header — DB lookup, done in the context factory.
//
// I-1 guarantees JWT_SECRET is set and at least 32 chars before this runs.

import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  email: string
  name: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? ''

// I-4: verify signature and expiry; a bad token yields null, never a user.
export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser
    return { id: payload.id, email: payload.email, name: payload.name }
  } catch {
    return null
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' },
  )
}
