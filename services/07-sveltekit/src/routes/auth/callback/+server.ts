import { redirect, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { exchangeCode } from '../../../auth/oauth'

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code')
  if (!code) throw error(400, 'missing code')

  const verifier = cookies.get('pkce_verifier')
  if (!verifier) throw error(400, 'missing verifier')

  cookies.delete('pkce_verifier', { path: '/' })
  const redirectUri = `${url.origin}/auth/callback`
  const tokens = await exchangeCode(code, verifier, redirectUri)

  cookies.set('access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  throw redirect(302, '/')
}
