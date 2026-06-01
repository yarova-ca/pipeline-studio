---
name: "[09 Cross-platform JS] React Native 0.79 — service scaffold"
about: "Minimal runnable React Native 0.79 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/09-react-native issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** React Native 0.79
**Category:** 09 Cross-platform JS
**Slug:** `09-react-native`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** mobile-js
**Package manager:** npm
**Test runner:** jest
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `React Native 0.79`.

Companion issue in `pipeline-studio`: `[09 Cross-platform JS] React Native 0.79 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/09-react-native/
├── .env.example
├── package.json
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

**Test runner:** jest

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server.

---
## Build

**Command:** `npx react-native build-android`

**Output path:** `android/app/build/outputs/apk/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** No server — outputs APK/IPA; health check via app ping endpoint

---
## .env.example

```bash
APP_ENV=development
PORT=3000
```

---
## Local dev

```bash
npm install && npm run dev
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`npm install` or equivalent)
- [ ] Unit tests passing (`jest`)
- [ ] Build succeeds (`npx react-native build-android`)
- [ ] Build artifact exists at `android/app/build/outputs/apk/`
- [ ] `.env.example` present
