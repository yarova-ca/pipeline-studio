# Yarova Golden Service — Invariants

**What this is:** the law every service holds. Fellow-level bar.
**When to read:** before writing or reviewing any service.

An invariant is a property that always holds.
Each one names: the guarantee, what enforces it, what checks it.
A service is "done" only when every invariant has a passing test.

---

## A. Configuration & secrets

**I-1. The service refuses to boot on missing or weak config.**
Enforced: a typed config schema validated at startup; process exits non-zero on failure.
Checked: a test boots with `JWT_SECRET` unset and asserts a non-zero exit.
Why: a misconfigured service must fail loud, not run insecure.

**I-2. No secret is hardcoded or logged.**
Enforced: secrets come only from env; the logger redacts known secret keys.
Checked: gitleaks in CI; a test logs a secret field and asserts it is redacted.

---

## B. Authentication & authorization

**I-3. Every route is authenticated by default.**
Enforced: a global auth guard; a `@Public()` decorator is the explicit opt-out.
Checked: a test hits a protected route with no token and asserts 401.

**I-4. An invalid or expired token never reaches a handler.**
Enforced: the guard verifies signature, `exp`, `iss`, and `aud`.
Checked: a test sends a tampered token and asserts 401.

**I-5. A user cannot access another user's resource.**
Enforced: an ownership check in the service layer, not the controller.
Checked: a test where user A requests user B's record asserts 403.

---

## C. Input & API contract

**I-6. Every request body is validated; unknown fields are rejected.**
Enforced: a global validation pipe with whitelist + forbidNonWhitelisted.
Checked: a test posts an extra field and asserts 400.

**I-7. The running API matches its published OpenAPI spec.**
Enforced: the spec is generated from the code (Swagger decorators).
Checked: a contract test diffs the live spec against the committed one.

---

## D. Errors

**I-8. No error is swallowed.**
Enforced: a global exception filter; no empty catch blocks.
Checked: a lint rule bans empty catch; tests cover each failure path.

**I-9. Internal errors never leak stack traces or secrets to clients.**
Enforced: the filter returns a safe typed shape in production.
Checked: a test forces a 500 and asserts the body has no stack trace.

---

## E. Health & lifecycle

**I-10. Liveness and readiness are separate and honest.**
`/health/live` is 200 only when the process is up.
`/health/ready` is 200 only when dependencies (DB) are reachable; 503 otherwise.
Checked: a test with the DB down asserts ready = 503, live = 200.

**I-11. The service drains and shuts down cleanly on SIGTERM.**
Enforced: shutdown hooks close the server and the DB pool.
Checked: a test sends SIGTERM and asserts a clean exit within the grace window.

---

## F. Observability

**I-12. Every log line is structured JSON with a request id.**
Enforced: pino plus a request-id middleware; `console.log` is banned.
Checked: a no-console lint rule; a test asserts the log shape.

**I-13. The four golden signals are exported as metrics.**
Latency, traffic, errors, saturation — at `/metrics` in Prometheus format.
Checked: a test asserts `http_request_duration_seconds` is present.

**I-14. Every request is traceable end to end.**
Enforced: OpenTelemetry spans, guarded by `OTEL_ENABLED`.
Checked: a trace test asserts a span per request when enabled.

---

## G. Data

**I-15. All database access goes through the ORM.**
Enforced: Prisma; raw unsafe SQL (`$queryRawUnsafe`) is banned by lint.
Checked: a lint/grep gate fails on raw unsafe SQL.

**I-16. Schema changes ship as versioned migrations.**
Enforced: `prisma migrate`; `db push` is never used in prod.
Checked: CI applies migrations from clean and asserts success.

---

## H. Transport & abuse

**I-17. Security headers are set on every response.**
Enforced: helmet middleware.
Checked: a test asserts the headers are present.

**I-18. Auth and write endpoints are rate limited.**
Enforced: a throttler on those routes.
Checked: a test exceeds the limit and asserts 429.

---

## I. Build & supply chain

**I-19. The image runs as a non-root user on a minimal base.**
Enforced: `USER` non-root in the Dockerfile; distroless or slim base.
Checked: a test asserts the container user is not root.

**I-20. The build is reproducible and attested.**
Enforced: a committed lockfile; the image is signed (cosign); an SBOM is attached (syft).
Checked: CI runs sign + SBOM steps and they pass.

**I-21. No high or critical CVE ships.**
Enforced: a Trivy scan gate in CI.
Checked: CI fails the build on a high or critical finding.

---

## J. Testing & CI

**I-22. Every invariant above has a test that fails if it is violated.**
Enforced: the service test suite.
Checked: CI runs the suite; coverage has a floor.

**I-23. CI is the enforcer; nothing merges red.**
Enforced: the workflows — lint, typecheck, test, scan, build — must pass.
Checked: branch protection requires the checks.

