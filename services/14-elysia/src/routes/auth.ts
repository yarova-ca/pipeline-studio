// Auth routes for Elysia.
//
// GET  /auth/login      → redirect to GitHub OAuth
// GET  /auth/callback   → exchange code for JWT
// GET  /auth/me         → return current user (requires auth)
// POST /auth/logout     → clear session cookie
// POST /auth/api-key    → generate API key (requires auth)
// DELETE /auth/api-key  → revoke API key (requires auth)
// POST /dev/token       → issue test JWT (dev only)

import { Elysia } from 'elysia'
import crypto from 'node:crypto'
import { prisma } from '../db/client.js'
import { resolveUser, signToken } from '../middleware/auth.js'

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export const authRoutes = new Elysia()
  .get('/auth/login', () => {
    const params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_CALLBACK,
      scope: 'user:email',
      state: crypto.randomBytes(16).toString('hex'),
    })
    return new Response(null, {
      status: 302,
      headers: { Location: `${GITHUB_AUTH_URL}?${params}` },
    })
  })

  .get('/auth/callback', async ({ query }) => {
    const code = (query as Record<string, string>).code
    if (!code) return new Response(JSON.stringify({ error: 'Missing OAuth code' }), { status: 400 })
    try {
      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, code }),
      })
      const tokenData = (await tokenRes.json()) as { access_token?: string }
      if (!tokenData.access_token) return new Response(JSON.stringify({ error: 'OAuth token exchange failed' }), { status: 401 })
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
      const token = signToken({ id: user.id, email: user.email, name: user.name })
      return { token, user: { id: user.id, email: user.email, name: user.name } }
    } catch {
      return new Response(JSON.stringify({ error: 'OAuth callback failed' }), { status: 500 })
    }
  })

  .get('/auth/me', async ({ headers }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    return { user }
  })

  .post('/auth/logout', () => {
    return new Response(JSON.stringify({ message: 'Logged out' }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'token=; HttpOnly; Max-Age=0' },
    })
  })

  .post('/auth/api-key', async ({ headers }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
    await prisma.user.update({ where: { id: user.id }, data: { apiKey } })
    return { apiKey }
  })

  .delete('/auth/api-key', async ({ headers }) => {
    const user = await resolveUser(headers as { authorization?: string; 'x-api-key'?: string })
    await prisma.user.update({ where: { id: user.id }, data: { apiKey: null } })
    return { message: 'API key revoked' }
  })
