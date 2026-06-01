---
name: "[14 Node/Deno/Bun] Express 5.0 — service scaffold"
about: "Minimal runnable Express 5.0 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/14-express issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Express 5.0
**Category:** 14 Node/Deno/Bun
**Slug:** `14-express`
**Pattern:** Multi-stage Docker
**Language / Runtime:** nodejs-node
**Package manager:** npm
**Test runner:** jest
**Runtime image:** `node:22-alpine`
**Port:** 3000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Express 5.0`.

Companion issue in `pipeline-studio`: `[14 Node/Deno/Bun] Express 5.0 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/14-express/
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
| `GET /` | `{"message":"Hello from Express 5.0","framework":"14-express","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok","version":"1.0.0","uptime":<seconds>}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** jest

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `jest`

---
## Build

**Command:** `npm run build`

**Output path:** `dist/`

**Docker CMD match:** `node dist/index.js`

**Extra setup:** TypeScript; tsc compiles to dist/

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
- [ ] All tests passing (`jest`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`npm run build`)
- [ ] Build output exists at `dist/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `node dist/index.js` resolves correctly after build
