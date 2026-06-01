---
name: "[26 Clojure] Pedestal 0.7 — service scaffold"
about: "Minimal runnable Pedestal 0.7 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/26-pedestal issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Pedestal 0.7
**Category:** 26 Clojure
**Slug:** `26-pedestal`
**Pattern:** Multi-stage Docker
**Language / Runtime:** clojure
**Package manager:** lein
**Test runner:** lein test
**Runtime image:** `gcr.io/distroless/java21-debian12`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Pedestal 0.7`.

Companion issue in `pipeline-studio`: `[26 Clojure] Pedestal 0.7 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/26-pedestal/
├── .env.example
├── project.clj
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
| `GET /` | `{"message":"Hello from Pedestal 0.7","version":"1.0.0"}` |
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

Run: `lein test`

---
## Build

**Command:** `lein uberjar`

**Output path:** `target/*-standalone.jar`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Clojure 1.12 LTS + Java 21; /health interceptor in service map

---
## .env.example

```bash
APP_ENV=development
PORT=8080
```

---
## Local dev

```bash
lein ring server
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`lein install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`lein test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`lein uberjar`)
- [ ] Build output exists at `target/*-standalone.jar`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
