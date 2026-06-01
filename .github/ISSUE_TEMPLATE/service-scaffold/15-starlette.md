---
name: "[15 Python] Starlette 0.41 — service scaffold"
about: "Minimal runnable Starlette 0.41 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/15-starlette issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Starlette 0.41
**Category:** 15 Python
**Slug:** `15-starlette`
**Pattern:** Multi-stage Docker
**Language / Runtime:** python
**Package manager:** pip
**Test runner:** pytest
**Runtime image:** `python:3.12-slim`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Starlette 0.41`.

Companion issue in `pipeline-studio`: `[15 Python] Starlette 0.41 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/15-starlette/
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
| `GET /` | `{"message":"Hello from Starlette 0.41","framework":"15-starlette","version":"1.0.0"}` |
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

**Docker CMD match:** `uvicorn main:app --host 0.0.0.0 --port 8080`

**Extra setup:** Python 3.12 LTS; uvicorn[standard]; httpx for testing

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
- [ ] Docker CMD `uvicorn main:app --host 0.0.0.0 --port 8080` resolves correctly after build
