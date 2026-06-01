# 09-react-native — React Native 0.79

**Category:** 09 Cross-platform JS
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `npx react-native build-android`
Output: `android/app/build/outputs/apk/`

No server — outputs APK/IPA; health check via app ping endpoint

## Health check pattern

This app has no server port.
Kubernetes health probes do not apply.
CI verifies the build succeeds and tests pass.

For in-app health: implement a status screen that pings your backend
API `/health` endpoint and shows the result in the UI.

## Local dev

```
cp .env.example .env
# Fill in .env values
```

See official React Native docs for emulator / simulator setup.

## Tests

Run tests locally with: `jest`
CI runs the same command via pipeline-studio `05-test.yml`.
