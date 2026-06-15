import { json } from '@sveltejs/kit'
// I-3: protected. Token in httpOnly cookie (C-4); forwarded to the BFF.
export async function GET({ cookies }) {
  const token = cookies.get('access_token')
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 })
  const res = await fetch(`${process.env.BFF_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return json({ error: 'Unauthorized' }, { status: 401 })
  return json(await res.json())
}
