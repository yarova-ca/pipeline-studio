---
name: "[27 C/C++] Drogon 1.9.13 — service scaffold"
about: "Minimal runnable Drogon 1.9.13 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/27-drogon issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Drogon 1.9.13
**Category:** 27 C/C++
**Slug:** `27-drogon`
**Pattern:** Multi-stage Docker
**Language / Runtime:** cpp
**Package manager:** cmake
**Test runner:** ctest
**Runtime image:** `debian:12-slim`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Drogon 1.9.13`.

Companion issue in `pipeline-studio`: `[27 C/C++] Drogon 1.9.13 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/27-drogon/
├── .env.example
├── CMakeLists.txt
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

C++ HTTP route handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Drogon 1.9.13","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** CTest + GoogleTest

File: `tests/health_test.cpp`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `ctest --test-dir build`

---
## Build

**Command:** `cmake --build build --config Release`

**Output path:** `build/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** C++20; CMake 3.28; Drogon health controller at GET /health

---
## .env.example

```bash
APP_ENV=development
PORT=8080
```

---
## Local dev

```bash
cmake --build build && ./build/app
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`cmake install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`ctest`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`cmake --build build --config Release`)
- [ ] Build output exists at `build/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
