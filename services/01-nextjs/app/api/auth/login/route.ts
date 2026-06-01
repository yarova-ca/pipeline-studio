import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateCodeVerifier, generateCodeChallenge, buildAuthURL } from '../../../../src/auth/oauth'

export async function GET(request: Request) {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const redirectUri = `${new URL(request.url).origin}/api/auth/callback`

  const cookieStore = await cookies()
  cookieStore.set('pkce_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  const authUrl = buildAuthURL(process.env.OAUTH_CLIENT_ID ?? '', redirectUri, challenge)
  return NextResponse.redirect(authUrl)
}
