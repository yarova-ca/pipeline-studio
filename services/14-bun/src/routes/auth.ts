// Auth routes for Bun native server.
//
// GET  /auth/login      → redirect to GitHub OAuth
// GET  /auth/callback   → exchange code for JWT
// GET  /auth/me         → return current user (requires auth)
// POST /auth/logout     → clear session cookie
// POST /auth/api-key    → generate API key (requires auth)
// DELETE /auth/api-key  → revoke API key (requires auth)
// POST /dev/token       → issue test JWT (dev only)

import crypto from 'node:crypto'
import { prisma } from '../db/client.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import type { AuthUser } from '../middleware/auth.js'

const OAUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID ?? ''
const OAUTH_CLIENT_SECRET = process.env.AUTH_CLIENT_SECRET ?? ''
const OAUTH_CALLBACK = process.env.AUTH_CALLBACK_URL ?? 'http://localhost:3000/auth/callback'
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

export async function handleAuthRoutes(req: Request, url: URL): Promise<Response | null> {
  const { pathname, method } = { pathname: url.pathname, method: req.method }

  // GET /auth/login
  if (method === 'GET' && pathname === '/auth/login') {
    const params = new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      redirect_uri: OAUTH_CALLBACK,
      scope: 'user:email',
      state: crypto.randomBytes(16).toString('hex'),
    })
    return Response.redirect(`${GITHUB_AUTH_URL}?${params}`, 302)
  }

  // GET /auth/callback
  if (method === 'GET' && pathname === '/auth/callback') {
    const code = url.searchParams.get('code')
    if (!code) return Response.json({ error: 'Missing OAuth code' }, { status: 400 })
    try {
      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: OAUTH_CLIENT_ID, client_secret: OAUTH_CLIENT_SECRET, code }),
      })
      const tokenData = (await tokenRes.json()) as { access_token?: string }
      if (!tokenData.access_token) return Response.json({ error: 'OAuth token exchange failed' }, { status: 401 })
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
      return Response.json({ token, user: { id: user.id, email: user.email, name: user.name } })
    } catch {
      return Response.json({ error: 'OAuth callback failed' }, { status: 500 })
    }
  }

  // GET /auth/me
  if (method === 'GET' && pathname === '/auth/me') {
    const result = await requireAuth(req)
    if (result instanceof Response) return result
    return Response.json({ user: result })
  }

  // POST /auth/logout
  if (method === 'POST' && pathname === '/auth/logout') {
    return new Response(JSON.stringify({ message: 'Logged out' }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'token=; HttpOnly; Max-Age=0' },
    })
  }

  // POST /auth/api-key
  if (method === 'POST' && pathname === '/auth/api-key') {
    const result = await requireAuth(req)
    if (result instanceof Response) return result
    const user = result as AuthUser
    const apiKey = `yar_${crypto.randomBytes(32).toString('hex')}`
    await prisma.user.update({ where: { id: user.id }, data: { apiKey } })
    return Response.json({ apiKey })
  }

  // DELETE /auth/api-key
  if (method === 'DELETE' && pathname === '/auth/api-key') {
    const result = await requireAuth(req)
    if (result instanceof Response) return result
    const user = result as AuthUser
    await prisma.user.update({ where: { id: user.id }, data: { apiKey: null } })
    return Response.json({ message: 'API key revoked' })
  }

  // POST /dev/token (dev only)
  if (method === 'POST' && pathname === '/dev/token' && process.env.NODE_ENV === 'development') {
    const body = (await req.json()) as { email?: string; name?: string }
    const email = body.email ?? 'dev@example.com'
    const name = body.name ?? 'Dev User'
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, provider: 'local' },
    })
    const token = signToken({ id: user.id, email: user.email, name: user.name })
    return Response.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  }

  return null
}
