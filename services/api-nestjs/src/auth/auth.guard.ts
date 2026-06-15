import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { prisma } from '../db/client'
import { IS_PUBLIC } from '../common/public.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const req = context.switchToHttp().getRequest<Request>()
    const authHeader = req.headers.authorization
    const apiKey = req.headers['x-api-key'] as string | undefined

    if (authHeader?.startsWith('Bearer ')) {
      const user = this.authService.verifyToken(authHeader.slice(7))
      if (user) { req.user = user; return true }
    }
    if (apiKey) {
      const user = await prisma.user.findUnique({ where: { apiKey } })
      if (!user) throw new UnauthorizedException('Invalid API key')
      req.user = { id: user.id, email: user.email, name: user.name }
      return true
    }
    throw new UnauthorizedException('Authentication required')
  }
}
