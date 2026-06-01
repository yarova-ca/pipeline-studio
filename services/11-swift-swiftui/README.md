# 11-swift-swiftui — Swift / SwiftUI 6

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

See official Swift / SwiftUI docs for emulator / simulator setup.

## Tests

Run tests locally with: `swift test`
CI runs the same command via pipeline-studio `05-test.yml`.
