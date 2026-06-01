---
name: "[22 Ruby] Sinatra 4.0 — service scaffold"
about: "Minimal runnable Sinatra 4.0 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/22-sinatra issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Sinatra 4.0
**Category:** 22 Ruby
**Slug:** `22-sinatra`
**Pattern:** Multi-stage Docker
**Language / Runtime:** ruby
**Package manager:** bundler
**Test runner:** bundle exec rspec
**Runtime image:** `ruby:3.3-alpine`
**Port:** 3000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Sinatra 4.0`.

Companion issue in `pipeline-studio`: `[22 Ruby] Sinatra 4.0 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/22-sinatra/
├── .env.example
├── Gemfile + Gemfile.lock
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

Ruby HTTP route handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Sinatra 4.0","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** RSpec

File: `spec/health_spec.rb`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `bundle exec rspec`

---
## Build

**Command:** `bundle install`

**Output path:** `vendor/bundle/`

**Docker CMD match:** `bundle exec rackup --host 0.0.0.0 --port 3000`

**Extra setup:** Ruby 3.3 LTS; rack health middleware for /health

---
## .env.example

```bash
RAILS_ENV=development
PORT=3000
```

---
## Local dev

```bash
bundle exec rackup
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`bundler install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`bundle exec rspec`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`bundle install`)
- [ ] Build output exists at `vendor/bundle/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `bundle exec rackup --host 0.0.0.0 --port 3000` resolves correctly after build
