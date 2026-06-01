---
name: "[23 PHP] Symfony 7.2 — service scaffold"
about: "Minimal runnable Symfony 7.2 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/23-symfony issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Symfony 7.2
**Category:** 23 PHP
**Slug:** `23-symfony`
**Pattern:** Multi-stage Docker
**Language / Runtime:** php
**Package manager:** composer
**Test runner:** ./vendor/bin/phpunit
**Runtime image:** `php:8.3-fpm-alpine`
**Port:** 9000

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Symfony 7.2`.

Companion issue in `pipeline-studio`: `[23 PHP] Symfony 7.2 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/23-symfony/
├── .env.example
├── composer.json
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

PHP route handlers (returned as JSON):

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Symfony 7.2","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** PHPUnit

File: `tests/Feature/HealthTest.php`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, JSON `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `./vendor/bin/phpunit`

---
## Build

**Command:** `composer install --no-dev`

**Output path:** `vendor/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** PHP 8.3 LTS; /health route in config/routes.yaml; php-fpm + nginx sidecar

---
## .env.example

```bash
APP_ENV=development
PORT=9000
```

---
## Local dev

```bash
php -S localhost:9000 public/index.php
# → http://localhost:9000
```

---
## Checklist

- [ ] Dependencies installed (`composer install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`./vendor/bin/phpunit`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`composer install --no-dev`)
- [ ] Build output exists at `vendor/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
