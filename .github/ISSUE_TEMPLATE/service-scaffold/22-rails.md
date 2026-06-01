---
name: "[22 Ruby] Rails 8.0 — service scaffold"
about: "Minimal runnable Rails 8.0 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/22-rails issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Rails 8.0
**Category:** 22 Ruby
**Slug:** `22-rails`
**Pattern:** Multi-stage Docker
**Language / Runtime:** ruby
**Package manager:** bundler
**Test runner:** bundle exec rspec
**Runtime image:** `ruby:3.3-alpine`
**Port:** 3000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Rails 8.0`.

Companion issue in `pipeline-studio`: `[22 Ruby] Rails 8.0 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/22-rails/
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
| `GET /` | `{"message":"Hello from Rails 8.0","version":"1.0.0"}` |
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

**Docker CMD match:** `bundle exec puma -C config/puma.rb`

**Extra setup:** Ruby 3.3 LTS; rails/health built-in at /up endpoint (Rails 7.1+)

---
## .env.example

```bash
RAILS_ENV=development
PORT=3000
```

---
## Local dev

```bash
bundle exec rails server
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
- [ ] Docker CMD `bundle exec puma -C config/puma.rb` resolves correctly after build
