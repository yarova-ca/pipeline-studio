import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { bffUrl } from '../../../../../src/config'

// I-3 / I-4: protected. The access token lives in an httpOnly cookie (C-4),
// never in client JS. The SSR forwards it to the BFF as a Bearer token.
// No token -> 401. A token the BFF rejects -> 401.
//
// I-6: the request body is parsed with a STRICT zod schema. Any unknown
// field is rejected with 400 before the BFF is ever called. .strict()
// makes zod fail on keys not declared in the schema.
const prefsSchema = z
  .object({
    theme: z.enum(['light', 'dark']),
    locale: z.string().min(2).max(10),
  })
  .strict()

export async function POST(request: Request) {
  const token = (await cookies()).get('access_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const parsed = prefsSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid body', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const res = await fetch(`${bffUrl()}/users/me/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
    cache: 'no-store',
  })
  if (res.status === 401 || res.status === 403) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }
  return NextResponse.json(await res.json())
}
