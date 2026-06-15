import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode } from '../../../../src/auth/oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'missing code' }, { status: 400 })

  const cookieStore = await cookies()
  const verifier = cookieStore.get('pkce_verifier')?.value
  if (!verifier) return NextResponse.json({ error: 'missing verifier' }, { status: 400 })

  cookieStore.delete('pkce_verifier')
  const redirectUri = `${url.origin}/api/auth/callback`
  const tokens = await exchangeCode(code, verifier, redirectUri)

  const response = NextResponse.redirect(url.origin)
  response.cookies.set('access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  return response
}
