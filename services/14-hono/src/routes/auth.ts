// Auth routes for Hono — OAuth2 flow + API key management.
//
// GET  /auth/login      → redirect to GitHub OAuth
// GET  /auth/callback   → exchange code for JWT
// GET  /auth/me         → return current user (requires auth)
// POST /auth/logout     → clear session cookie
// POST /auth/api-key    → generate API key (requires auth)
// DELETE /auth/api-key  → revoke API key (requires auth)
// POST /dev/token       → issue test JWT (dev only)

import type { Context } from 'hono'
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import crypto from 'node:crypto'
import { prisma } from '../db/client.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = new Hono()

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

// ── OAuth2 login ───────────────────────────────────────────────────────────
router.get('/auth/login', (c: Context) => {
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_CALLBACK,
    scope: 'user:email',
    state: crypto.randomBytes(16).toString('hex'),
  })
  return c.redirect(`${GITHUB_AUTH_URL}?${params}`)
})

// ── OAuth2 callback ────────────────────────────────────────────────────────
router.get('/auth/callback', async (c: Context) => {
  const code = c.req.query('code')
  if (!code) return c.json({ error: 'Missing OAuth code' }, 400)

  try {
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, code }),
    })
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) return c.json({ error: 'OAuth token exchange failed' }, 401)

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

    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 8 * 60 * 60,
    })
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch {
    return c.json({ error: 'OAuth callback failed' }, 500)
  }
})

// ── Current user ───────────────────────────────────────────────────────────
router.get('/auth/me', requireAuth, (c: Context) => {
  return c.json({ user: c.get('user') })
})

// ── Logout ─────────────────────────────────────────────────────────────────
router.post('/auth/logout', (c: Context) => {
  deleteCookie(c, 'token')
  return c.json({ message: 'Logged out' })
})

// ── Generate API key ───────────────────────────────────────────────────────
router.post('/auth/api-key', requireAuth, async (c: Context) => {
  const user = c.get('user')
  const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
  await prisma.user.update({ where: { id: user.id }, data: { apiKey } })
  return c.json({ apiKey })
})

// ── Revoke API key ─────────────────────────────────────────────────────────
router.delete('/auth/api-key', requireAuth, async (c: Context) => {
  const user = c.get('user')
  await prisma.user.update({ where: { id: user.id }, data: { apiKey: null } })
  return c.json({ message: 'API key revoked' })
})

// ── Dev token (development only) ───────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/token', async (c: Context) => {
    const body = await c.req.json<{ email?: string; name?: string }>()
    const email = body.email ?? 'dev@example.com'
    const name = body.name ?? 'Dev User'
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, provider: 'local' },
    })
    const token = signToken({ id: user.id, email: user.email, name: user.name })
    return c.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  })
}

export default router
