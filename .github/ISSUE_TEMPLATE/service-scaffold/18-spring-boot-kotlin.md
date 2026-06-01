---
name: "[18 Kotlin] Spring Boot Kotlin 3.4 — service scaffold"
about: "Minimal runnable Spring Boot Kotlin 3.4 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/18-spring-boot-kotlin issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Spring Boot Kotlin 3.4
**Category:** 18 Kotlin
**Slug:** `18-spring-boot-kotlin`
**Pattern:** Multi-stage Docker
**Language / Runtime:** kotlin
**Package manager:** gradle
**Test runner:** ./gradlew test
**Runtime image:** `gcr.io/distroless/java21-debian12`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Spring Boot Kotlin 3.4`.

Companion issue in `pipeline-studio`: `[18 Kotlin] Spring Boot Kotlin 3.4 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/18-spring-boot-kotlin/
├── .env.example
├── build.gradle.kts
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
| `GET /` | `{"message":"Hello from Spring Boot Kotlin 3.4","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

Note: Spring Boot and Quarkus expose `/actuator/health` and `/q/health` — add `/health` alias route.

---
## Tests

**Test runner:** JUnit 5

File: `src/test/java/.../HealthControllerTest.java`

| Test | Assertion |
|---|---|
| `GET /` | status 200, response body non-empty |
| `GET /health` | status 200, `status` field present |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `./gradlew test`

---
## Build

**Command:** `./gradlew bootJar`

**Output path:** `build/libs/*.jar`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Kotlin 2.1 LTS; Spring Boot Actuator for /actuator/health

---
## .env.example

```bash
APP_ENV=development
PORT=8080
```

---
## Local dev

```bash
./gradlew run
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`gradle install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`./gradlew test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`./gradlew bootJar`)
- [ ] Build output exists at `build/libs/*.jar`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
