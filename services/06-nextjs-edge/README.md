# 06-nextjs-edge — Next.js Edge 16

**Category:** 06 Edge Rendering
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `npm run build`
Output: `dist/`

Deploys to Vercel Edge / Cloudflare Pages — no Docker

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

See official Next.js Edge docs for emulator / simulator setup.

## Tests

Run tests locally with: `vitest`
CI runs the same command via pipeline-studio `05-test.yml`.
