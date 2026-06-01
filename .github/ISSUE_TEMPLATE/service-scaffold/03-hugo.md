---
name: "[03 SSG] Hugo 0.161 — service scaffold"
about: "Minimal runnable Hugo 0.161 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/03-hugo issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Hugo 0.161
**Category:** 03 SSG
**Slug:** `03-hugo`
**Pattern:** Multi-stage Docker
**Language / Runtime:** hugo
**Package manager:** N/A
**Test runner:** N/A
**Runtime image:** `nginx:alpine`
**Port:** 80

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Hugo 0.161`.

Companion issue in `pipeline-studio`: `[03 SSG] Hugo 0.161 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/03-hugo/
├── .env.example
├── build files
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

**Test runner:** None

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `None`

---
## Build

**Command:** `hugo --minify`

**Output path:** `public/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Health endpoints: static JSON files in static/health/

---
## .env.example

```bash
APP_ENV=development
PORT=80
```

---
## Local dev

```bash
N/A run dev
# → http://localhost:80
```

---
## Checklist

- [ ] Dependencies installed (`None install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`None`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`hugo --minify`)
- [ ] Build output exists at `public/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
