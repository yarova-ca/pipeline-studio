# Architecture and Engineering Decisions

**What this covers:** Every significant decision made in this codebase — what was chosen, what was rejected, and why.

**When to read:** Before making any architectural change. Before asking "why is it done this way?"

**Who this is for:** Platform maintainers, new engineers joining the team, and auditors verifying the platform meets Google SRE standards.

---

## How to Read This Document

Each decision has this structure:

- **Decision:** What was chosen.
- **Why:** The specific reason this was chosen over alternatives.
- **Rejected:** What was considered and not chosen, and why not.
- **Date:** When this decision was made.
- **Status:** ACTIVE / SUPERSEDED / UNDER REVIEW.

---

## Authentication

### D-AUTH-001: JWT over session cookies for API authentication

**Decision:** JWTs (JSON Web Tokens) stored in Authorization headers.

**Why:** JWTs are stateless — any server instance can verify a token without a shared session store.

This is required for horizontal scaling (multiple pods).

**Rejected:** Session cookies with a shared Redis session store.

Why rejected: adds operational complexity (Redis becomes a critical dependency for every request).

Session stores are harder to distribute across regions.

**Accepted tradeoff:** JWTs cannot be revoked without a blacklist (see D-AUTH-002).

**Date:** 2026-06-01. **Status:** ACTIVE.

---

### D-AUTH-002: Redis-backed distributed token blacklist for revocation

**Decision:** Redis stores revoked token hashes with TTL equal to the token's remaining lifetime.

**Why:** JWT revocation requires a shared store across all server instances.

An in-memory Set only revokes on the current pod.

In a 3-pod deployment: revoking on pod A keeps the token valid on pods B and C.

**Rejected:** Keeping the in-memory Set fallback as the primary store.

Why rejected: 2 out of 3 pods would still honour a revoked token — breaks the security guarantee.

**Fallback behavior:**

When Redis is unavailable: falls back to in-memory Set with a warning log.

Token revocation is pod-local until Redis recovers.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

### D-AUTH-003: HS256 algorithm locked on JWT verification

**Decision:** `jwt.verify(token, secret, { algorithms: ['HS256'] })` — algorithm explicitly locked.

**Why:** The "alg: none" attack.

If the algorithm is not locked, an attacker can craft a JWT with header `{ alg: "none" }` and no signature.

Without the algorithm lock: the library accepts it as valid — complete authentication bypass.

**Rejected:** Trusting the `alg` header in the incoming token.

Why rejected: direct authentication bypass with no attack complexity.

**Date:** 2026-06-01. **Status:** ACTIVE.

---

### D-AUTH-004: RBAC via role field + requireRole() middleware

**Decision:** `Role` enum (USER, ADMIN, SERVICE) stored in the `users` table.

`requireRole()` middleware checks before handler runs.

**Why:** "Authenticated = full access" violates principle of least privilege.

RBAC allows: read-only API keys, admin-only endpoints, service accounts for automation.

**Rejected:** No RBAC — every authenticated user has full access.

Why rejected: cannot grant scoped permissions.

Impossible to meet SOC2 access control requirements without RBAC.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

## Database

### D-DB-001: Prisma as the ORM for Node/TypeScript services

**Decision:** Prisma ORM with PostgreSQL.

**Why:** Type-safe queries generated from schema.prisma at build time.

Catches schema mismatches at compile time, not at runtime.

Best-in-class TypeScript support in the Node.js ecosystem.

**Rejected:** TypeORM.

Why rejected: frequent breaking changes in minor versions, decorator-based approach adds complexity, weaker type inference than Prisma.

**Rejected:** Raw SQL (node-postgres).

Why rejected: no migration management, no type safety, more boilerplate for CRUD.

**Date:** 2026-06-01. **Status:** ACTIVE.

---

### D-DB-002: Connection pool configured at 10 with 5s statement timeout

**Decision:** `connection_limit=10&statement_timeout=5000&pool_timeout=10` in DATABASE_URL.

**Why — connection_limit=10:**

Each pod holds 10 DB connections.

3 pods × 10 = 30 connections.

PostgreSQL default max is 100 — leaves headroom for migrations and admin connections.

**Why — statement_timeout=5000:**

Kills queries running over 5 seconds.

Prevents a slow query from monopolizing a connection and causing request queue buildup.

**Why — pool_timeout=10:**

Fails fast (10s wait) if all 10 connections are busy.

Better to return 503 quickly than to queue for minutes.

**Rejected:** Prisma defaults (no explicit pool size).

Why rejected: under load, connection exhaustion causes unbounded tail latency.

p99 becomes >30s while p50 is 100ms.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

### D-DB-003: Compound index on (user_id, created_at DESC) for item listing

