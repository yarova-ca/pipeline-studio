---
name: "[14 Node/Deno/Bun] Elysia 1.2 — service scaffold"
about: "Minimal runnable Elysia 1.2 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/14-elysia issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Elysia 1.2
**Category:** 14 Node/Deno/Bun
**Slug:** `14-elysia`
**Pattern:** Multi-stage Docker
**Language / Runtime:** bun
**Package manager:** bun
**Test runner:** bun test
**Runtime image:** `oven/bun:1-alpine`
**Port:** 3000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Elysia 1.2`.

Companion issue in `pipeline-studio`: `[14 Node/Deno/Bun] Elysia 1.2 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/14-elysia/
├── .env.example
├── build files
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
| `GET /` | `{"message":"Hello from Elysia 1.2","framework":"14-elysia","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok","version":"1.0.0","uptime":<seconds>}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** bun test

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `bun test`

---
## Build

**Command:** `bun build src/index.ts --target bun --outfile dist/index.js`

**Output path:** `dist/`

**Docker CMD match:** `bun run dist/index.js`

**Extra setup:** Bun 1.x LTS; bun.lockb committed

---
## .env.example

```bash
NODE_ENV=development
PORT=3000
```

---
## Local dev

```bash
bun install && bun run dev
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`bun install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`bun test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`bun build src/index.ts --target bun --outfile dist/index.js`)
- [ ] Build output exists at `dist/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `bun run dist/index.js` resolves correctly after build
