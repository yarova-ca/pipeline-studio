// Auth routes — OAuth2 flow + API key management (Fastify adapter).
//
// OAuth2 flow (GitHub as example provider):
//   GET /auth/login      → redirect to GitHub OAuth
//   GET /auth/callback   → exchange code for JWT → return token
//   GET /auth/me         → return current user (requires auth)
//   POST /auth/logout    → clear session cookie
//
// API key routes:
//   POST /auth/api-key   → generate API key for current user (requires auth)
//   DELETE /auth/api-key → revoke API key for current user (requires auth)
//
// Dev-only route (NODE_ENV=development only):
//   POST /dev/token      → issue a test JWT without OAuth (dev only)

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'node:crypto'
import { prisma } from '../db/client.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export async function authRoutes(fastify: FastifyInstance) {
  // ── OAuth2 login ─────────────────────────────────────────────────────────
  fastify.get('/auth/login', async (_req: FastifyRequest, reply: FastifyReply) => {
    const params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_CALLBACK,
      scope: 'user:email',
      state: crypto.randomBytes(16).toString('hex'),
    })
    reply.redirect(`${GITHUB_AUTH_URL}?${params}`)
  })

  // ── OAuth2 callback ───────────────────────────────────────────────────────
  fastify.get('/auth/callback', async (req: FastifyRequest, reply: FastifyReply) => {
    const { code } = req.query as { code?: string }
    if (!code) {
      reply.status(400).send({ error: 'Missing OAuth code' })
      return
    }
    try {
      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, code }),
      })
      const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
      if (!tokenData.access_token) {
        reply.status(401).send({ error: 'OAuth token exchange failed' })
        return
      }
      const profileRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
      })
      const profile = (await profileRes.json()) as { id: number; email?: string; name?: string; login: string }
      const email = profile.email ?? `${profile.login}@github.noreply`
      const name = profile.name ?? profile.login
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, provider: 'github' },
        create: { email, name, provider: 'github' },
      })
      const token = signToken({ id: user.id, email: user.email, name: user.name })
      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60,
      })
      reply.send({ token, user: { id: user.id, email: user.email, name: user.name } })
    } catch {
      reply.status(500).send({ error: 'OAuth callback failed' })
    }
  })

  // ── Current user ──────────────────────────────────────────────────────────
  fastify.get('/auth/me', { preHandler: requireAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    reply.send({ user: req.user })
  })

  // ── Logout ────────────────────────────────────────────────────────────────
  fastify.post('/auth/logout', async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token')
    reply.send({ message: 'Logged out' })
  })

  // ── Generate API key ──────────────────────────────────────────────────────
  fastify.post('/auth/api-key', { preHandler: requireAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
    await prisma.user.update({ where: { id: req.user!.id }, data: { apiKey } })
    reply.send({ apiKey })
  })

  // ── Revoke API key ────────────────────────────────────────────────────────
  fastify.delete('/auth/api-key', { preHandler: requireAuth }, async (req: FastifyRequest, reply: FastifyReply) => {
    await prisma.user.update({ where: { id: req.user!.id }, data: { apiKey: null } })
    reply.send({ message: 'API key revoked' })
  })

  // ── Dev token (development only) ──────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/dev/token', async (req: FastifyRequest, reply: FastifyReply) => {
      const { email = 'dev@example.com', name = 'Dev User' } = req.body as { email?: string; name?: string }
      const user = await prisma.user.upsert({
        where: { email },
        update: { name },
        create: { email, name, provider: 'local' },
      })
      const token = signToken({ id: user.id, email: user.email, name: user.name })
      reply.send({ token, user: { id: user.id, email: user.email, name: user.name } })
    })
  }
}
