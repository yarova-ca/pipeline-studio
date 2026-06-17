import { json } from '@sveltejs/kit'

// I-3 / I-4: protected. The access token lives in an httpOnly cookie (C-4),
// never in client JS. The SSR forwards it to the BFF as a Bearer token.
// No token -> 401. A token the BFF rejects -> 401.
//
// I-6: the request body is validated against a STRICT allow-list. Any field
// not in the allow-list is rejected with 400 before the BFF is ever called.
// SvelteKit ships no zod, so the strict check is done by hand (zod .strict()
// equivalent): reject any key outside ALLOWED.
const ALLOWED = new Set(['theme', 'locale'])

function validateStrict(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'body must be an object' }
  }
  for (const key of Object.keys(body)) {
    if (!ALLOWED.has(key)) {
      return { ok: false, error: `unknown field: ${key}` }
    }
  }
  if (body.theme !== 'light' && body.theme !== 'dark') {
    return { ok: false, error: 'theme must be light or dark' }
  }
  if (typeof body.locale !== 'string' || body.locale.length < 2 || body.locale.length > 10) {
    return { ok: false, error: 'locale must be a 2-10 char string' }
  }
  return { ok: true, data: { theme: body.theme, locale: body.locale } }
}

export async function POST({ request, cookies }) {
  const token = cookies.get('access_token')
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 })

  let raw
  try {
    raw = await request.json()
  } catch {
    return json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const result = validateStrict(raw)
  if (!result.ok) {
    return json({ error: 'invalid body', detail: result.error }, { status: 400 })
  }

  const res = await fetch(`${process.env.BFF_URL}/users/me/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(result.data),
  })
  if (res.status === 401 || res.status === 403) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!res.ok) return json({ error: 'upstream error' }, { status: 502 })
  return json(await res.json())
}
