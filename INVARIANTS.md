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
