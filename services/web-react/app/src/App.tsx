import { useEffect, useState } from 'react'

// C-3: the client calls only its own server. /compliance and /api/* are
// proxied to the BFF by the static server (same origin), so no third-party
// key is ever embedded and httpOnly auth cookies work.
export function App() {
  const [profile, setProfile] = useState<string>('…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/compliance')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bff error'))))
      .then((d) => setProfile(d.profile))
      .catch(() => setError('Could not reach the service. Please retry.'))
  }, [])

  return (
    <main>
      <h1>Yarova — React golden client</h1>
      <p>App name: {import.meta.env.PUBLIC_APP_NAME}</p>
      {error ? <p role="alert">{error}</p> : <p>Active industry profile (via BFF): {profile}</p>}
    </main>
  )
}
