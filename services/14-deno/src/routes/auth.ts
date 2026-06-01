// Auth routes for Deno Oak.
//
// GET  /auth/login      → redirect to GitHub OAuth
// GET  /auth/callback   → exchange code for JWT
// GET  /auth/me         → return current user (requires auth)
// POST /auth/logout     → clear session cookie
// POST /auth/api-key    → generate API key (requires auth)
// DELETE /auth/api-key  → revoke API key (requires auth)
// POST /dev/token       → issue test JWT (dev only)

import { Router } from '@oak/oak'
import { prisma } from '../db/client.ts'
import { requireAuth, signToken } from '../middleware/auth.ts'

const router = new Router()

const OAUTH_CLIENT_ID = Deno.env.get('AUTH_CLIENT_ID') ?? ''
const OAUTH_CLIENT_SECRET = Deno.env.get('AUTH_CLIENT_SECRET') ?? ''
const OAUTH_CALLBACK = Deno.env.get('AUTH_CALLBACK_URL') ?? 'http://localhost:8000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

// ── OAuth2 login ───────────────────────────────────────────────────────────
router.get('/auth/login', (ctx) => {
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_CALLBACK,
    scope: 'user:email',
  })
  ctx.response.redirect(`${GITHUB_AUTH_URL}?${params}`)
})

// ── OAuth2 callback ────────────────────────────────────────────────────────
router.get('/auth/callback', async (ctx) => {
  const code = ctx.request.url.searchParams.get('code')
  if (!code) {
    ctx.response.status = 400
    ctx.response.body = { error: 'Missing OAuth code' }
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
      ctx.response.status = 401
      ctx.response.body = { error: 'OAuth token exchange failed' }
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
    const token = await signToken({ id: user.id, email: user.email, name: user.name })
    ctx.response.body = { token, user: { id: user.id, email: user.email, name: user.name } }
  } catch {
    ctx.response.status = 500
    ctx.response.body = { error: 'OAuth callback failed' }
  }
})

// ── Current user ───────────────────────────────────────────────────────────
router.get('/auth/me', requireAuth, (ctx) => {
  ctx.response.body = { user: ctx.state.user }
})

// ── Logout ─────────────────────────────────────────────────────────────────
router.post('/auth/logout', (ctx) => {
  ctx.cookies.delete('token')
  ctx.response.body = { message: 'Logged out' }
})

// ── Generate API key ───────────────────────────────────────────────────────
router.post('/auth/api-key', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  const apiKey = `yar_${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('')}`
  await prisma.user.update({ where: { id: user.id }, data: { apiKey } })
  ctx.response.body = { apiKey }
})

// ── Revoke API key ─────────────────────────────────────────────────────────
router.delete('/auth/api-key', requireAuth, async (ctx) => {
  const user = ctx.state.user as { id: string }
  await prisma.user.update({ where: { id: user.id }, data: { apiKey: null } })
  ctx.response.body = { message: 'API key revoked' }
})

// ── Dev token (development only) ───────────────────────────────────────────
if (Deno.env.get('NODE_ENV') === 'development') {
  router.post('/dev/token', async (ctx) => {
    const body = (await ctx.request.body.json()) as { email?: string; name?: string }
    const email = body.email ?? 'dev@example.com'
    const name = body.name ?? 'Dev User'
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, provider: 'local' },
    })
    const token = await signToken({ id: user.id, email: user.email, name: user.name })
    ctx.response.body = { token, user: { id: user.id, email: user.email, name: user.name } }
  })
}

export default router
