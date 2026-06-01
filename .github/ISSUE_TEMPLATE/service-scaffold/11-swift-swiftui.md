---
name: "[11 Native iOS] Swift / SwiftUI 6 — service scaffold"
about: "Minimal runnable Swift / SwiftUI 6 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/11-swift-swiftui issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Swift / SwiftUI 6
**Category:** 11 Native iOS
**Slug:** `11-swift-swiftui`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** ios-native
**Package manager:** swift
**Test runner:** swift test
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Swift / SwiftUI 6`.

Companion issue in `pipeline-studio`: `[11 Native iOS] Swift / SwiftUI 6 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/11-swift-swiftui/
├── .env.example
├── Package.swift
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

**Test runner:** swift test

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server.

---
## Build

**Command:** `xcodebuild -scheme App -configuration Release`

**Output path:** `build/Release-iphoneos/`

**Docker CMD match:** `N/A (no server — static or CI-only)`

**Extra setup:** macOS runner required; outputs IPA

---
## .env.example

```bash
APP_ENV=development
PORT=3000
```

---
## Local dev

```bash
swift run
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`swift install` or equivalent)
- [ ] Unit tests passing (`swift test`)
- [ ] Build succeeds (`xcodebuild -scheme App -configuration Release`)
- [ ] Build artifact exists at `build/Release-iphoneos/`
- [ ] `.env.example` present
