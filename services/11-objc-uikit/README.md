# 11-objc-uikit — Objective-C UIKit SDK 17

**Category:** 11 Native iOS
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `xcodebuild -scheme App -configuration Release`
Output: `build/Release-iphoneos/`

macOS runner required; outputs IPA

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

See official Objective-C UIKit docs for emulator / simulator setup.

## Tests

Run tests locally with: `xcodebuild test`
CI runs the same command via pipeline-studio `05-test.yml`.
