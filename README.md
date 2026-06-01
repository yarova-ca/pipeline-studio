# pipeline-studio

Platform engineering reference and runnable service starters for all 106 frameworks.

Covers every language group, industry vertical, compliance standard, and deployment axis.

---

## What is in this repo

| Directory | What it contains |
|---|---|
| `*.html` | Reference docs — 17 pages across 7 topic pillars |
| `services/` | 106 runnable service starters — health endpoints, Dockerfiles, tests |
| `workflow-templates/` | GitHub Actions workflow templates per framework |
| `dockerfiles/` | Standalone Dockerfile reference files |
| `scripts/` | Generators and build scripts |
| `studio-v2/` | Next-generation Astro-based doc app |

---

## HTML docs — 7 pillars

Open `index.html` to start. Every page is self-contained.

| Pillar | Pages |
|---|---|
| 1 — Start Here | index.html |
| 2 — Frameworks & Services | 01-framework-catalog, 17-feature-matrix |
| 3 — Build & Runtime | 09-linux-distros, 11-dockerfile-catalog, 15-version-registry |
| 4 — Pipeline & Tools | 02-pipeline-schema, 03-stage-types, 04-tool-catalog, 13-pipeline-build-catalog |
| 5 — Compliance & Security | 05-invariants, 10-linux-compliance, 12-compliance-variations |
| 6 — Industry Verticals | 06-industry-schema, 07-canada-schema, 08-canada-market, 14-canada-industry-catalog |
| 7 — Operations | 16-maintainability-runbook |

---

## Services — what each service contains

```
services/14-express/
├── src/            app code
├── tests/          health endpoint assertions
├── Dockerfile      multi-stage — RUNTIME=alpine|slim|fips
├── package.json
└── tsconfig.json
```

Every service has: hello world route + 4 health endpoints (`/health`, `/health/live`, `/health/ready`) + passing tests.

---

## GitHub issue templates

Two template sets — use both together for a complete service.

| Template set | Purpose |
|---|---|
| `pipeline-setup/` | Track CI/CD pipeline setup (6 phases, all tools, all compliance) |
| `service-scaffold/` | Track runnable service implementation (app + Dockerfile + tests) |

---

## Build a service locally

```bash
cd services/14-express
npm install
npm run dev       # → http://localhost:3000
npm test          # → 4 passing
docker build --build-arg RUNTIME=alpine -t 14-express:local .
```

RUNTIME options: `alpine` (default) | `slim` | `fips`
