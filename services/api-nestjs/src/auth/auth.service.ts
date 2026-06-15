import { Injectable } from '@nestjs/common'
import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface AuthUser { id: string; email: string; name: string }

@Injectable()
export class AuthService {
  signToken(user: AuthUser): string {
    return jwt.sign({ id: user.id, email: user.email, name: user.name }, config.JWT_SECRET, {
      expiresIn: '8h', issuer: config.JWT_ISSUER, audience: config.JWT_AUDIENCE,
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
