// Auth variant: none — no authentication enforced.
// requireAuth: passes all requests through without checking credentials.
// signToken: returns an empty string — no token is issued.
//
// Use: development environments, internal-only services, or behind a trusted gateway.

import type { Request, Response, NextFunction } from 'express'
import type { AuthUser } from '../all/index.js'

export type { AuthUser }

export async function requireAuth(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  next()
}

export function signToken(_user: AuthUser): string {
  return ''
}
