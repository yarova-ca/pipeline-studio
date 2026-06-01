---
name: "[10 Cross-platform non-JS] .NET MAUI 10 — service scaffold"
about: "Minimal runnable .NET MAUI 10 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/10-dotnet-maui issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** .NET MAUI 10
**Category:** 10 Cross-platform non-JS
**Slug:** `10-dotnet-maui`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** dotnet-mobile
**Package manager:** dotnet
**Test runner:** dotnet test
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `.NET MAUI 10`.

Companion issue in `pipeline-studio`: `[10 Cross-platform non-JS] .NET MAUI 10 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/10-dotnet-maui/
├── .env.example
├── {name.lower()}.csproj
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

**Test runner:** dotnet test

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server.

---
## Build

**Command:** `dotnet build -c Release`

**Output path:** `bin/Release/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** No server — outputs APK/IPA/MSIX

---
## .env.example

```bash
APP_ENV=development
PORT=3000
```

---
## Local dev

```bash
dotnet run
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`dotnet install` or equivalent)
- [ ] Unit tests passing (`dotnet test`)
- [ ] Build succeeds (`dotnet build -c Release`)
- [ ] Build artifact exists at `bin/Release/`
- [ ] `.env.example` present
