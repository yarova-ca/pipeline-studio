import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { bffUrl } from '../../../../src/config'

// I-3: a protected route. The access token lives in an httpOnly cookie (C-4),
// never in client JS. The SSR forwards it to the BFF as a Bearer token.
// No token → 401, no call to the BFF.
export async function GET() {
  const token = (await cookies()).get('access_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = await fetch(`${bffUrl()}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await res.json())
}
