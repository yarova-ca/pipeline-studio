import { APIEvent } from '@solidjs/start/server'
import { generateCodeVerifier, generateCodeChallenge, buildAuthURL } from '../../../auth/oauth'

export async function GET({ request }: APIEvent) {
  const verifier = generateCodeVerifier()
  const challenge = generateCodeChallenge(verifier)
  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/auth/callback`
  const authUrl = buildAuthURL(process.env.OAUTH_CLIENT_ID ?? '', redirectUri, challenge)

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': `pkce_verifier=${verifier}; HttpOnly; SameSite=Lax; Max-Age=300; Path=/`,
    },
  })
}
