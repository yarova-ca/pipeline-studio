---
name: "[04 Islands] Fresh 2.3 — service scaffold"
about: "Minimal runnable Fresh 2.3 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/04-fresh issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Fresh 2.3
**Category:** 04 Islands
**Slug:** `04-fresh`
**Pattern:** Multi-stage Docker
**Language / Runtime:** deno
**Package manager:** deno
**Test runner:** deno test
**Runtime image:** `denoland/deno:2.3-alpine`
**Port:** 8000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Fresh 2.3`.

Companion issue in `pipeline-studio`: `[04 Islands] Fresh 2.3 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/04-fresh/
├── .env.example
├── deno.json
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
| `GET /` | `{"message":"Hello from Fresh 2.3","framework":"04-fresh","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok","version":"1.0.0","uptime":<seconds>}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** deno test

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `deno test`

---
## Build

**Command:** `deno task build`

**Output path:** `_fresh/`

**Docker CMD match:** `deno task start`

**Extra setup:** deno.json tasks: build and start required

---
## .env.example

```bash
APP_ENV=development
PORT=8000
```

---
## Local dev

```bash
deno task dev
# → http://localhost:8000
```

---
## Checklist

- [ ] Dependencies installed (`deno install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`deno test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`deno task build`)
- [ ] Build output exists at `_fresh/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `deno task start` resolves correctly after build
