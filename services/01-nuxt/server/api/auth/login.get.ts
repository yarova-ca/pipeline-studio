import { generateCodeVerifier, generateCodeChallenge, buildAuthURL } from '../../../src/auth/oauth'

export default defineEventHandler(async (event) => {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}/api/auth/callback`

  setCookie(event, 'pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  const authUrl = buildAuthURL(process.env.OAUTH_CLIENT_ID ?? '', redirectUri, challenge)
  return sendRedirect(event, authUrl)
})
