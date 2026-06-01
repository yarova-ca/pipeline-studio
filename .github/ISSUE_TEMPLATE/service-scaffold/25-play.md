---
name: "[25 Scala] Play 3.0 — service scaffold"
about: "Minimal runnable Play 3.0 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/25-play issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Play 3.0
**Category:** 25 Scala
**Slug:** `25-play`
**Pattern:** Multi-stage Docker
**Language / Runtime:** scala
**Package manager:** sbt
**Test runner:** sbt test
**Runtime image:** `gcr.io/distroless/java21-debian12`
**Port:** 9000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Play 3.0`.

Companion issue in `pipeline-studio`: `[25 Scala] Play 3.0 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/25-play/
├── .env.example
├── build.sbt
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

JVM HTTP handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Play 3.0","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

Note: Spring Boot and Quarkus expose `/actuator/health` and `/q/health` — add `/health` alias route.

---
## Tests

**Test runner:** built-in (`sbt test` / `lein test`)

File: `src/test/.../HealthSpec` or `test/health_test.clj`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `sbt test`

---
## Build

**Command:** `sbt dist`

**Output path:** `target/universal/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Scala 3 LTS + Java 21; /health route in conf/routes

---
## .env.example

```bash
APP_ENV=development
PORT=9000
```

---
## Local dev

```bash
sbt run
# → http://localhost:9000
```

---
## Checklist

- [ ] Dependencies installed (`sbt install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`sbt test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`sbt dist`)
- [ ] Build output exists at `target/universal/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
