// Auth service — JWT creation and verification.

import { Injectable } from '@nestjs/common'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  id: string
  email: string
  name: string
}

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'

  signToken(user: AuthUser): string {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      this.jwtSecret,
      { expiresIn: '8h' }
    )
  }

  verifyToken(token: string): AuthUser | null {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthUser
    } catch {
      return null
    }
  }
}
