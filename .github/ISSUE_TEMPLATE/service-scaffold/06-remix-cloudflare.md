---
name: "[06 Edge Rendering] Remix Cloudflare 7 — service scaffold"
about: "Minimal runnable Remix Cloudflare 7 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/06-remix-cloudflare issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Remix Cloudflare 7
**Category:** 06 Edge Rendering
**Slug:** `06-remix-cloudflare`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** edge
**Package manager:** npm
**Test runner:** vitest
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Remix Cloudflare 7`.

Companion issue in `pipeline-studio`: `[06 Edge Rendering] Remix Cloudflare 7 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/06-remix-cloudflare/
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

**Test runner:** vitest

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server.

---
## Build

**Command:** `npm run build`

**Output path:** `build/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Deploys to Cloudflare Pages — no Docker

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
- [ ] Unit tests passing (`vitest`)
- [ ] Build succeeds (`npm run build`)
- [ ] Build artifact exists at `build/`
- [ ] `.env.example` present
