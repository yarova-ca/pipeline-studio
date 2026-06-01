---
name: "[24 Swift Server] Vapor 4.121 — service scaffold"
about: "Minimal runnable Vapor 4.121 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/24-vapor issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Vapor 4.121
**Category:** 24 Swift Server
**Slug:** `24-vapor`
**Pattern:** Multi-stage Docker
**Language / Runtime:** swift-server
**Package manager:** swift
**Test runner:** swift test
**Runtime image:** `swift:6.0-noble-slim`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Vapor 4.121`.

Companion issue in `pipeline-studio`: `[24 Swift Server] Vapor 4.121 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/24-vapor/
├── .env.example
├── Package.swift
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

Swift HTTP route handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Vapor 4.121","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** Swift Testing / XCTest

File: `Tests/AppTests/HealthTests.swift`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `swift test`

---
## Build

**Command:** `swift build -c release`

**Output path:** `.build/release/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Swift 6.0 LTS; Vapor health route at GET /health

---
## .env.example

```bash
APP_ENV=development
PORT=8080
```

---
## Local dev

```bash
swift run
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`swift install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`swift test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`swift build -c release`)
- [ ] Build output exists at `.build/release/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
