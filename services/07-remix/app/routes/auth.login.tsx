import { redirect } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { generateCodeVerifier, generateCodeChallenge, buildAuthURL } from '../../src/auth/oauth'

export async function loader({ request }: LoaderFunctionArgs) {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const url = new URL(request.url)
  const redirectUri = `${url.origin}/auth/callback`
  const authUrl = buildAuthURL(process.env.OAUTH_CLIENT_ID ?? '', redirectUri, challenge)

  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    `pkce_verifier=${verifier}; HttpOnly; SameSite=Lax; Max-Age=300; Path=/`,
  )
  return redirect(authUrl, { headers })
}
