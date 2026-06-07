# ws (Node)

Runnable service starter for ws (Node).

## What this is

ws (Node) is a typescript websocket service starter.

Runnable today. Production-shaped. One command to start.

Port: 3000.
Category: WebSocket.

## What is included

Every row below ships inside this service.

| Component | Included |
|---|---|
| Dockerfile (multi-axis build) | ✅ |
| Helm chart (per-environment values) | ✅ |
| Kustomize overlays | ✅ |
| Compliance configs | 5 regimes |
| Test suite | ❌ |
| GitHub Actions pipeline | 7 phases |

## Docker build axes

This service accepts these Docker build-args.

Build-arg: a value passed at image build time.

| Axis | Default | Purpose |
|---|---|---|
| BUILD_IMAGE | ubuntu | Builder base image family. |
| BUILD_BASE | ubuntu:24.04 | Builder base image tag. |

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

Start the service with one command.

```bash
docker compose up
```

Health endpoint: `http://localhost:3000/health`.

## Source

All files live in `services/30-ws-node/` in the pipeline-studio repo.
