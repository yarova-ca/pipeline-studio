---
name: "[09 Cross-platform JS] Ionic 8 — service scaffold"
about: "Minimal runnable Ionic 8 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/09-ionic issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Ionic 8
**Category:** 09 Cross-platform JS
**Slug:** `09-ionic`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** mobile-js
**Package manager:** npm
**Test runner:** jest
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Ionic 8`.

Companion issue in `pipeline-studio`: `[09 Cross-platform JS] Ionic 8 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/09-ionic/
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

**Command:** `npm run build`

**Output path:** `www/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Capacitor builds APK/IPA from www/ output

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
- [ ] Build succeeds (`npm run build`)
- [ ] Build artifact exists at `www/`
- [ ] `.env.example` present
