// Vue composable for PKCE auth
import { ref } from 'vue'
import { PKCEAuth } from './pkce'

const auth = new PKCEAuth(
  import.meta.env.VITE_OAUTH_CLIENT_ID ?? '',
  import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT ?? '',
  import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT ?? '',
  window.location.origin + '/callback',
)

const token = ref<string | null>(sessionStorage.getItem('access_token'))

// Handle callback on app init — call this once in App.vue setup()
export async function initAuth(): Promise<void> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (code) {
    const t = await auth.handleCallback(code)
    token.value = t
    window.history.replaceState({}, '', '/')
  }
}

export function useAuth() {
  function login() { auth.startLogin() }

  function logout() {
    sessionStorage.removeItem('access_token')
    token.value = null
  }

  return { token, login, logout }
}
