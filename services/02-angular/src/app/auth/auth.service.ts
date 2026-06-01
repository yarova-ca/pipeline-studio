import { Injectable, signal } from '@angular/core'
import { PKCEAuth } from './pkce'
import { environment } from '../../environments/environment'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly pkce = new PKCEAuth(
    environment.oauthClientId ?? '',
    environment.oauthAuthorizationEndpoint ?? '',
    environment.oauthTokenEndpoint ?? '',
    window.location.origin + '/callback',
  )

  readonly token = signal<string | null>(sessionStorage.getItem('access_token'))

  // Call once in AppComponent.ngOnInit to handle OAuth callback
  async handleCallback(): Promise<void> {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) {
      const t = await this.pkce.handleCallback(code)
      this.token.set(t)
      window.history.replaceState({}, '', '/')
    }
  }

  login(): void { this.pkce.startLogin() }

  logout(): void {
    sessionStorage.removeItem('access_token')
    this.token.set(null)
  }
}
