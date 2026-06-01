## What

<!-- One sentence: what does this PR do? -->

## Why

<!-- Why is this change needed? -->

## Service affected

<!-- Which service(s) or docs pages changed? -->

## Tests

- [ ] Unit tests pass (`npm test` / `pytest` / `go test ./...`)
- [ ] Docker builds (`docker build --build-arg RUNTIME=alpine .`)
- [ ] Health endpoint responds (`curl localhost:PORT/health/live`)

## Compliance

- [ ] No secrets committed (Gitleaks scan passed)
- [ ] No HIGH/CRITICAL CVEs in base image
- [ ] SBOM generated if new Dockerfile added

## Checklist

- [ ] Follows branch+PR workflow (no direct main commits)
- [ ] 17-feature-matrix.html updated if new service added
- [ ] 15-version-registry.html updated if versions changed
