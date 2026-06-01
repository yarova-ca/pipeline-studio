---
name: "[17 Java] Spring Boot 3.4 — service scaffold"
about: "Minimal runnable Spring Boot 3.4 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/17-spring-boot issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Spring Boot 3.4
**Category:** 17 Java
**Slug:** `17-spring-boot`
**Pattern:** Multi-stage Docker
**Language / Runtime:** java
**Package manager:** mvn
**Test runner:** mvn test
**Runtime image:** `gcr.io/distroless/java21-debian12`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Spring Boot 3.4`.

Companion issue in `pipeline-studio`: `[17 Java] Spring Boot 3.4 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/17-spring-boot/
├── .env.example
├── pom.xml
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
| `GET /` | `{"message":"Hello from Spring Boot 3.4","version":"1.0.0"}` |
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

Run: `mvn test`

---
## Build

**Command:** `mvn package -DskipTests`

**Output path:** `target/*.jar`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Java 21 LTS; Spring Boot Actuator for /health endpoints

---
## .env.example

```bash
SPRING_PROFILES_ACTIVE=development
SERVER_PORT=8080
```

---
## Local dev

```bash
mvn spring-boot:run
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`mvn install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`mvn test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`mvn package -DskipTests`)
- [ ] Build output exists at `target/*.jar`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
