# Svelte

Runnable service starter for Svelte.

## What this is

Svelte is a typescript spa service starter.

Runnable today. Production-shaped. One command to start.

Port: 80.
Category: Single-page app.

## What is included

Every row below ships inside this service.

| Component | Included |
|---|---|
| Dockerfile (multi-axis build) | ✅ |
| Helm chart (per-environment values) | ✅ |
| Kustomize overlays | ✅ |
| Compliance configs | 5 regimes |
| Test suite | ✅ |
| GitHub Actions pipeline | 7 phases |

## Docker build axes

This service accepts these Docker build-args.

Build-arg: a value passed at image build time.

| Axis | Default | Purpose |
|---|---|---|
| BUILD_IMAGE | ubuntu | Builder base image family. |
| BUILD_BASE | ubuntu:24.04 | Builder base image tag. |
| RUNTIME | alpine | Base runtime image (standard or FIPS). |

## Compliance regimes

Each regime has a config file in `compliance/`.

| Regime | File |
|---|---|
| FedRAMP | compliance/fedramp.yaml |
| FIPS 140-3 | compliance/fips.yaml |
| HIPAA | compliance/hipaa.yaml |
| PCI-DSS | compliance/pci.yaml |
| PIPEDA | compliance/pipeda.yaml |

## CI/CD pipeline

The pipeline runs in numbered phases.

| Phase | File |
|---|---|
| Pre-commit checks | .github/workflows/01-pre-commit.yml |
| Security gates | .github/workflows/02-security-gates.yml |
| Build on PR | .github/workflows/03-build-pr.yml |
| Build, push, sign image | .github/workflows/04-build-push-sign.yml |
| Test suite | .github/workflows/05-test.yml |
| Release | .github/workflows/06-release.yml |
| Notify | .github/workflows/07-notify.yml |

## Run locally

Install dependencies, then start the dev server.

```bash
npm install
npm run dev
```

## Source

All files live in `services/02-svelte/` in the pipeline-studio repo.
