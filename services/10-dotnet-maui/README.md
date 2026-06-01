# 10-dotnet-maui — .NET MAUI 10

**Category:** 10 Cross-platform non-JS
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `dotnet build -c Release`
Output: `bin/Release/`

No server — outputs APK/IPA/MSIX

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

See official .NET MAUI docs for emulator / simulator setup.

## Tests

Run tests locally with: `dotnet test`
CI runs the same command via pipeline-studio `05-test.yml`.