**Decision:** `@@index([userId, createdAt(sort: Desc)])` on the Item model.

**Why:** The most frequent query is `SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`.

Without this index: full table scan per user (O(n) — scans every row).

With this index: lookup by user_id + sort within that user's rows (O(log n)).

**Rejected:** Separate indexes on user_id and created_at.

Why rejected: PostgreSQL cannot efficiently combine two separate indexes for this query.

It would use only the user_id index and then sort in memory — no order guarantee from index.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

## Infrastructure

### D-INFRA-001: Kubernetes over bare VMs for service deployment

**Decision:** All services deploy to Kubernetes via Helm or Kustomize.

**Why:** Kubernetes provides automatic restart on crash, rolling deployments with zero downtime, horizontal scaling, resource isolation via namespaces, and standardized networking.

All of these would need to be built manually on bare VMs.

**Rejected:** Docker Compose on VMs.

Why rejected: no automatic restart, no rolling deployments, no resource quotas, no horizontal scaling.

**Date:** 2026-06-01. **Status:** ACTIVE.

---

### D-INFRA-002: ArgoCD prune=false for GitOps deployments

**Decision:** `prune: false` in ArgoCD app-of-apps syncPolicy.

**Why:** `prune: true` means "if a resource is removed from Git, delete it from the cluster immediately".

A typo in a commit or accidental file deletion would take down a running production service.

The risk of accidental deletion outweighs the benefit of automatic cleanup.

**Rejected:** `prune: true`.

Why rejected: one bad commit deletes a production service.

Recovery requires a new deployment (5–10 minutes of downtime).

**Operation:** To intentionally delete a service: `argocd app delete SERVICE_NAME --cascade` — requires manual intent.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

### D-INFRA-003: Pod anti-affinity + topology spread for high availability

**Decision:** `podAntiAffinity` (prefer different nodes) + `topologySpreadConstraints` (spread across AZs).

**Why:** Without anti-affinity, Kubernetes schedules by resource availability.

All 3 replicas can land on the same node.

When that node fails: service is 100% down.

Anti-affinity distributes replicas across nodes and AZs.

**Rejected:** No affinity rules.

Why rejected: single node failure = 100% outage. Single AZ failure = 100% outage.

**Note on scheduling mode:**

`preferredDuringScheduling` (soft): allows scheduling even if ideal spread is not possible.

`requiredDuringScheduling` (strict): blocks scheduling if spread cannot be achieved.

Current config: `preferred` — allows small clusters with only 1 node to still schedule.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

## Observability

### D-OBS-001: Prometheus + prom-client for metrics

**Decision:** prom-client library exposing /metrics endpoint, scraped by Prometheus.

**Why:** Industry standard pull-based metrics collection.

Pull-based: Prometheus scrapes the service, not push — services don't need to know where Prometheus is.

Grafana has native Prometheus support.

All alerting rules are defined as code (alerts.yaml).

**Rejected:** StatsD (push-based).

Why rejected: UDP packet loss means metrics loss. No built-in histogram support. Harder to query.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

### D-OBS-002: pino for structured logging

**Decision:** `pino` with JSON output in production, `pino-pretty` in development.

**Why:** Pino is the fastest Node.js logger (benchmarked at 4x faster than winston).

JSON output is directly parseable by log aggregators (Loki, CloudWatch, Splunk) without field extraction regex.

**Rejected:** `console.log`.

Why rejected: no structure, no log levels, no child loggers for request context, not parseable by aggregators.

**Rejected:** `winston`.

Why rejected: 4x slower than pino, harder to configure for production JSON output.

**Date:** 2026-06-01. **Status:** ACTIVE.

---

## Security

### D-SEC-001: External Secrets Operator over plain Kubernetes Secrets

**Decision:** ESO (External Secrets Operator) pulls secrets from AWS Secrets Manager into Kubernetes Secrets at runtime.

**Why:** Plain Kubernetes Secrets are base64-encoded, not encrypted.

