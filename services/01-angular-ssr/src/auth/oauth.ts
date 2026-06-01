// OAuth2 + PKCE auth for SSR services
// Uses Authorization Code flow with PKCE — no client secret in browser.
//
// PKCE flow:
// 1. Generate code_verifier (random string)
// 2. Hash it to code_challenge (SHA256)
// 3. Send code_challenge to OAuth provider
// 4. OAuth returns code
// 5. Exchange code + code_verifier for tokens
// 6. Store tokens in httpOnly cookie (server-side)

import { randomBytes, createHash } from 'node:crypto'

export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url')
}

export function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url')
}

export function buildAuthURL(clientId: string, redirectUri: string, challenge: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return `${process.env['OAUTH_ISSUER']}/authorize?${params}`
}

export async function exchangeCode(
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<{ access_token: string; id_token: string }> {
  const res = await fetch(`${process.env['OAUTH_ISSUER']}/token`, {
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
  return res.json()
}
