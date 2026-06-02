# Platform Audit Process

**What this covers:** How to run a Google-Fellow-level platform audit — step by step.

**When to run:** Quarterly, after major changes, before first external customer.

**Who runs it:** Platform lead (30 min for initial scan, 2h for full audit).

---

## Quick Audit (30 minutes — monthly)

Run these commands. Each one checks one category of production readiness.

### 1. Security scan — verify CI passed

```bash
gh run list --repo yarova-ca/pipeline-studio --workflow security-scan.yml --limit 1
# Expected: conclusion=success
```

### 2. JWT algorithm locked

```bash
grep -n "algorithms.*HS256" services/14-express/src/middleware/auth.ts
# Expected: algorithms: ['HS256'] present
grep -n "throw.*JWT_SECRET" services/14-express/src/middleware/auth.ts
# Expected: startup validation present
```

### 3. Token revocation is distributed

```bash
grep -n "ioredis\|redisClient" services/14-express/src/middleware/auth.ts
# Expected: Redis client present
```

If absent: token revocation is pod-local only (see D-AUTH-002 in DECISIONS.md).

### 4. Audit logging present

```bash
grep -rn "auditLog" services/14-express/src/ | wc -l
# Expected: >10 (at least one call per auth event type)
```

### 5. Graceful shutdown present

```bash
grep -n "SIGTERM\|SIGINT" services/14-express/src/index.ts
# Expected: both handlers present
```

If absent: pod kill mid-request = dropped requests. See D-INFRA-001 in DECISIONS.md.

### 6. Database indexes present

```bash
grep "@@index" services/14-express/prisma/schema.prisma | wc -l
# Expected: 3 or more indexes present
```

### 7. ArgoCD prune is false

```bash
grep "prune:" infra/argocd/app-of-apps.yaml
# Expected: prune: false
```

If `prune: true`: a bad commit can delete a production service automatically.

See D-INFRA-002 in DECISIONS.md before changing this.

### 8. Kyverno policies in enforce mode

```bash
grep "validationFailureAction:" infra/kyverno/*.yaml
# Expected: enforce (not audit) for non-root and resource-limits policies
```

Audit mode: violations are logged but not blocked. Enforce mode: violations block the Pod from starting.

### 9. ResourceQuota exists

```bash
ls infra/namespace-quotas.yaml
# Expected: file exists
```

### 10. Metrics endpoint exists

```bash
grep "/metrics" services/14-express/src/index.ts
# Expected: GET /metrics route present
```

---

## Full Audit (2 hours — quarterly)

Use these prompts in parallel. Each one covers one audit dimension.

Each prompt: paste into a separate Claude session pointed at this repo.

---

### Auth audit prompt

```
Audit services/14-express/src/middleware/auth.ts and routes/auth.ts against:
1. JWT algorithm locked to HS256
2. JWT secret minimum 32 chars enforced at startup
3. API key prefix validated before DB lookup
4. Token blacklist distributed (Redis-backed)
5. All auth events logged with: userId, IP, event type, result, timestamp
6. RBAC implemented (requireRole middleware)
7. OAuth state parameter validated on callback
8. Token revocation on logout
9. Refresh token endpoint present
10. Service-to-service auth mechanism present

For each item: PASS or FAIL. If FAIL: exact file + line number + fix required.
```

---

### Reliability audit prompt

```
Audit services/14-express/src/ against:
1. Graceful shutdown (SIGTERM drains requests, disconnects DB)
2. Circuit breaker on DB calls
3. DB query timeout (statement_timeout in connection string)
4. Request timeout (server.setTimeout or middleware)
5. Retry logic on transient DB errors (P1001, P1002, P1008, P1017)
6. Connection pool configured (connection_limit, pool_timeout)

For each item: PASS or FAIL. If FAIL: exact file + line number + fix required.
```

---

### Observability audit prompt

```
Audit services/14-express/src/ against:
1. Request ID + trace ID in every log line
2. prom-client metrics: request count, request duration, auth events, DB query duration
3. /metrics endpoint exposed
4. Global error handler catches unhandled exceptions with stack trace
5. Slow query logging (>100ms queries)
6. Prometheus alert rules for SLO breach

For each item: PASS or FAIL. If FAIL: exact file + line number + fix required.
```

---

### Infrastructure audit prompt

```
Audit infra/ against:
1. ResourceQuota per namespace (prod, staging, dev)
2. LimitRange with default requests/limits per namespace
3. Pod anti-affinity in deployment templates
4. Topology spread constraints for AZ distribution
5. HPA with both CPU and memory metrics
6. PDB applies to all replica counts (not just >=2)
7. NetworkPolicy scopes egress (not port 443 to all internet)
8. Kyverno require-non-root: mandatory (not optional via securityContext override)
9. Kyverno require-signed-image: includes dev namespace
10. Kyverno require-sbom-label: enforce mode (not audit)
11. ArgoCD prune: false
12. Grafana uses existingSecret (not hardcoded password)

For each item: PASS or FAIL. If FAIL: exact file + line number + fix required.
```

---

### Data audit prompt

```
Audit services/14-express/prisma/ and infra/backup/ against:
1. Indexes on all FK columns (items.user_id)
2. Compound index for common query pattern (user_id, created_at DESC)
3. Rollback SQL exists for every migration
4. Backup CronJob configured
5. WAL archival config for PITR
6. Migration validation in CI (test-migrations job)

For each item: PASS or FAIL. If FAIL: exact file + line number + fix required.
```

---

## Remediation Tracking

When a gap is found: add it to the compliance table in DECISIONS.md.

Format:
```
| AUDIT-DATE-NNN | Gap description | CRITICAL/HIGH/MEDIUM | ✅ Fixed / ⏳ Pending | Fix commit or PR |
```

**Rules:**

A gap is not closed until all three are done:

1. Code change committed.
2. Test added (or existing test confirms the fix).
3. DECISIONS.md table row updated with fix commit link.

Never mark a gap fixed without all three.

---

## Severity Definitions

| Severity | Definition | Max time to fix |
|----------|-----------|-----------------|
| CRITICAL | Exploitable remotely, data loss possible, or SLA breach | 24 hours |
| HIGH | Auth bypass, service outage risk, or missing SLO instrumentation | 1 week |
| MEDIUM | Reliability gap, missing observability, or policy in audit mode | 1 sprint |
| LOW | Style, documentation, non-blocking improvement | Next quarter |

---

## What "Fixed" Means

Fixed = code change committed AND verified with the check command from this doc.

Not fixed:
- "We plan to fix it."
- "It's handled by the platform layer."
- "It was there before and nobody noticed."

When in doubt: run the check command. PASS = fixed. FAIL = not fixed.
