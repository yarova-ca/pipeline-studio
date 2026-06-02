# Authentication

Mobile authentication uses OAuth2 Authorization Code flow with PKCE.

## iOS/Android OAuth2 + PKCE

1. User taps "Sign In" → app opens system browser to OAuth provider
2. User authenticates in browser → provider redirects to app via deep link
3. App exchanges authorization code (+ PKCE code_verifier) for access token
4. Token stored in device secure storage (Keychain on iOS, Keystore on Android)

## Token storage

When iOS: use Keychain (`SecItemAdd` / `SecItemCopyMatching`)
When Android: use EncryptedSharedPreferences (Jetpack Security)

## Recommended libraries

| Platform | Library |
|---|---|
| Expo | expo-auth-session + expo-secure-store |
| React Native | @react-native-app-auth |
| Flutter | flutter_appauth + flutter_secure_storage |
| iOS Native | AppAuth-iOS |
| Android Native | AppAuth-Android |
| KMP | ktor-client + multiplatform-settings |
