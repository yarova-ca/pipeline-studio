import { Request, Response } from 'express'
import { generateCodeVerifier, generateCodeChallenge, buildAuthURL } from '../../auth/oauth'

export function loginHandler(req: Request, res: Response): void {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const origin = `${req.protocol}://${req.get('host')}`
  const redirectUri = `${origin}/auth/callback`

  res.cookie('pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 300_000,
    path: '/',
  })

  const authUrl = buildAuthURL(process.env['OAUTH_CLIENT_ID'] ?? '', redirectUri, challenge)
  res.redirect(authUrl)
}

export async function callbackHandler(req: Request, res: Response): Promise<void> {
  const code = req.query['code'] as string | undefined
  if (!code) { res.status(400).json({ error: 'missing code' }); return }

  const verifier = req.cookies?.['pkce_verifier'] as string | undefined
  if (!verifier) { res.status(400).json({ error: 'missing verifier' }); return }

  res.clearCookie('pkce_verifier')
  const origin = `${req.protocol}://${req.get('host')}`
  const redirectUri = `${origin}/auth/callback`

  const tokenRes = await fetch(`${process.env['OAUTH_ISSUER']}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: verifier,
      client_id: process.env['OAUTH_CLIENT_ID'] ?? '',
      redirect_uri: redirectUri,
    }),
  })
  const tokens = await tokenRes.json()

  res.cookie('access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  })
  res.redirect('/')
}
