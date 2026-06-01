---
name: "[20 Rust] Axum 0.8 — service scaffold"
about: "Minimal runnable Axum 0.8 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/20-axum issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Axum 0.8
**Category:** 20 Rust
**Slug:** `20-axum`
**Pattern:** Multi-stage Docker
**Language / Runtime:** rust
**Package manager:** cargo
**Test runner:** cargo test
**Runtime image:** `scratch`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Axum 0.8`.

Companion issue in `pipeline-studio`: `[20 Rust] Axum 0.8 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/20-axum/
├── .env.example
├── Cargo.toml
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

Rust async HTTP handlers:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from Axum 0.8","version":"1.0.0"}` |
| `GET /health` | `{"status":"ok"}` |
| `GET /health/live` | `{"status":"ok"}` |
| `GET /health/ready` | `{"status":"ok"}` |

---
## Tests

**Test runner:** built-in `#[tokio::test]`

File: `src/tests/health_test.rs`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `cargo test`

---
## Build

**Command:** `cargo build --release --target x86_64-unknown-linux-musl`

**Output path:** `target/x86_64-unknown-linux-musl/release/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** Rust 1.82 LTS (stable); musl target for scratch image

---
## .env.example

```bash
RUST_LOG=debug
PORT=8080
```

---
## Local dev

```bash
cargo run
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`cargo install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`cargo test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`cargo build --release --target x86_64-unknown-linux-musl`)
- [ ] Build output exists at `target/x86_64-unknown-linux-musl/release/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
