---
name: "[19 .NET] ASP.NET Core 9 — service scaffold"
about: "Minimal runnable ASP.NET Core 9 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/19-aspnet-core issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** ASP.NET Core 9
**Category:** 19 .NET
**Slug:** `19-aspnet-core`
**Pattern:** Multi-stage Docker
**Language / Runtime:** dotnet
**Package manager:** dotnet
**Test runner:** dotnet test
**Runtime image:** `mcr.microsoft.com/dotnet/aspnet:9.0-alpine`
**Port:** 8080

---
## Purpose

This issue tracks creating the minimal runnable starter app for `ASP.NET Core 9`.

Companion issue in `pipeline-studio`: `[19 .NET] ASP.NET Core 9 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/19-aspnet-core/
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

.NET health check middleware:

| Route | Response |
|---|---|
| `GET /` | `{"message":"Hello from ASP.NET Core 9","version":"1.0.0"}` |
| `GET /health` | `{"status":"Healthy"}` |
| `GET /health/live` | `{"status":"Healthy"}` |
| `GET /health/ready` | `{"status":"Healthy"}` |

Use `app.MapHealthChecks("/health")` with `AddHealthChecks()` in Program.cs.

---
## Tests

**Test runner:** xUnit

File: `Tests/HealthTests.cs`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, `status: Healthy` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `dotnet test`

---
## Build

**Command:** `dotnet publish -c Release -o out`

**Output path:** `out/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** .NET 9 LTS; Microsoft.Extensions.Diagnostics.HealthChecks built-in

---
## .env.example

```bash
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://+:8080
```

---
## Local dev

```bash
dotnet run
# → http://localhost:8080
```

---
## Checklist

- [ ] Dependencies installed (`dotnet install` or equivalent)
- [ ] Hello world route `GET /` returns `200` with JSON body
- [ ] Health route `GET /health` returns `{"status":"ok"}`
- [ ] Liveness route `GET /health/live` returns `{"status":"ok"}`
- [ ] Readiness route `GET /health/ready` returns `{"status":"ok"}`
- [ ] All tests passing (`dotnet test`)
- [ ] `.env.example` present with all required variables
- [ ] Build succeeds (`dotnet publish -c Release -o out`)
- [ ] Build output exists at `out/`
- [ ] Build output path matches Dockerfile `COPY --from=build` instruction
