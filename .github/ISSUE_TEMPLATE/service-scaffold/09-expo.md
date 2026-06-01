---
name: "[09 Cross-platform JS] Expo 52 — service scaffold"
about: "Minimal runnable Expo 52 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/09-expo issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Expo 52
**Category:** 09 Cross-platform JS
**Slug:** `09-expo`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** mobile-js
**Package manager:** npm
**Test runner:** jest
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Expo 52`.

Companion issue in `pipeline-studio`: `[09 Cross-platform JS] Expo 52 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/09-expo/
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

**Command:** `npx expo build`

**Output path:** `dist/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** No server — EAS Build produces APK/IPA

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
- [ ] Build succeeds (`npx expo build`)
- [ ] Build artifact exists at `dist/`
- [ ] `.env.example` present
