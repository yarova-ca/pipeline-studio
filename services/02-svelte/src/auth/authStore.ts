// Svelte store for PKCE auth
import { writable } from 'svelte/store'
import { PKCEAuth } from './pkce'

const auth = new PKCEAuth(
  import.meta.env.VITE_OAUTH_CLIENT_ID ?? '',
  import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT ?? '',
  import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT ?? '',
  window.location.origin + '/callback',
)

export const token = writable<string | null>(sessionStorage.getItem('access_token'))

// Handle OAuth callback — call once on app init
export async function initAuth(): Promise<void> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (code) {
    const t = await auth.handleCallback(code)
    token.set(t)
    window.history.replaceState({}, '', '/')
  }
}

export function login(): void { auth.startLogin() }

export function logout(): void {
  sessionStorage.removeItem('access_token')
  token.set(null)
}
