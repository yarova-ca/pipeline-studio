// Lit mixin for PKCE auth — extend LitElement with this mixin
import type { LitElement, PropertyDeclarations } from 'lit'
import { PKCEAuth } from './pkce'

const auth = new PKCEAuth(
  (import.meta as Record<string, Record<string, string>>).env?.VITE_OAUTH_CLIENT_ID ?? '',
  (import.meta as Record<string, Record<string, string>>).env?.VITE_OAUTH_AUTHORIZATION_ENDPOINT ?? '',
  (import.meta as Record<string, Record<string, string>>).env?.VITE_OAUTH_TOKEN_ENDPOINT ?? '',
  window.location.origin + '/callback',
)

type Constructor<T = object> = new (...args: unknown[]) => T

export function AuthMixin<TBase extends Constructor<LitElement>>(Base: TBase) {
  return class extends Base {
    static get properties(): PropertyDeclarations {
      return {
        ...super.properties,
        authToken: { type: String },
      }
    }

    authToken: string | null = sessionStorage.getItem('access_token')

    override async connectedCallback() {
      super.connectedCallback()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        this.authToken = await auth.handleCallback(code)
        window.history.replaceState({}, '', '/')
      }
    }

    login(): void { auth.startLogin() }

    logout(): void {
      sessionStorage.removeItem('access_token')
      this.authToken = null
    }
  }
}
