// Auth routes — OAuth2 flow + API key management.
//
// OAuth2 flow (GitHub as example provider):
//   GET /auth/login      → redirect to GitHub OAuth
//   GET /auth/callback   → exchange code for JWT → set cookie
//   GET /auth/me         → return current user (requires auth)
//   POST /auth/logout    → clear session cookie + revoke JWT
//   POST /auth/refresh   → issue a new JWT from a still-valid or recently-expired token
//
// API key routes:
//   POST /auth/api-key   → generate API key for current user (requires auth)
//   DELETE /auth/api-key → revoke API key for current user (requires auth)
//
// Dev-only route (NODE_ENV=development only):
//   POST /dev/token      → issue a test JWT without OAuth (dev only)

import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client.js'
import { requireAuth, signToken, revokeToken, type AuthUser } from '../middleware/auth.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

// JWT_SECRET is already validated in middleware/auth.ts at module load time.
// Re-read here for the refresh endpoint.
const JWT_SECRET = process.env.JWT_SECRET as string

// ── OAuth2 login ───────────────────────────────────────────────────────────
// Fix 9: Generate state param, store in httpOnly cookie for CSRF protection.
router.get('/login', (req: Request, res: Response) => {
  auditLog('login_initiated', null, req)
  const state = crypto.randomBytes(16).toString('hex')
  res.cookie('oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 600_000 })
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_CALLBACK,
    scope: 'user:email',
    state,
  })
  res.redirect(`${GITHUB_AUTH_URL}?${params}`)
})

// ── OAuth2 callback ────────────────────────────────────────────────────────
// Fix 9: Validate the state param against the cookie before processing the code.
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query as { code?: string; state?: string }

  // Validate OAuth state to prevent CSRF.
  if (!state || state !== req.cookies?.oauth_state) {
    auditLog('login_failure', null, req, { reason: 'oauth_state_mismatch' })
    res.status(400).json({ error: 'Invalid OAuth state — possible CSRF attack' })
    return
  }
  res.clearCookie('oauth_state')

  if (!code) {
    auditLog('login_failure', null, req, { reason: 'oauth_missing_code' })
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
      auditLog('login_failure', null, req, { reason: 'oauth_failed' })
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

    auditLog('login_success', user.id, req)
    auditLog('token_issued', user.id, req)

    // Return JWT as cookie + JSON
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    auditLog('login_failure', null, req, { reason: 'oauth_failed' })
    res.status(500).json({ error: 'OAuth callback failed' })
  }
})

// ── Current user ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user })
})

// ── Logout ─────────────────────────────────────────────────────────────────
// Fix 12: Revoke the Bearer token on logout so it can't be replayed.
// revokeToken is now async (Redis-backed).
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7)
  if (token) await revokeToken(token)
  auditLog('logout', req.user!.id, req)
  auditLog('token_revoked', req.user!.id, req)
  res.clearCookie('token')
  res.json({ message: 'Logged out' })
})

// ── Token refresh ──────────────────────────────────────────────────────────
// Fix 13: Allow clients to exchange a recently-expired token for a new one
// without forcing a full re-login. Tokens older than 24h cannot be refreshed.
router.post('/refresh', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Bearer token required' })
    return
  }
  const oldToken = authHeader.slice(7)
  try {
    // ignoreExpiration: true allows refreshing recently-expired tokens.
    const payload = jwt.verify(oldToken, JWT_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: true,
    }) as AuthUser
    const decoded = jwt.decode(oldToken) as { exp?: number }
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && now - decoded.exp > 86400) {
      res.status(401).json({ error: 'Token too old to refresh — please log in again' })
      return
    }
    const newToken = signToken({ id: payload.id, email: payload.email, name: payload.name })
    auditLog('token_refreshed', payload.id, req)
    res.json({ token: newToken })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// ── Generate API key ───────────────────────────────────────────────────────
router.post('/api-key', requireAuth, async (req: Request, res: Response) => {
  const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { apiKey },
  })
  auditLog('api_key_generated', req.user!.id, req)
  res.json({ apiKey })
})

// ── Revoke API key ─────────────────────────────────────────────────────────
router.delete('/api-key', requireAuth, async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { apiKey: null },
  })
  auditLog('api_key_revoked', req.user!.id, req)
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
