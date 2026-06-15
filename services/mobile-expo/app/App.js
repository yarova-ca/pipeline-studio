import { useEffect, useState } from 'react'
import { Platform, Text, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// M-1 / C-4: the access token lives in the platform secure store — Keychain on
// iOS, Keystore on Android. Never AsyncStorage, never plaintext, never the
// bundle. On web (no secure enclave) the token is kept in memory only.
export async function saveToken(token) {
  if (Platform.OS === 'web') return // web build: no persistent token at rest
  await SecureStore.setItemAsync('access_token', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })
}

export async function readToken() {
  if (Platform.OS === 'web') return null
  return SecureStore.getItemAsync('access_token')
}

// C-1 / C-3: the BFF base URL is a public build value; the app calls only the
// BFF. No third-party secret is embedded.
const BFF = process.env.EXPO_PUBLIC_BFF_URL ?? ''

export default function App() {
  const [profile, setProfile] = useState('…')

  useEffect(() => {
    // C-7: a failed call shows a user-visible state, never silently swallowed.
    fetch(`${BFF}/compliance`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bff'))))
      .then((d) => setProfile(d.profile))
      .catch(() => setProfile('unavailable — retry'))
  }, [])

  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Yarova — Expo golden client</Text>
      <Text>Active industry profile (via BFF): {profile}</Text>
    </View>
  )
}
