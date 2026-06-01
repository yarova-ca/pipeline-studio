---
name: "[16 Go] Echo 4.12 — service scaffold"
about: "Minimal runnable Echo 4.12 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/16-echo issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Echo 4.12
**Category:** 16 Go
**Slug:** `16-echo`
**Pattern:** Multi-stage Docker
**Language / Runtime:** go
**Package manager:** go
**Test runner:** go test ./...
**Runtime image:** `scratch`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Echo 4.12`.

Companion issue in `pipeline-studio`: `[16 Go] Echo 4.12 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/16-echo/
├── .env.example
├── go.mod + go.sum
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

Go HTTP handlers (net/http or framework router):

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Echo 4.12","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** Go built-in `testing` package

File: `internal/health/health_test.go`

| Test | Assertion |
|---|---|
| `GET /` | status 200, body contains `message` |
| `GET /health` | status 200, body contains `status: ok` |
| `GET /health/live` | status 200, body contains `status: ok` |
| `GET /health/ready` | status 200, body contains `status: ok` |

Run: `go test ./...`

---
## Build

**Command:** `go build -o bin/app ./...`

**Output path:** `bin/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Go 1.23 LTS; CGO_ENABLED=0 for scratch image

---
## .env.example

```bash
APP_ENV=development
PORT=8080
```

---
## Local dev

```bash
go run ./...
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`go install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`go test ./...`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`go build -o bin/app ./...`)
- [ ] Build output exists at `bin/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
