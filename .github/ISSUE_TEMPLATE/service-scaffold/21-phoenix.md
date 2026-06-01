---
name: "[21 Elixir/BEAM] Phoenix 1.7 — service scaffold"
about: "Minimal runnable Phoenix 1.7 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/21-phoenix issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Phoenix 1.7
**Category:** 21 Elixir/BEAM
**Slug:** `21-phoenix`
**Pattern:** Multi-stage Docker
**Language / Runtime:** elixir
**Package manager:** mix
**Test runner:** mix test
**Runtime image:** `hexpm/elixir:1.17-erlang-27-debian-bookworm-slim`
**Port:** 4000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Phoenix 1.7`.

Companion issue in `pipeline-studio`: `[21 Elixir/BEAM] Phoenix 1.7 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/21-phoenix/
├── .env.example
├── mix.exs + mix.lock
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

Elixir/Phoenix route handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Phoenix 1.7","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** ExUnit

File: `test/app_web/controllers/health_controller_test.exs`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `mix test`

---
## Build

**Command:** `MIX_ENV=prod mix release`

**Output path:** `_build/prod/rel/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Elixir 1.17 + OTP 27 LTS; Phoenix LiveDashboard optional

---
## .env.example

```bash
MIX_ENV=dev
PHX_HOST=localhost
PORT=4000
```

---
## Local dev

```bash
mix phx.server
# → http://localhost:4000
```

---
## Checklist

- [ ] Dependencies installed (`mix install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`mix test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`MIX_ENV=prod mix release`)
- [ ] Build output exists at `_build/prod/rel/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
