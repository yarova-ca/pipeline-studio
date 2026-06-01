---
name: "[10 Cross-platform non-JS] Kotlin Multiplatform 2.1 — service scaffold"
about: "Minimal runnable Kotlin Multiplatform 2.1 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/10-kmp issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Kotlin Multiplatform 2.1
**Category:** 10 Cross-platform non-JS
**Slug:** `10-kmp`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** android-native
**Package manager:** gradle
**Test runner:** ./gradlew test
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Kotlin Multiplatform 2.1`.

Companion issue in `pipeline-studio`: `[10 Cross-platform non-JS] Kotlin Multiplatform 2.1 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/10-kmp/
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

No HTTP health endpoints — CI-only artifact output. No server runs.

---
## Tests

**Test runner:** ./gradlew test

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server.

---
## Build

**Command:** `./gradlew assembleRelease`

**Output path:** `androidApp/build/outputs/apk/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Shared Kotlin code; Android + iOS targets

---
## .env.example

```bash
APP_ENV=development
PORT=3000
```

---
## Local dev

```bash
./gradlew run
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`gradle install` or equivalent)
- [ ] Unit tests passing (`./gradlew test`)
- [ ] Build succeeds (`./gradlew assembleRelease`)
- [ ] Build artifact exists at `androidApp/build/outputs/apk/`
- [ ] `.env.example` present
