---
name: "[10 Cross-platform non-JS] Flutter 3.44 — service scaffold"
about: "Minimal runnable Flutter 3.44 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/10-flutter issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Flutter 3.44
**Category:** 10 Cross-platform non-JS
**Slug:** `10-flutter`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** flutter
**Package manager:** flutter
**Test runner:** flutter test
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Flutter 3.44`.

Companion issue in `pipeline-studio`: `[10 Cross-platform non-JS] Flutter 3.44 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/10-flutter/
├── .env.example
├── pubspec.yaml
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

**Test runner:** flutter test

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server.

---
## Build

**Command:** `flutter build apk --release`

**Output path:** `build/app/outputs/flutter-apk/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** No server — outputs APK/IPA/AppBundle

---
## .env.example

```bash
APP_ENV=development
PORT=3000
```

---
## Local dev

```bash
flutter run
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`flutter install` or equivalent)
- [ ] Unit tests passing (`flutter test`)
- [ ] Build succeeds (`flutter build apk --release`)
- [ ] Build artifact exists at `build/app/outputs/flutter-apk/`
- [ ] `.env.example` present
