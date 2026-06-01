# 12-java-android — Java Android SDK 17

**Category:** 12 Native Android
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `./gradlew assembleRelease`
Output: `app/build/outputs/apk/release/`

JDK 21 required; outputs APK/AAB

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

See official Java Android SDK docs for emulator / simulator setup.

## Tests

Run tests locally with: `./gradlew test`
CI runs the same command via pipeline-studio `05-test.yml`.
