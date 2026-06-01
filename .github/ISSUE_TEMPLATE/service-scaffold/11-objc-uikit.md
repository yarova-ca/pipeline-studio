---
name: "[11 Native iOS] Objective-C UIKit SDK 17 — service scaffold"
about: "Minimal runnable Objective-C UIKit SDK 17 service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/11-objc-uikit issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** Objective-C UIKit SDK 17
**Category:** 11 Native iOS
**Slug:** `11-objc-uikit`
**Pattern:** CI-only (no Docker)
**Language / Runtime:** ios-native
**Package manager:** xcode
**Test runner:** xcodebuild test
**Runtime image:** `N/A — CI-only artifact`
**Port:** N/A

---
## Purpose

This issue tracks creating the minimal runnable starter app for `Objective-C UIKit SDK 17`.

Companion issue in `pipeline-studio`: `[11 Native iOS] Objective-C UIKit SDK 17 — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/11-objc-uikit/
├── .env.example
├── build files
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

**Test runner:** xcodebuild test

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
Open .xcodeproj in Xcode → Run
# → http://localhost:3000
```

---
## Checklist

- [ ] Dependencies installed (`xcode install` or equivalent)
- [ ] Unit tests passing (`xcodebuild test`)
- [ ] Build succeeds (`xcodebuild -scheme App -configuration Release`)
- [ ] Build artifact exists at `build/Release-iphoneos/`
- [ ] `.env.example` present
