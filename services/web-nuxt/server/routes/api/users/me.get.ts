import { parseCookies } from 'h3'

// I-3: protected. The token lives in an httpOnly cookie (C-4); the SSR forwards
// it to the BFF. No token → 401, no call to the BFF.
export default defineEventHandler(async (event) => {
  const token = parseCookies(event)['access_token']
  if (!token) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const res = await fetch(`${process.env.BFF_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  return await res.json()
})
