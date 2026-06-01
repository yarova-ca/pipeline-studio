---
name: "[03 SSG] Astro 6.3 — service scaffold"
about: "Minimal runnable Astro 6.3 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/03-astro issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Astro 6.3
**Category:** 03 SSG
**Slug:** `03-astro`
**Pattern:** Multi-stage Docker
**Language / Runtime:** nodejs-nginx
**Package manager:** npm
**Test runner:** vitest
**Runtime image:** `nginx:alpine`
**Port:** 80

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Astro 6.3`.

Companion issue in `pipeline-studio`: `[03 SSG] Astro 6.3 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/03-astro/
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

Static JSON files (nginx serves them directly — no server-side routing in SPA/SSG):

```
public/
  health          → {"status":"ok","version":"1.0.0"}
  health/live     → {"status":"ok"}
  health/ready    → {"status":"ok"}
```

nginx config: `location /health { try_files $uri $uri/ =404; }`

---
## Tests

**Test runner:** vitest

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `vitest`

---
## Build

**Command:** `npm run build`

**Output path:** `dist/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Health endpoints: static JSON files in public/health/

---
## .env.example

```bash
NODE_ENV=development
PORT=80
```

---
## Local dev

```bash
npm install && npm run dev
# → http://localhost:80
```

---
## Checklist

- [ ] Dependencies installed (`npm install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`vitest`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`npm run build`)
- [ ] Build output exists at `dist/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
