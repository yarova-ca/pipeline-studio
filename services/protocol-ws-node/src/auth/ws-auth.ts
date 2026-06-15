// WebSocket auth — validates auth on the HTTP upgrade request.
//
// WebSocket clients cannot set custom headers in the browser WebSocket API,
// so two auth paths are supported:
//   1. Authorization: Bearer <JWT> in the HTTP upgrade headers (works in Node clients).
//   2. token query parameter: ws://host/ws?token=<JWT> (works in browser clients).
//
// On valid auth: the authenticated user is attached to ws.user.
// On missing or invalid auth: the connection is closed with code 1008 (Policy Violation).

import jwt from 'jsonwebtoken'
import type { IncomingMessage } from 'http'

export interface AuthUser {
  id: string
  email: string
  name: string
}

// I-1 guarantees JWT_SECRET is set and at least 32 chars before this runs.
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

// Extracts and verifies auth from a WebSocket upgrade request.
// Returns the AuthUser on success, null on failure.
export function authenticateUpgrade(req: IncomingMessage): AuthUser | null {
  // --- Attempt 1: Authorization header (Node/server clients) ---
  const authHeader = req.headers['authorization']
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return verifyToken(token)
  }

  // --- Attempt 2: ?token= query param (browser clients) ---
  const url = req.url ?? ''
  const tokenParam = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '').get(
    'token',
  )
  if (tokenParam) {
    return verifyToken(tokenParam)
  }

  return null
}

// Augment the WebSocket type to carry the authenticated user.
declare module 'ws' {
  interface WebSocket {
    user?: AuthUser
  }
}
