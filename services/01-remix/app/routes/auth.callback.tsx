import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { exchangeCode } from '../../src/auth/oauth'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return new Response('missing code', { status: 400 })

  const cookieHeader = request.headers.get('Cookie') ?? ''
  const verifier = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('pkce_verifier='))
    ?.split('=')[1]

  if (!verifier) return new Response('missing verifier', { status: 400 })

  const redirectUri = `${url.origin}/auth/callback`
  const tokens = await exchangeCode(code, verifier, redirectUri)

  const headers = new Headers()
  headers.append('Set-Cookie', 'pkce_verifier=; Max-Age=0; Path=/')
  headers.append(
    'Set-Cookie',
    `access_token=${tokens.access_token}; HttpOnly; SameSite=Lax; Path=/`,
  )
  return redirect('/', { headers })
}
