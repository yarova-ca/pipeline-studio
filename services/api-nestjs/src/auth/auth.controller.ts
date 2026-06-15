// Auth controller — OAuth2 flow + API key management.
//
// GET  /auth/login      → redirect to GitHub OAuth
// GET  /auth/callback   → exchange code for JWT
// GET  /auth/me         → return current user (requires auth)
// POST /auth/logout     → clear session cookie
// POST /auth/api-key    → generate API key (requires auth)
// DELETE /auth/api-key  → revoke API key (requires auth)
// POST /dev/token       → issue test JWT (dev only)

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import crypto from 'node:crypto'
import { AuthService } from './auth.service'
import { AuthGuard } from './auth.guard'
import { prisma } from '../db/client'

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  login(@Res() res: Response) {
    const params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_CALLBACK,
      scope: 'user:email',
      state: crypto.randomBytes(16).toString('hex'),
    })
    res.redirect(`${GITHUB_AUTH_URL}?${params}`)
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      res.status(400).json({ error: 'Missing OAuth code' })
      return
    }
    try {
      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, code }),
      })
      const tokenData = (await tokenRes.json()) as { access_token?: string }
      if (!tokenData.access_token) {
        res.status(401).json({ error: 'OAuth token exchange failed' })
        return
      }
      const profileRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
      })
      const profile = (await profileRes.json()) as { login: string; email?: string; name?: string }
      const email = profile.email ?? `${profile.login}@github.noreply`
      const name = profile.name ?? profile.login
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, provider: 'github' },
        create: { email, name, provider: 'github' },
      })
      const token = this.authService.signToken({ id: user.id, email: user.email, name: user.name })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
      })
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
    } catch {
      res.status(500).json({ error: 'OAuth callback failed' })
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: Request) {
    return { user: req.user }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res() res: Response) {
    res.clearCookie('token')
    res.json({ message: 'Logged out' })
  }

  @Post('api-key')
  @UseGuards(AuthGuard)
  async generateApiKey(@Req() req: Request) {
    const user = req.user as { id: string }
    const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
    await prisma.user.update({ where: { id: user.id }, data: { apiKey } })
    return { apiKey }
  }

  @Delete('api-key')
  @UseGuards(AuthGuard)
  async revokeApiKey(@Req() req: Request) {
    const user = req.user as { id: string }
    await prisma.user.update({ where: { id: user.id }, data: { apiKey: null } })
    return { message: 'API key revoked' }
  }
}
