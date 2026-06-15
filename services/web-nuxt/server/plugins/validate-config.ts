// I-1: validate config at server start; exit non-zero on failure.
export default defineNitroPlugin(() => {
  const bff = process.env.BFF_URL ?? ''
  const secret = process.env.SESSION_SECRET ?? ''
  if (!bff || secret.length < 32) {
    console.error('FATAL: BFF_URL must be set and SESSION_SECRET must be at least 32 characters')
    process.exit(1)
  }
})
