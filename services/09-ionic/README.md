# 09-ionic — Ionic 8

**Category:** 09 Cross-platform JS
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `npm run build`
Output: `www/`

Capacitor builds APK/IPA from www/ output

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

See official Ionic docs for emulator / simulator setup.

## Tests

Run tests locally with: `jest`
CI runs the same command via pipeline-studio `05-test.yml`.
