# Pipeline Studio

Service starters for every framework, compliance regime, and runtime axis.

106 runnable services. 30 technology categories. 8 Docker build axes.

## Categories

| Range | Category |
|---|---|
| 01–05 | Frontend (SSR, SPA, SSG, Islands, Resumable) |
| 06–13 | Edge, Patterns, Micro-frontends, Mobile, PWA |
| 14–27 | Backend (Node.js through C++) |
| 28–30 | gRPC, GraphQL, WebSocket |

## Build Axes

Every service supports 8 Docker `--build-arg` parameters:

| Axis | Options |
|---|---|
| RUNTIME | standard, fips |
| PKG_MGR | npm, pnpm, yarn, bun |
| BUILD_TOOL | tsc, esbuild, swc |
| COMPLIANCE | standard, hipaa, pci, pipeda, soc2, fips, cmmc, nerc |
| OBSERVABILITY | none, otel, prometheus, datadog |
| AUTH | none, jwt, oauth2, apikey, all |
| ORM | none, prisma, sqlalchemy, gorm |
