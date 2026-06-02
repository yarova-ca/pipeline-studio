// OAuth2 + PKCE authentication for client-side apps.
// PKCE: Proof Key for Code Exchange — OAuth2 extension for browser apps without client secret.
// Stores tokens in sessionStorage (cleared when tab closes, reducing exposure window).

export class PKCEAuth {
  constructor(
    private clientId: string,
    private authEndpoint: string,
    private tokenEndpoint: string,
    private redirectUri: string,
  ) {}

  async login(): Promise<void> {
    const verifier = this.generateVerifier()
    const challenge = await this.generateChallenge(verifier)
    sessionStorage.setItem('pkce_verifier', verifier)
    const url = new URL(this.authEndpoint)
    url.searchParams.set('client_id', this.clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', this.redirectUri)
    url.searchParams.set('code_challenge', challenge)
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('scope', 'openid email profile')
    window.location.href = url.toString()
  }

  async handleCallback(code: string): Promise<string> {
    const verifier = sessionStorage.getItem('pkce_verifier')
    if (!verifier) throw new Error('No PKCE verifier found')
    sessionStorage.removeItem('pkce_verifier')
    const res = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: this.clientId, redirect_uri: this.redirectUri }),
    })
    const data = await res.json()
    sessionStorage.setItem('access_token', data.access_token)
    return data.access_token
  }

  getToken(): string | null { return sessionStorage.getItem('access_token') }
  logout(): void { sessionStorage.removeItem('access_token') }

  private generateVerifier(): string {
    const arr = new Uint8Array(32); crypto.getRandomValues(arr)
    return btoa(String.fromCharCode(...arr)).replace(/[+/=]/g, (c) => ({'+':'-','/':'_','=':''}[c] ?? c))
  }
  private async generateChallenge(v: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))
    return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/[+/=]/g, (c) => ({'+':'-','/':'_','=':''}[c] ?? c))
  }
}
