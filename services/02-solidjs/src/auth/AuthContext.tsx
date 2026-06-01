// SolidJS context for PKCE auth
import { createContext, useContext, createSignal, onMount, ParentProps } from 'solid-js'
import { PKCEAuth } from './pkce'

const auth = new PKCEAuth(
  import.meta.env.VITE_OAUTH_CLIENT_ID ?? '',
  import.meta.env.VITE_OAUTH_AUTHORIZATION_ENDPOINT ?? '',
  import.meta.env.VITE_OAUTH_TOKEN_ENDPOINT ?? '',
  window.location.origin + '/callback',
)

type AuthCtx = { token: () => string | null; login: () => void; logout: () => void }
const AuthContext = createContext<AuthCtx>({ token: () => null, login: () => {}, logout: () => {} })

export function AuthProvider(props: ParentProps) {
  const [token, setToken] = createSignal<string | null>(sessionStorage.getItem('access_token'))

  onMount(async () => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) {
      const t = await auth.handleCallback(code)
      setToken(t)
      window.history.replaceState({}, '', '/')
    }
  })

  return (
    <AuthContext.Provider
      value={{
        token,
        login: () => auth.startLogin(),
        logout: () => { sessionStorage.removeItem('access_token'); setToken(null) },
      }}
    >
      {props.children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
