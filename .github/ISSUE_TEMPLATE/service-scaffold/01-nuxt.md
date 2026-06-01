---
name: "[01 SSR/Hybrid] Nuxt 4.4 — service scaffold"
about: "Minimal runnable Nuxt 4.4 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/01-nuxt issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Nuxt 4.4
**Category:** 01 SSR/Hybrid
**Slug:** `01-nuxt`
**Pattern:** Multi-stage Docker
**Language / Runtime:** nodejs-node
**Package manager:** npm
**Test runner:** vitest
**Runtime image:** `node:22-alpine`
**Port:** 3000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Nuxt 4.4`.

Companion issue in `pipeline-studio`: `[01 SSR/Hybrid] Nuxt 4.4 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/01-nuxt/
├── .env.example
├── package.json
├── src/ (or equivalent source directory)
│   ├── main entry point
│   ├── GET / — hello world route
│   ├── GET /health
│   ├── GET /health/live
│   └── GET /health/ready
└── tests/ (or __tests__/ or spec/)
    └── health tests — 4 assertions
```

---
## Routes

HTTP route handlers in the app:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Nuxt 4.4","framework":"01-nuxt","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok","version":"1.0.0","uptime":<seconds>}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** vitest

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `vitest`

---
## Build

**Command:** `npm run build`

**Output path:** `.output/`

**Docker CMD match:** `node .output/server/index.mjs`

**Extra setup:** nitro preset: node-server in nuxt.config.ts

---
## .env.example

```bash
NODE_ENV=development
PORT=3000
```

---
## Local dev

```bash
npm install && npm run dev
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`npm install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`vitest`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`npm run build`)
- [ ] Build output exists at `.output/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `node .output/server/index.mjs` resolves correctly after build
