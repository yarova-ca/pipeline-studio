---
name: "[14 Node/Deno/Bun] Hono 4.7 — service scaffold"
about: "Minimal runnable Hono 4.7 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/14-hono issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Hono 4.7
**Category:** 14 Node/Deno/Bun
**Slug:** `14-hono`
**Pattern:** Multi-stage Docker
**Language / Runtime:** nodejs-node
**Package manager:** npm
**Test runner:** vitest
**Runtime image:** `node:22-alpine`
**Port:** 3000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Hono 4.7`.

Companion issue in `pipeline-studio`: `[14 Node/Deno/Bun] Hono 4.7 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/14-hono/
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
| `GET /` | `{"message":"Hello from Hono 4.7","framework":"14-hono","version":"1.0.0"}` |
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

**Output path:** `dist/`

**Docker CMD match:** `node dist/index.js`

**Extra setup:** @hono/node-server adapter; TypeScript

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
- [ ] Build output exists at `dist/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `node dist/index.js` resolves correctly after build
