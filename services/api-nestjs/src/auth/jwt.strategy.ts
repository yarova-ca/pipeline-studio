// JWT strategy for NestJS Passport.
// Validates the Bearer token and attaches user to request.

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { AuthUser } from './auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    })
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    if (!payload.id || !payload.email) {
      throw new UnauthorizedException()
    }
    return { id: payload.id, email: payload.email, name: payload.name }
  }
}
