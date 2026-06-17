import { parseCookies, readBody, createError } from 'h3'

// I-3/I-4: protected. The token lives in an httpOnly cookie (C-4); the SSR
// forwards it to the BFF. No token (or a token the BFF rejects) → 401.
// I-6: strict input. Only the known field `displayName` is accepted. Any
// unknown extra field → 400. We reject unknown keys explicitly (zod .strict()
// equivalent) so a tampered body can never smuggle fields through to the BFF.
const ALLOWED_FIELDS = new Set(['displayName'])

export default defineEventHandler(async (event) => {
  const token = parseCookies(event)['access_token']
  if (!token) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }

  const body = (await readBody(event)) as Record<string, unknown> | null
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Body must be a JSON object' })
  }

  const unknown = Object.keys(body).filter((k) => !ALLOWED_FIELDS.has(k))
  if (unknown.length > 0) {
    throw createError({ statusCode: 400, statusMessage: `Unknown field(s): ${unknown.join(', ')}` })
  }
  if (typeof body.displayName !== 'string' || body.displayName.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'displayName must be a non-empty string' })
  }

  const res = await fetch(`${process.env.BFF_URL}/users/me`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: body.displayName }),
  })
  if (!res.ok) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  return await res.json()
})
