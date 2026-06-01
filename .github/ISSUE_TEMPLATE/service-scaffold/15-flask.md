---
name: "[15 Python] Flask 3.1 — service scaffold"
about: "Minimal runnable Flask 3.1 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/15-flask issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Flask 3.1
**Category:** 15 Python
**Slug:** `15-flask`
**Pattern:** Multi-stage Docker
**Language / Runtime:** python
**Package manager:** pip
**Test runner:** pytest
**Runtime image:** `python:3.12-slim`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Flask 3.1`.

Companion issue in `pipeline-studio`: `[15 Python] Flask 3.1 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/15-flask/
├── .env.example
├── requirements.txt
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

Python route handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Flask 3.1","framework":"15-flask","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok","version":"1.0.0"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** pytest

File: `tests/test_health.py`

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body["message"]` exists |
| `GET /health` | status 200, `body["status"] == "ok"` |
| `GET /health/live` | status 200, `body["status"] == "ok"` |
| `GET /health/ready` | status 200, `body["status"] == "ok"` |

Run: `pytest tests/`

---
## Build

**Command:** `pip install -r requirements.txt`

**Output path:** `venv/`

**Docker CMD match:** `gunicorn app:app --bind 0.0.0.0:8080`

**Extra setup:** Python 3.12 LTS; gunicorn; REPLACE app:app with module:Flask-instance

---
## .env.example

```bash
APP_ENV=development
PORT=8080
```

---
## Local dev

```bash
pip install -r requirements.txt && uvicorn main:app --reload
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`pip install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`pytest`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`pip install -r requirements.txt`)
- [ ] Build output exists at `venv/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
- [ ] Docker CMD `gunicorn app:app --bind 0.0.0.0:8080` resolves correctly after build
