import { Injectable } from '@nestjs/common'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { compliance } from '../compliance/compliance'

export interface AuthUser { id: string; email: string; name: string }

@Injectable()
export class AuthService {
  signToken(user: AuthUser): string {
    // The session length is set by the active industry profile: HIPAA caps it
    // at 15 minutes, baseline allows 8 hours. Switching the profile changes the
    // token TTL with no code change.
    return jwt.sign({ id: user.id, email: user.email, name: user.name }, config.JWT_SECRET, {
      expiresIn: compliance.sessionTimeoutSeconds, issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE,
    })
  }
  verifyToken(token: string): AuthUser | null {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE,
      }) as AuthUser
    } catch {
      return null
    }
  }
}
