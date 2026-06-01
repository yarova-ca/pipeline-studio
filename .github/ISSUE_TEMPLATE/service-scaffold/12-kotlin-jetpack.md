---
name: "[12 Native Android] Kotlin Jetpack Compose 2.0 — service scaffold"
about: "Minimal runnable Kotlin Jetpack Compose 2.0 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/12-kotlin-jetpack issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Kotlin Jetpack Compose 2.0
**Category:** 12 Native Android
**Slug:** `12-kotlin-jetpack`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** android-native
**Package manager:** gradle
**Test runner:** ./gradlew test
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Kotlin Jetpack Compose 2.0`.

Companion issue in `pipeline-studio`: `[12 Native Android] Kotlin Jetpack Compose 2.0 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/12-kotlin-jetpack/
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

**Output path:** `app/build/outputs/apk/release/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** JDK 21 required; outputs APK/AAB

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
- [ ] Build artifact exists at `app/build/outputs/apk/release/`
- [ ] `.env.example` present
