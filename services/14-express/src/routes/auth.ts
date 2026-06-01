// Auth routes — OAuth2 flow + API key management.
//
// OAuth2 flow (GitHub as example provider):
//   GET /auth/login      → redirect to GitHub OAuth
//   GET /auth/callback   → exchange code for JWT → set cookie
//   GET /auth/me         → return current user (requires auth)
//   POST /auth/logout    → clear session cookie
//
// API key routes:
//   POST /auth/api-key   → generate API key for current user (requires auth)
//   DELETE /auth/api-key → revoke API key for current user (requires auth)
//
// Dev-only route (NODE_ENV=development only):
//   POST /dev/token      → issue a test JWT without OAuth (dev only)

import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'
import { prisma } from '../db/client.js'
import { requireAuth, signToken } from '../middleware/auth.js'

const router = Router()

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

// ── OAuth2 login ───────────────────────────────────────────────────────────
router.get('/login', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_CALLBACK,
    scope: 'user:email',
    state: crypto.randomBytes(16).toString('hex'),
  })
  res.redirect(`${GITHUB_AUTH_URL}?${params}`)
})

// ── OAuth2 callback ────────────────────────────────────────────────────────
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code?: string }
  if (!code) {
    res.status(400).json({ error: 'Missing OAuth code' })
    return
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, code }),
    })
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string }
    if (!tokenData.access_token) {
      res.status(401).json({ error: 'OAuth token exchange failed' })
      return
    }

    // Fetch user profile from GitHub
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json' },
    })
    const profile = (await profileRes.json()) as { id: number; email?: string; name?: string; login: string }

    const email = profile.email ?? `${profile.login}@github.noreply`
    const name = profile.name ?? profile.login

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, provider: 'github' },
      create: { email, name, provider: 'github' },
    })

    const token = signToken({ id: user.id, email: user.email, name: user.name })

    // Return JWT as cookie + JSON
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    res.status(500).json({ error: 'OAuth callback failed' })
  }
})

// ── Current user ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user })
})

// ── Logout ─────────────────────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out' })
})

// ── Generate API key ───────────────────────────────────────────────────────
router.post('/api-key', requireAuth, async (req: Request, res: Response) => {
  const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { apiKey },
  })
  res.json({ apiKey })
})

// ── Revoke API key ─────────────────────────────────────────────────────────
router.delete('/api-key', requireAuth, async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { apiKey: null },
  })
  res.json({ message: 'API key revoked' })
})

// ── Dev token (development only) ───────────────────────────────────────────
// Why: OAuth2 requires a real provider. This endpoint issues a JWT without
// OAuth so developers can test protected routes locally.
// When NODE_ENV=production: this route returns 404.
if (process.env.NODE_ENV === 'development') {
  router.post('/dev/token', async (req: Request, res: Response) => {
    const { email = 'dev@example.com', name = 'Dev User' } = req.body as { email?: string; name?: string }
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, provider: 'local' },
    })
    const token = signToken({ id: user.id, email: user.email, name: user.name })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  })
}

export default router
