# Kotlin Jetpack

Runnable service starter for Kotlin Jetpack.

## What this is

Kotlin Jetpack is a kotlin mobile-android service starter.

Runnable today. Production-shaped. One command to start.

Port: not applicable (client-side build).
Category: Native-android.

## What is included

Every row below ships inside this service.

| Component | Included |
|---|---|
| Dockerfile (multi-axis build) | ✅ |
| Helm chart (per-environment values) | ❌ |
| Kustomize overlays | ❌ |
| Compliance configs | 5 regimes |
| Test suite | ❌ |
| GitHub Actions pipeline | 5 phases |

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
| 03-build-artifact | .github/workflows/03-build-artifact.yml |
| 04-test | .github/workflows/04-test.yml |
| 05-release-notify | .github/workflows/05-release-notify.yml |

## Run locally

Build with the kotlin platform toolchain.

See the files in this service for exact build steps.

## Source

All files live in `services/12-kotlin-jetpack/` in the pipeline-studio repo.
