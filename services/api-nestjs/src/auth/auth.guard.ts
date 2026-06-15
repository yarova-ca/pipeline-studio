// Auth guard — checks JWT Bearer token or X-API-Key header.
// Applied to routes that require authentication.

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { prisma } from '../db/client'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const authHeader = req.headers.authorization
    const apiKey = req.headers['x-api-key'] as string | undefined

    // ── Try JWT first ──────────────────────────────────────────────────────
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const user = this.authService.verifyToken(token)
      if (user) {
        req.user = user
        return true
      }
    }

    // ── Try API key ────────────────────────────────────────────────────────
    if (apiKey) {
      const user = await prisma.user.findUnique({ where: { apiKey } })
      if (!user) throw new UnauthorizedException('Invalid API key')
      req.user = { id: user.id, email: user.email, name: user.name }
      return true
    }

    throw new UnauthorizedException('Authentication required. Provide Bearer token or X-API-Key header.')
  }
}