---

## The rule

A service is fellow-level only when all 23 hold, each with a passing test.
NestJS is the gold standard: it implements every one first.
Every other service copies this exact law.

---

## Architecture tiers — which invariants apply where

The 23 invariants above are server-shaped.
A pure client (browser app, mobile app, static site) has no DB, no readiness, no server auth guard.
So each framework maps to a tier, and the tier decides which invariants apply.

The principle: **every scenario is covered by real code, with no security gap.**
A client never holds data or secrets — its backend-for-frontend (BFF) does, and the BFF holds all 23.

| Tier | What it is | Frameworks | Invariants |
|---|---|---|---|
| A — Server | Owns data + auth. API, protocol, edge. | NestJS, FastAPI, Gin, Spring, ASP.NET, Axum, Rails, Laravel, Ktor, Phoenix, gRPC, GraphQL, WebSocket, Hono | All 23 (I-1…I-23) |
| B — Full-stack SSR | Has its own server tier + a rendered client. | Next.js, Nuxt, SvelteKit, Angular SSR | All 23 on the server routes + C-1…C-11 on the client |
| C — Pure frontend / static | No server of its own. Ships with a BFF. | React (SPA), Astro (static) | BFF is a Tier-A service (all 23) + C-1…C-11 on the client |
| D — Mobile client | Native/RN app. Ships with a BFF. | Expo, Flutter | BFF is a Tier-A service (all 23) + C-1…C-11 + M-1…M-4 on the app |

---

### The client invariants (C-1…C-11) — Tiers B, C, D

**C-1. No secret ships in the client bundle.**
Enforced: only `PUBLIC_`/`NEXT_PUBLIC_`-prefixed env reaches the client; a build scan greps the bundle.
Checked: a test greps the built bundle for known secret patterns and asserts none.

**C-2. The build fails on missing required public config.**
Enforced: a typed env schema validated at build time.
Checked: a build with a required public var unset asserts a non-zero exit.

**C-3. The client calls only its own server or BFF.**
Enforced: no third-party API key is embedded; all external calls proxy through the BFF.
Checked: a test asserts no hardcoded third-party token in the bundle.

**C-4. The auth token is stored securely.**
Web: httpOnly, Secure, SameSite cookie — never `localStorage`.
Mobile: Keychain (iOS) / Keystore (Android) — never plaintext.
Checked: a test asserts the token is not written to web storage / plaintext.

**C-5. Input is validated on the client and re-validated on the server.**
Enforced: client validation is UX only; the BFF is the real gate (I-6).
Checked: a test posts past the client and asserts the BFF rejects it.

**C-6. The served HTML sets security headers and a CSP.**
Enforced: the server/CDN sets CSP, `X-Content-Type-Options`, `Referrer-Policy`.
Checked: a test asserts the headers on the document response.

**C-7. No error is swallowed; every failure has a user-visible state.**
Enforced: error boundaries; no empty catch.
Checked: a test forces a fetch failure and asserts the error UI renders.

**C-8. Client telemetry is structured and carries no PII.**
Enforced: a typed logging/analytics wrapper; raw `console.log` is banned in prod.
Checked: a no-console lint rule; a test asserts no PII field is sent.

**C-9. The build is reproducible and dependency-audited.**
Enforced: a committed lockfile; `npm audit` / `pub` audit in CI.
Checked: CI fails on a high or critical advisory.

**C-10. The artifact is hardened.**
Web: the container runs as a non-root user on a minimal base.
Mobile: the release build is signed.
Checked: a test asserts the container user is not root / the build is signed.

**C-11. Every client invariant has a test, and CI enforces it.**
Enforced: the client test suite; the workflows must pass.
Checked: CI runs the suite; branch protection requires it.

---

### The mobile invariants (M-1…M-4) — Tier D only

**M-1. Secrets live in the platform secure store, never in the app bundle or source.**
Checked: a test asserts no API secret in the compiled bundle.

**M-2. The app pins or validates the BFF TLS certificate.**
Checked: a test asserts a connection to a mismatched cert is refused.

**M-3. The app degrades safely offline.**
Trigger: no network.
System: cached read-only state; writes queue or block with a clear message.
User sees: an explicit offline banner. User can: retry when back online.

**M-4. The release build strips debug logging and enables obfuscation.**
Checked: CI asserts the release flavor has debug disabled.

---

### How the BFF pairs with a client

For every Tier-C and Tier-D framework, the repo ships **two** runnable parts:

```
services/<name>/
  app/      the client (React / Astro / Expo / Flutter) — C + M invariants
  bff/      the backend-for-frontend (a Tier-A server) — all 23 invariants
```

The client talks only to its BFF.
The BFF holds the data, the auth, the integrations, the secrets.
This is how a "frontend" framework still reaches fellow-level: nothing is left insecure, every scenario has real code.
