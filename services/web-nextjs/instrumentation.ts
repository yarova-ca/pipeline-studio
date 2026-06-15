// Next.js runs register() once at server start (not at build).
// I-1: validate config here so a misconfigured SSR app fails loud and exits.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateConfig } = await import('./src/config')
    validateConfig()
  }
}
