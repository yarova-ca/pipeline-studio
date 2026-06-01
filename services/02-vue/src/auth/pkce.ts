// PKCE auth for SPA — runs entirely in browser
// No server needed — uses Authorization Code with PKCE
//
// Storage: tokens stored in sessionStorage (not localStorage)
// Why sessionStorage: tokens cleared when tab closes, reducing exposure window

export class PKCEAuth {
  constructor(
    private clientId: string,
    private authorizationEndpoint: string,
    private tokenEndpoint: string,
    private redirectUri: string,
  ) {}

  async startLogin(): Promise<void> {
    const verifier = this.generateVerifier()
    const challenge = await this.generateChallenge(verifier)
    sessionStorage.setItem('pkce_verifier', verifier)
    const url = new URL(this.authorizationEndpoint)
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
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
      }),
    })
    const data = await res.json()
    sessionStorage.setItem('access_token', data.access_token)
    return data.access_token
  }

  private generateVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, (c) =>
      ({ '+': '-', '/': '_', '=': '' }[c] ?? c)
    )
  }

  private async generateChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/[+/=]/g, (c) =>
      ({ '+': '-', '/': '_', '=': '' }[c] ?? c)
    )
  }
}
