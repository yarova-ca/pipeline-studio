import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { generateCodeVerifier, generateCodeChallenge, buildAuthURL } from '../../../auth/oauth'

export const GET: RequestHandler = ({ url, cookies }) => {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const redirectUri = `${url.origin}/auth/callback`

  cookies.set('pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  const authUrl = buildAuthURL(process.env.OAUTH_CLIENT_ID ?? '', redirectUri, challenge)
  throw redirect(302, authUrl)
}