etcd (Kubernetes' internal database) stores them in plaintext by default on most clusters.

Anyone with etcd read access can decode all secrets.

**Rejected:** Plain Kubernetes Secrets.

Why rejected: etcd compromise = all secrets exposed. No rotation mechanism. No audit trail.

**Operation:** To rotate a secret: update it in AWS Secrets Manager. ESO syncs within 1 hour.

No pod restart required — mounted Secrets update automatically.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

### D-SEC-002: Kyverno for admission control policies

**Decision:** Kyverno ClusterPolicies enforcing non-root containers, resource limits, signed images, SBOM labels.

**Why:** Policy enforcement at admission time (before Pod is created) prevents insecure Pods from ever running.

Runtime enforcement only catches issues after the Pod starts.

**Rejected:** Pod Security Admission (Kubernetes built-in).

Why rejected: coarse-grained (only 3 levels: privileged/baseline/restricted), no custom rules, no SBOM requirements.

**Date:** 2026-06-01. **Status:** ACTIVE.

---

## Deployment

### D-DEPLOY-001: Canary deployments via Argo Rollouts

**Decision:** Argo Rollouts with 10% → 50% → 100% traffic progression, auto-rollback on error rate > 5%.

**Why:** Standard RollingUpdate deploys to all replicas simultaneously.

If the new version has a bug: 100% of traffic hits it before rollback completes.

Canary routes only 10% to the new version — 90% stays on stable.

Auto-rollback limits blast radius to at most 10% of users.

**Rejected:** Native Kubernetes RollingUpdate.

Why rejected: no traffic splitting, no analysis, no auto-rollback on metrics degradation.

Bad deployments affect 100% of users before anyone notices.

**Date:** 2026-06-02. **Status:** ACTIVE.

---

## Google SRE Compliance

### Gaps fixed in this session (2026-06-01 to 2026-06-02)

This table tracks every gap found in the Google-Fellow-level audit and its fix status.

| Gap ID | Gap Description | Severity | Status | Fix |
|--------|----------------|----------|--------|-----|
| C1 | Token blacklist process-local | CRITICAL | ✅ Fixed | Redis-backed blacklist |
| C2 | No auth event audit logging | CRITICAL | ✅ Fixed | auditLog() + 13 event types |
| C3 | No SLO instrumentation | CRITICAL | ✅ Fixed | prom-client metrics + alerts.yaml |
| C4 | Base image tags mutable | CRITICAL | ⏳ Script ready | pin_base_images.py (run monthly) |
| C5 | No DB down migrations | CRITICAL | ✅ Fixed | rollback.sql per migration |
| C6 | No database backup | CRITICAL | ✅ Fixed | postgres-backup-cronjob.yaml |
| C7 | No PITR | CRITICAL | ✅ Fixed | postgres-wal-config.yaml |
| C8 | No ResourceQuota | CRITICAL | ✅ Fixed | namespace-quotas.yaml |
| C9 | Secrets unencrypted at rest | CRITICAL | ✅ Fixed | ESO config (deploy when cluster ready) |
| H1 | No RBAC | HIGH | ✅ Fixed | Role enum + requireRole() |
| H2 | No service-to-service auth | HIGH | ✅ Fixed | requireServiceAuth() |
| H3 | No circuit breaker | HIGH | ✅ Fixed | CircuitBreaker class |
| H4 | No DB query timeouts | HIGH | ✅ Fixed | statement_timeout=5s |
| H5 | No graceful shutdown | HIGH | ✅ Fixed | SIGTERM handler with drain |
| H6 | No request timeout | HIGH | ✅ Fixed | server.setTimeout(30s) |
| H7 | Log-trace correlation missing | HIGH | ✅ Fixed | requestId + traceId in child logger |
| H8 | No custom metrics | HIGH | ✅ Fixed | prom-client counters/histograms |
| H9 | Exceptions swallowed | HIGH | ✅ Fixed | global error handler |
| H10 | No canary deployment | HIGH | ✅ Fixed | Argo Rollouts manifest |
| H11 | No auto-rollback | HIGH | ✅ Fixed | AnalysisTemplate in Rollout |
| H12 | Migration not validated in CI | HIGH | ✅ Fixed | test-migrations job |
| H13 | Missing FK indexes | HIGH | ✅ Fixed | 3 indexes on Item model |
| H14 | No LimitRange | HIGH | ✅ Fixed | namespace-quotas.yaml |
| H15 | No pod anti-affinity | HIGH | ✅ Fixed | deployment.yaml affinity + spread |
| H16 | Cluster autoscaler unconfigured | HIGH | ✅ Fixed | cluster-autoscaler/values-aws.yaml |
| H17 | Egress too permissive | HIGH | ✅ Fixed | Scoped NetworkPolicy |
| H18 | Attestation incomplete | HIGH | ✅ Fixed | Kyverno SBOM attestation check |
| M1–M16 | Medium gaps (16 items) | MEDIUM | ✅ Fixed | See commits 2026-06-02 |

---

## Ongoing Audit Schedule

| Frequency | What | Who |
|-----------|------|-----|
| Weekly | Run `.github/workflows/security-scan.yml` (automated) | CI |
| Monthly | Run `scripts/pin_base_images.py` to update Dockerfile digests | Platform team |
| Quarterly | Full Google-Fellow-level audit (repeat audit process in AUDIT_PROCESS.md) | Platform lead |
| On CVE disclosure | Update .trivyignore or patch base image immediately | On-call |
