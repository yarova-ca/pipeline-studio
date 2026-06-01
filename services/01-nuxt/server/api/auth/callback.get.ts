import { exchangeCode } from '../../../src/auth/oauth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string | undefined
  if (!code) {
    throw createError({ statusCode: 400, message: 'missing code' })
  }

  const verifier = getCookie(event, 'pkce_verifier')
  if (!verifier) {
    throw createError({ statusCode: 400, message: 'missing verifier' })
  }

  deleteCookie(event, 'pkce_verifier')
  const origin = getRequestURL(event).origin
  const redirectUri = `${origin}/api/auth/callback`
  const tokens = await exchangeCode(code, verifier, redirectUri)

  setCookie(event, 'access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return sendRedirect(event, '/')
})
