# Service Starters — Developer Catalog

105 production-ready service templates.

30 language and protocol groups.

Every major tech stack covered.

**Health check coverage:**

| Service type | Groups | Health signal |
|---|---|---|
| Server services | 01, 04, 05, 07, 14–27, 29–30 | `/health`, `/health/live`, `/health/ready` on app port |
| Static / nginx | 02, 03, 08, 13 | nginx HTTP 200 on port 80 — no app-level route |
| gRPC | 28 | `grpc.health.v1.Health/Check` on port 50051 |
| gRPC with HTTP sidecar | 28 (6 of 10 services) | HTTP health also on port 8080 |
| gRPC — no HTTP sidecar | 28-kotlin-grpc, 28-rust-grpc, 28-ruby-grpc, 28-swift-grpc | gRPC protocol only — no HTTP sidecar |
| CI-only / mobile / native | 09–12 | No Docker. No server. No health endpoint. |

All 92 Docker services pass `docker build --target runtime`.

---

## Contents

**Get started**
- [Quick Start](#quick-start)
- [What This Repo Is](#what-this-repo-is)
- [Group Map — 30 groups explained](#group-map)
- [Which Services to Maintain — priority tiers](#priority-tiers)

**Reference**
- [What Works Today](#what-works-today)
- [What's Coming Next](#coming-next)
- [Feature Axis Matrix](#axis-matrix)
- [Composing Variants — full build command](#composing)
- [Industry Vertical → Variant Reference](#industry-verticals)
- [Registry Image Tag Convention](#tag-convention)
- [Counts](#counts)
- [CI Pipeline Stages](#ci-stages)

**Jump to service group**

| Group | | Group | |
|---|---|---|---|
| 01 SSR / Full-stack | [↓ jump](#g01) | 16 Go | [↓ jump](#g16) |
| 02 Frontend SPA | [↓ jump](#g02) | 17 Java | [↓ jump](#g17) |
| 03 Static Site Gen | [↓ jump](#g03) | 18 Kotlin | [↓ jump](#g18) |
| 04 Island Arch | [↓ jump](#g04) | 19 .NET | [↓ jump](#g19) |
| 05 Resumability | [↓ jump](#g05) | 20 Rust | [↓ jump](#g20) |
| 06 Edge Runtime | [↓ jump](#g06) | 21 Elixir | [↓ jump](#g21) |
| 07 Modern Routing | [↓ jump](#g07) | 22 Ruby | [↓ jump](#g22) |
| 08 Module Federation | [↓ jump](#g08) | 23 PHP | [↓ jump](#g23) |
| 09 Mobile / RN | [↓ jump](#g09) | 24 Swift | [↓ jump](#g24) |
| 10 Cross-platform | [↓ jump](#g10) | 25 Scala | [↓ jump](#g25) |
| 11 Native iOS | [↓ jump](#g11) | 26 Clojure | [↓ jump](#g26) |
| 12 Native Android | [↓ jump](#g12) | 27 C++ | [↓ jump](#g27) |
| 13 PWA | [↓ jump](#g13) | 28 gRPC | [↓ jump](#g28) |
| 14 JS/TS Servers | [↓ jump](#g14) | 29 GraphQL | [↓ jump](#g29) |
| 15 Python | [↓ jump](#g15) | 30 WebSocket | [↓ jump](#g30) |


---

<a id="quick-start"></a>
## Quick Start — Run Any Service in 4 Commands

```bash
# 1. Pick a service directory
cd services/14-express

# 2. Build the runtime image
docker build --target runtime -t my-service .

# 3. Run it
docker run --rm -p 3000:3000 my-service

# 4. Verify health
curl http://localhost:3000/health
# → {"status":"ok"}
```

Replace `14-express` with any service directory name.
Replace `3000` with the port shown in the Service Catalog below.

---

<a id="what-this-repo-is"></a>
## What This Repo Is

A catalog of starter services — one per framework and language.

Each service is a complete, runnable starting point.

Each service includes:

- A working Dockerfile with `--target runtime` stage
- A health endpoint at `/health`
- A liveness probe at `/health/live`
- A readiness probe at `/health/ready`
- Tests (where applicable)

Liveness probe: when this returns non-200, Kubernetes restarts the pod.

Readiness probe: when this returns non-200, Kubernetes stops sending traffic to the pod.

**Who uses this:**
- A team picking a backend language starts here, not from scratch.
- A platform team wiring up CI uses this as the build target.
- A consultant matching a client's compliance requirement selects the right variant.

---

<a id="group-map"></a>
## Group Map — What Each Number Means

| Groups | Domain | Has Docker | Has server |
|---|---|---|---|
| 01 | SSR / Full-stack (Next.js, Nuxt, Remix, SvelteKit, Angular SSR, Solid Start) | Yes | Yes — Node.js |
| 02 | Frontend SPA — React, Vue, Angular, Svelte, SolidJS, Preact, Lit | Yes | No — nginx static |
| 03 | Static site generators — Astro, Eleventy, Gatsby, Hugo | Yes | No — nginx static |
| 04 | Island architecture — Astro Islands, Fresh | Yes | No — nginx static |
| 05 | Resumability — Qwik | Yes | Yes — Node.js |
| 06 | Edge runtime — Cloudflare Workers | No | No — CI deploy only |
| 07 | Modern routing — Next.js App Router, Remix, SvelteKit | Yes | Yes — Node.js |
| 08 | Module federation — Webpack MF, Rspack MF, single-spa | Yes | No — nginx static |
| 09 | Mobile / React Native — Expo, Ionic, React Native | No | No — CI only |
| 10 | Cross-platform mobile — Flutter, .NET MAUI, Kotlin MP | No | No — CI only |
| 11 | Native iOS — Swift SwiftUI, Objective-C UIKit | No | No — Xcode only |
| 12 | Native Android — Kotlin Jetpack Compose, Java | No | No — Gradle only |
| 13 | Progressive Web Apps — Vite PWA, Workbox | Yes | No — nginx static |
| 14 | JS/TS servers — Express, Fastify, Hono, NestJS, Elysia, Deno, Bun native | Yes | Yes |
| 15 | Python servers — Django, FastAPI, Flask, Starlette | Yes | Yes |
| 16 | Go servers — Gin, Echo, Fiber, chi | Yes | Yes |
| 17 | Java servers — Spring Boot, Quarkus, Micronaut | Yes | Yes |
| 18 | Kotlin servers — Ktor, Spring Boot Kotlin | Yes | Yes |
| 19 | .NET / C# servers — ASP.NET Core MVC, Minimal APIs | Yes | Yes |
| 20 | Rust servers — Axum, Actix-web | Yes | Yes |
| 21 | Elixir servers — Phoenix | Yes | Yes |
| 22 | Ruby servers — Rails, Sinatra | Yes | Yes |
| 23 | PHP servers — Laravel, Slim, Symfony | Yes | Yes |
| 24 | Swift servers — Vapor, Hummingbird | Yes | Yes |
| 25 | Scala servers — http4s, Play Framework | Yes | Yes |
| 26 | Clojure servers — Pedestal, Ring | Yes | Yes |
| 27 | C++ servers — Crow, Drogon | Yes | Yes |
| 28 | gRPC servers — Go, Node, Python, Java, Kotlin, .NET, Rust, Ruby, PHP, Swift | Yes | Yes — port 50051 |
| 29 | GraphQL servers — Apollo, Yoga, Strawberry, gqlgen, Spring, Hot Chocolate, Ruby, Rust | Yes | Yes — /graphql |
| 30 | WebSocket servers — Node, Go, Python, Java, Elixir, Rust, .NET, Ruby | Yes | Yes — /ws |

---

<a id="priority-tiers"></a>
## Which Services to Maintain

105 services exist. Maintaining all equally is not realistic.

This table shows which to prioritize and why.

### Tier 1 — Must maintain (34 services)

| Service | Category | Why |
|---|---|---|
| `01-nextjs` | SSR / Full-stack | Largest SSR framework. React ecosystem standard. |
| `01-nuxt` | SSR / Full-stack | Largest Vue SSR framework. |
| `01-sveltekit` | SSR / Full-stack | Svelte's only fullstack option. Fast-growing. |
| `02-react` | Frontend SPA | Most used JS framework on the planet. |
| `02-vue` | Frontend SPA | 2nd most used. Large enterprise base. |
| `02-angular` | Frontend SPA | Enterprise standard. Google-backed. |
| `02-svelte` | Frontend SPA | Fastest growing. Unique compiler-based approach. |
| `03-astro` | Static Site Generator | Most popular modern static site generator. |
| `03-hugo` | Static Site Generator | Fastest SSG. Large content and docs user base. |
| `06-hono-edge` | Edge / Cloudflare Workers | Most popular Cloudflare Workers framework. |
| `07-nextjs-app-router` | Modern Routing / Server Components | This IS Next.js now. React Server Components. |
| `09-react-native` | Mobile / React Native | Most popular cross-platform mobile. |
| `09-expo` | Mobile / React Native | Standard way to ship React Native today. |
| `10-flutter` | Cross-platform Mobile | Google-backed. Most popular after React Native. |
| `11-swift-swiftui` | Native iOS | iOS native standard. No alternative. |
| `12-kotlin-jetpack` | Native Android | Android native standard. No alternative. |
| `14-express` | JS/TS Servers | Most used Node.js framework. |
| `14-fastify` | JS/TS Servers | Fastest Node.js. Growing fast. |
| `14-nestjs` | JS/TS Servers | Enterprise Node.js standard. |
| `14-hono` | JS/TS Servers | Modern edge-first. Very popular. |
| `15-fastapi` | Python Servers | Most popular modern Python API. |
| `15-django` | Python Servers | Largest Python framework overall. |
| `16-gin` | Go Servers | Most popular Go framework. |
| `17-spring-boot` | Java Servers | Dominates Java enterprise globally. |
| `18-ktor` | Kotlin Servers | Kotlin's primary server framework. |
| `19-aspnet-core` | .NET / C# Servers | .NET standard. Microsoft-backed. |
| `20-axum` | Rust Servers | Most popular Rust web framework today. |
| `21-phoenix` | Elixir Servers | Only Elixir framework worth covering. |
| `22-rails` | Ruby Servers | Still widely used. Large existing codebase. |
| `23-laravel` | PHP Servers | Most popular PHP framework by far. |
| `28-go-grpc` | gRPC Servers | Go is the most common gRPC server language. |
| `28-java-grpc` | gRPC Servers | Java microservices use gRPC heavily. |
| `28-python-grpc` | gRPC Servers | ML/AI services expose gRPC endpoints. |
| `28-node-grpc` | gRPC Servers | Node.js gRPC clients are very common. |

### Tier 2 — Keep if capacity allows (~17 services)

| Service | Category | Why lower priority |
|---|---|---|
| `01-remix` | SSR / Full-stack | Declining vs Next.js |
| `02-solidjs` | Frontend SPA | Small but technically excellent |
| `08-mf-webpack` | Module Federation | Enterprise micro-frontend pattern |
| `13-vite-pwa` | Progressive Web Apps | Still relevant for offline apps |
| `14-elysia` | JS/TS Servers | Bun-native, growing |
| `14-bun` | JS/TS Servers | New runtime, growing fast |
| `15-flask` | Python Servers | Simpler Python — partial overlap with FastAPI |
| `16-echo` | Go Servers | 2nd Go framework — minor variation from Gin |
| `16-fiber` | Go Servers | Performance-focused Go — niche use case |
| `17-quarkus` | Java Servers | Cloud-native Java — growing but smaller than Spring |
| `18-spring-boot-kotlin` | Kotlin Servers | Spring + Kotlin — overlaps with groups 17 and 18 |
| `19-minimal-apis` | .NET / C# Servers | Modern .NET — overlaps with aspnet-core |
| `20-actix-web` | Rust Servers | Historically popular — axum replacing it |
| `24-vapor` | Swift Servers | Only Swift server option |
| `28-rust-grpc` | gRPC Servers | Rust gRPC growing but smaller community |
| `28-kotlin-grpc` | gRPC Servers | Kotlin gRPC used in JVM microservices |
| `29-apollo` | GraphQL Servers | Most popular Node.js GraphQL server |

### Skip — Legacy, niche, or redundant (~38 services)

| Service | Category | Why |
|---|---|---|
| `02-preact` | Frontend SPA | Niche — minimal community |
| `02-lit` | Frontend SPA | Web components — minimal community |
| `03-gatsby` | Static Site Generator | Declining significantly |
| `03-eleventy` | Static Site Generator | Niche — dedicated but small community |
| `04-fresh` | Island Architecture | Deno Fresh — very small community |
| `05-qwik` | Resumability | Tiny community |
| `06-remix-cloudflare` | Edge / Cloudflare Workers | Redundant with hono-edge |
| `08-mf-rspack` | Module Federation | Niche — newer Rspack variant |
| `08-single-spa` | Module Federation | Declining micro-frontend approach |
| `09-ionic` | Mobile / React Native | Declining vs React Native and Flutter |
| `10-dotnet-maui` | Cross-platform Mobile | Small community |
| `10-kmp` | Cross-platform Mobile | Kotlin Multiplatform — still maturing |
| `11-objc-uikit` | Native iOS | Legacy — Obj-C dead for new projects |
| `12-java-android` | Native Android | Legacy — Kotlin replaced Java on Android |
| `13-workbox` | Progressive Web Apps | Library, not a framework |
| `14-deno` | JS/TS Servers | Limited adoption outside Cloudflare |
| `15-starlette` | Python Servers | FastAPI is built on it — redundant |
| `16-chi` | Go Servers | Minimal router — too basic to template |
| `17-micronaut` | Java Servers | Small community vs Spring and Quarkus |
| `22-sinatra` | Ruby Servers | Niche minimal Ruby |
| `23-slim` | PHP Servers | Laravel covers PHP |
| `23-symfony` | PHP Servers | Laravel covers PHP |
| `24-hummingbird` | Swift Servers | Tiny community |
| `25-play` | Scala Servers | Scala niche overall |
| `25-http4s` | Scala Servers | Scala niche overall |
| `26-pedestal` | Clojure Servers | Clojure niche overall |
| `26-ring` | Clojure Servers | Clojure niche overall |
| `27-crow` | C++ Servers | C++ server — very niche |
| `27-drogon` | C++ Servers | C++ server — very niche |
| `28-dotnet-grpc` | gRPC Servers | Lower priority language for gRPC |
| `28-php-grpc` | gRPC Servers | Lower priority language for gRPC |
| `28-ruby-grpc` | gRPC Servers | Lower priority language for gRPC |
| `28-swift-grpc` | gRPC Servers | Lower priority language for gRPC |
| `29-graphql-yoga` | GraphQL Servers | Overlaps with Apollo |
| `29-gqlgen` | GraphQL Servers | Keep only if Go GraphQL is needed |
| `29-spring-graphql` | GraphQL Servers | Keep only if Java GraphQL is needed |
| `29-async-graphql` | GraphQL Servers | Rust GraphQL — very niche |
| `29-graphql-ruby` | GraphQL Servers | Ruby GraphQL — small use case |
| `29-hot-chocolate` | GraphQL Servers | .NET GraphQL — niche |
| `29-strawberry` | GraphQL Servers | Python GraphQL — overlaps with FastAPI |
| `30-ws-dotnet` | WebSocket Servers | Lower priority language for WebSocket |
| `30-ws-elixir` | WebSocket Servers | Phoenix already covers Elixir real-time |
| `30-ws-java` | WebSocket Servers | Spring WebSocket covers this |
| `30-ws-ruby` | WebSocket Servers | ActionCable in Rails covers this |

---

<a id="what-works-today"></a>
## What Works Today

These features exist in the repo right now and are tested.

<a id="docker-variants"></a>
### 1. Docker Runtime Variants (Works Today)

**What this does:**

Swaps the base Linux image your service runs on without editing any Dockerfile.

Base image (the OS layer every container starts from): controls security posture, image size, and compliance eligibility.

**How to use it:**

```bash
# Default — no arg needed
docker build --target runtime -t my-service services/14-express

# Select a different runtime
docker build --build-arg RUNTIME=fips -t my-service:fips services/14-express
docker build --build-arg RUNTIME=slim -t my-service services/14-express

# Backward compat — --target still works
docker build --target runtime-fips -t my-service:fips services/14-express
```

---

**How it works inside the Dockerfile (3 steps):**

**Step 1 — Build stage creates a minimal user file.**

```dockerfile
RUN printf 'root:x:0:0:root:/root:/bin/sh\n\
nobody:x:65534:65534:nobody:/nonexistent:/bin/false\n\
app:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd
```

Why: different base images use different commands to create users (`adduser` on Alpine, `useradd` on Debian, not available at all on `scratch` or `distroless`).

Creating the user file once in the build stage, then copying it into any runtime image, solves all four cases with one mechanism.

**Step 2 — All three base images defined as named stages.**

```dockerfile
FROM node:22-alpine AS base-alpine
FROM node:22-slim   AS base-slim
FROM ubi9/nodejs-22-minimal AS base-fips
```

Docker BuildKit (modern Docker build engine) only pulls the stage that is selected.

The other two are skipped entirely — no extra pull time.

**Step 3 — ARG selects which base image becomes the runtime stage.**

```dockerfile
ARG RUNTIME=alpine
FROM base-${RUNTIME} AS runtime
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build --chown=1001:1001 /app/dist ./dist
USER 1001
```

When `RUNTIME=alpine`: `base-alpine` image is used. App runs as UID 1001.

When `RUNTIME=fips`: `base-fips` (UBI9 — Red Hat FIPS-validated) image is used. App runs as UID 1001.

When `RUNTIME=slim` or `RUNTIME=debian`: Debian-based slim image. App runs as UID 1001.

The `/etc/passwd` copy is what makes `USER 1001` work in scratch and distroless images.

Scratch (empty image, zero OS) and distroless (no shell, no package manager) have no `adduser` command.

COPY creates the file directly — no command needed.

---

**RUNTIME values per service group:**

FIPS-140-2: US/Canadian government crypto standard. Required for federal systems, defense contractors.

Distroless (image with no shell and no package manager — minimal attack surface): default for Java and Kotlin.

Scratch (completely empty image — contains only what you COPY into it): default for Go and Rust statically-linked binaries.

| Group | Default | Other values |
|---|---|---|
| Node.js SSR + API (01, 07, 14) | `alpine` | `slim` · `fips` |
| nginx static sites (02, 03) | `alpine` | `stable` · `fips` |
| Python (15) | `slim` | `alpine` · `fips` |
| Go servers (16) + go-grpc | `scratch` | `distroless` · `alpine` · `fips` |
| Java (17) + java-grpc | `distroless` | `temurin` · `fips` |
| Kotlin (18) | `distroless` | `temurin` · `fips` |
| .NET / C# (19) | `alpine` | `debian` · `fips` |
| Rust (20) | `scratch` | `distroless` · `alpine` · `fips` |
| Elixir (21) | `debian` | `alpine` · `fips` |
| Ruby (22) | `alpine` | `slim` · `fips` |
| PHP (23) | `alpine` | `debian` |
| gRPC node + python (28) | `slim` | `alpine` · `fips` |
| gRPC go (28) | `slim` | `distroless` · `fips` |
| gRPC java (28) | `temurin` | `distroless` · `fips` |

PHP has no `fips` value.

Why: no FIPS-validated PHP base image exists from Red Hat or any major vendor.

---

**Which services support `--build-arg RUNTIME=`:**

All 28 Tier 1 Docker services.

| Group | Services |
|---|---|
| Node.js SSR | `01-nextjs` · `01-nuxt` · `01-sveltekit` · `07-nextjs-app-router` |
| Node.js API | `14-express` · `14-fastify` · `14-hono` · `14-nestjs` |
| nginx SPA | `02-react` · `02-vue` · `02-angular` · `02-svelte` |
| nginx static | `03-astro` · `03-hugo` |
| Python | `15-fastapi` · `15-django` |
| Go | `16-gin` |
| Java | `17-spring-boot` |
| Kotlin | `18-ktor` |
| .NET | `19-aspnet-core` |
| Rust | `20-axum` |
| Elixir | `21-phoenix` |
| Ruby | `22-rails` |
| PHP | `23-laravel` |
| gRPC | `28-go-grpc` · `28-java-grpc` · `28-python-grpc` · `28-node-grpc` |

The remaining Tier 2 and Skip services still use the old commented-block mechanism.

SBOM (Software Bill of Materials): a signed list of every dependency in the image — generated automatically by some base images like chainguard.

<a id="health-endpoints"></a>
### 2. Health Endpoints (Works Today)

All server services (groups 01, 04, 05, 07, 14–27, 28–30) expose these routes.

| Endpoint | Purpose | Response |
|---|---|---|
| `GET /health` | Manual health check | `200 {"status":"ok"}` |
| `GET /health/live` | Kubernetes liveness probe | `200 {"status":"ok"}` |
| `GET /health/ready` | Kubernetes readiness probe | `200 {"status":"ok"}` |

Liveness probe: when this returns non-200, Kubernetes restarts the pod.

Readiness probe: when this returns non-200, Kubernetes stops sending traffic to the pod.

Static/nginx services (groups 02, 03, 08, 13) serve static files via nginx — no app health endpoint.
When using with Kubernetes: point liveness probe to `GET /` port 80 — nginx responding = healthy.

gRPC services (group 28) expose gRPC on port 50051 and an HTTP health sidecar on port 8080.

Note: gRPC health probes use `grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check`.

GraphQL services (group 29) expose POST /graphql and GET /health, /health/live, /health/ready on the same port.

WebSocket services (group 30) expose ws:// on /ws and HTTP GET /health, /health/live, /health/ready.
Exception: 30-ws-java exposes HTTP health on port wsPort+1 (default 8081), not the WebSocket port (8080).

When using frontend services with Kubernetes probes: point probes to `GET /` expecting HTTP 200.

<a id="tests"></a>
### 3. Tests (Works Today)

Test files exist in 66 of 105 services.

All missing test services are either CI-only (no Docker, no server), a placeholder Swift file, or a new protocol service (groups 28–30) not yet covered by tests.

---

<a id="coming-next"></a>
## What's Coming Next (Designed — Not Yet Implemented)

These features are designed and documented here.

The code changes have not been made yet.

A `BUILD_ARG=value` notation shows the planned activation mechanism.

<a id="pkg-manager"></a>
### Package Manager Swap

`PKG_MANAGER` swaps which tool installs your project's dependencies inside the Dockerfile.

**Why JS/TS can swap:** npm, pnpm, yarn, and bun all read the same `package.json` file.

The input file does not change — only which tool reads it changes.

**Which languages can swap:**

| Language | Group(s) | Options | Can swap? |
|---|---|---|---|
| JS/TS | 01–08, 13, 14 | npm · pnpm · yarn · bun | ✅ Yes — all read `package.json` |
| Python | 15 | pip · poetry · uv | ⚠️ Possible — needs Dockerfile work (different dep files per tool) |
| Java | 17 | Maven · Gradle | ⚠️ Possible — needs Dockerfile work |
| Kotlin | 18 | Gradle · Maven | ⚠️ Possible — needs Dockerfile work |
| Scala | 25 | sbt · mill · Gradle | ⚠️ Possible — needs Dockerfile work |
| Clojure | 26 | Leiningen · deps.edn | ⚠️ Possible — needs Dockerfile work |
| Go | 16 | go mod only | ❌ No — one option, nothing to swap |
| Rust | 20 | Cargo only | ❌ No — one option |
| PHP | 23 | Composer only | ❌ No — one option |
| Ruby | 22 | Bundler only | ❌ No — one option |
| Elixir | 21 | Mix only | ❌ No — one option |
| Swift | 24 | SPM only | ❌ No — one option |
| C# | 19 | NuGet only | ❌ No — one option |

**Current values (JS/TS only — designed):**

| `PKG_MANAGER=` | Tool | Lock file | Install command |
|---|---|---|---|
| `npm` (default) | npm | `package-lock.json` | `npm ci` |
| `pnpm` | pnpm — faster, shared cache | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` |
| `yarn` | Yarn | `yarn.lock` | `yarn install --immutable` |
| `bun` | Bun — fastest, native bundler | `bun.lockb` | `bun install --frozen-lockfile` |

Exception today: `14-elysia` already uses `bun` (Elysia is a Bun-native framework).

Exception today: `22-rails` and `22-sinatra` already use `bun` for JS asset compilation.

<a id="build-tool"></a>
### Build Tool Swap

`BUILD_TOOL` swaps which bundler combines your JS/TS source files for deployment.

**Applies to JS/TS groups only (01–08, 13, 14). Does not apply to any other language.**

Why: bundling exists because JS/TS code runs in browsers.

A browser loads files over the internet — 500 separate file requests is too slow.

A bundler combines those 500 files into 2–3 optimized files before deployment.

Go, Python, Java, Rust, Ruby, PHP, Elixir, Swift, C# run on servers.

They compile to one binary or run source files directly — no separate files to bundle.

The bundling concept does not exist for these languages.

Today all JS/TS services use Vite as the bundler (where applicable).

Planned: swap by setting `BUILD_TOOL` build arg.

| `BUILD_TOOL=` | Tool | Best for |
|---|---|---|
| `vite` (default) | Vite | Most JS/TS apps. Fastest dev rebuild. |
| `webpack` | Webpack 5 | Legacy compatibility. Module Federation (groups 08). |
| `rspack` | Rspack — Webpack-compatible, written in Rust | Teams migrating from Webpack. Faster builds. |
| `esbuild` | esbuild — Go-based bundler | Maximum build speed. Minimal config. |
| `turbopack` | Turbopack | Next.js only. Set in `next.config.ts`, not a build arg. |

<a id="compliance"></a>
### Compliance Preset (All server services)

Today all services run with no compliance additions.

Planned: activate a compliance preset with `COMPLIANCE` build arg.

Each preset adds specific middleware, headers, library swaps, and startup checks.

| `COMPLIANCE=` | What it adds | Required for |
|---|---|---|
| `standard` (default) | Nothing. Base service only. | Commercial, SaaS, general use |
| `pci` | TLS enforced, PCI audit response headers, debug endpoints removed, no-plaintext-secrets startup check | Payments, retail, financial services with card data |
| `fips` | FIPS-140-2 OpenSSL module active, non-FIPS cipher suites disabled. **Requires `RUNTIME=fips`.** | Federal government, defense, regulated finance |
| `hipaa` | PHI field masking in logs, audit trail middleware, verbose error responses disabled | Healthcare, life sciences, medical devices |
| `cmmc` | Full audit log enforced, debug routes removed, no outbound internet at runtime, CUI data handling | Defense contractors, intelligence-adjacent work |
| `pipeda` | Consent check middleware, data residency header (`X-Data-Residency: CA`), PII field masking in logs | Any Canadian consumer-facing service |
| `nerc` | Network isolation config, no internet egress, OT/IT boundary enforcement headers | Power grid, utilities, industrial control systems |
| `soc2` | Immutable audit log, access control middleware, debug disabled | SaaS platforms, fintech, enterprise software |

PHI (Protected Health Information): personal health data regulated under PIPEDA/PHIA.

CUI (Controlled Unclassified Information): sensitive but unclassified government data.

PII (Personally Identifiable Information): data that identifies a specific person.

**Rule:** When `COMPLIANCE=fips` and `RUNTIME` is not `ubi9`: build fails with an error message.

<a id="observability"></a>
### Observability Stack

Planned: activate with `OBSERVABILITY` build arg.

| `OBSERVABILITY=` | What activates | Standard |
|---|---|---|
| `none` (default) | Nothing | — |
| `otel` | OpenTelemetry SDK + OTLP exporter for traces, metrics, and logs | CNCF open standard — works with Jaeger, Grafana, Datadog |
| `prometheus` | Prometheus metrics endpoint at `/metrics` | Kubernetes-native — Prometheus scrapes `/metrics` |
| `datadog` | Datadog tracer + APM agent | Datadog-only |

OpenTelemetry: open standard for observability data — not tied to any vendor.

OTLP (OpenTelemetry Protocol): the wire format for sending telemetry data.

<a id="auth"></a>
### Auth Strategy

Planned: activate with `AUTH` build arg.

| `AUTH=` | What activates | Protocol |
|---|---|---|
| `none` (default) | No auth | — |
| `jwt` | JWT Bearer token validation middleware on all routes | RFC 7519 |
| `oauth2` | OAuth2 client credentials flow | RFC 6749 |
| `oidc` | OpenID Connect — SSO with an external identity provider | OpenID Core 1.0 |
| `apikey` | API key header validation — checks `X-API-Key` header | Custom |
| `mtls` | Mutual TLS — client certificate required per request | RFC 8705 |

When `AUTH=mtls`: `RUNTIME` must be `ubi9` or `chainguard`.

Why: mTLS requires FIPS-grade TLS libraries. Only UBI9 and Chainguard base images include them.

<a id="orm"></a>
### ORM / Database Layer

Planned: activate with `ORM` build arg. Applies to server groups 14–27.

| Language group | Default ORM | Available alternatives |
|---|---|---|
| Node.js (14) | Prisma | Drizzle, TypeORM, Knex |
| Python (15) | SQLAlchemy | Tortoise ORM, Django ORM |
| Go (16) | GORM | sqlx, pgx (raw driver) |
| Java (17) | Hibernate / Spring Data | jOOQ |
| Kotlin (18) | Exposed (Ktor) | Spring Data JPA |
| .NET / C# (19) | Entity Framework Core | Dapper |
| Rust (20) | sqlx | Diesel |
| Ruby (22) | Active Record (Rails) | Sequel |
| PHP (23) | Eloquent (Laravel) | Doctrine (Symfony) |
| Scala (25) | Slick | Doobie |
| Elixir (21) | Ecto | — |

ORM (Object-Relational Mapper): library that maps database rows to code objects.

---

<a id="axis-matrix"></a>
## Feature Axis Matrix

Which `docker build --build-arg` axes apply to which service groups.

**Axis quick-reference — what each column means:**

| Axis | Column | What it does | Applies to | Status |
|---|---|---|---|---|
| Runtime variant | RUNTIME | Swap the base image — affects security posture and compliance eligibility | All 92 Docker services | ✅ Works today via `--target` stage name |
| Package manager | PKG_MGR | Replace npm with pnpm / yarn / bun in the Dockerfile | JS/TS groups 01–08, 13, 14 | Designed |
| Build tool | BUILD_TOOL | Replace Vite with webpack / rspack / esbuild as the JS/TS bundler | JS/TS groups 01–08, 13, 14 | Designed |
| Compliance preset | COMPLIANCE | Add PCI / FIPS / HIPAA / PIPEDA middleware and startup checks | All server groups | Designed |
| Observability | OBSERVABILITY | Add OpenTelemetry / Prometheus / Datadog instrumentation | All server groups | Designed |
| Auth strategy | AUTH | Add JWT Bearer / OAuth2 / OIDC / API key / mTLS middleware | All server groups (see * for SSR) | Designed |
| ORM / database | ORM | Add database library + schema example (Prisma, GORM, SQLAlchemy, etc.) | API server groups 14–27 | Designed |

**Legend:**

| Symbol | Meaning |
|---|---|
| Y | Applies — standard `--build-arg` pattern works for this group |
| — | Does not apply — build arg has no effect on this group |
| * | Different mechanism — applies but not via standard pattern (see Notes below) |

**Matrix — all 30 groups × 7 axes:**

| Group | RUNTIME | PKG_MGR | BUILD_TOOL | COMPLIANCE | OBSERVABILITY | AUTH | ORM |
|---|---|---|---|---|---|---|---|
| 01 SSR / Full-stack | Y | Y | Y | * | * | * | — |
| 02 Frontend SPA | Y | Y | Y | — | — | — | — |
| 03 Static Site Gen | Y | Y | Y | — | — | — | — |
| 04 Island Arch | Y | Y | Y | * | * | * | — |
| 05 Resumability | Y | Y | Y | * | * | * | — |
| 06 Edge Runtime | — | * | — | — | — | — | — |
| 07 Modern Routing | Y | Y | Y | * | * | * | — |
| 08 Module Federation | Y | Y | Y | — | — | — | — |
| 09 Mobile / RN | — | — | — | — | — | — | — |
| 10 Cross-platform | — | — | — | — | — | — | — |
| 11 Native iOS | — | — | — | — | — | — | — |
| 12 Native Android | — | — | — | — | — | — | — |
| 13 PWA | Y | Y | Y | — | — | — | — |
| 14 JS/TS Servers | Y | Y | Y | Y | Y | Y | Y |
| 15 Python Servers | Y | — | — | Y | Y | Y | Y |
| 16 Go Servers | Y | — | — | Y | Y | Y | Y |
| 17 Java Servers | Y | — | — | Y | Y | Y | Y |
| 18 Kotlin Servers | Y | — | — | Y | Y | Y | Y |
| 19 .NET Servers | Y | — | — | Y | Y | Y | Y |
| 20 Rust Servers | Y | — | — | Y | Y | Y | Y |
| 21 Elixir Servers | Y | — | — | Y | Y | Y | Y |
| 22 Ruby Servers | Y | — | — | Y | Y | Y | Y |
| 23 PHP Servers | Y | — | — | Y | Y | Y | Y |
| 24 Swift Servers | Y | — | — | Y | Y | Y | Y |
| 25 Scala Servers | Y | — | — | Y | Y | Y | Y |
| 26 Clojure Servers | Y | — | — | Y | Y | Y | Y |
| 27 C++ Servers | Y | — | — | Y | Y | Y | Y |
| 28 gRPC Servers | Y | — | — | Y | Y | Y | — |
| 29 GraphQL Servers | Y | — | — | Y | Y | Y | — |
| 30 WebSocket Servers | Y | — | — | Y | Y | Y | — |

**Notes on `*` cells:**

**Groups 01, 04, 05, 07 — COMPLIANCE and OBSERVABILITY:**

Pattern: HTTP handler level — same as pure API servers.

Behavior: applies fully.

Marked `*` as a reminder: verify the HTTP handler entry point before adding middleware in a full-stack framework.

**Groups 01, 04, 05, 07 — AUTH:**

What works: JWT Bearer middleware on `/api/*` routes within the framework.

What does not work: standard JWT middleware on SSR page routes.

Next.js page routes: use Next-Auth.

SvelteKit page routes: use `hooks.server.ts` sessions.

Remix page routes: use Remix sessions.

**Group 06 — PKG_MANAGER `*`:**

Applies via: lock file used by `wrangler deploy` — not a `docker build --build-arg`.

Does not apply: RUNTIME, BUILD_TOOL — group 06 has no Dockerfile.

How to set: configure `packageManager` field in `package.json`.

**Groups 02, 03, 08, 13 — COMPLIANCE, OBSERVABILITY, AUTH, ORM all `—`:**

Reason: static sites served by nginx. No application server. No middleware entry point.

**Groups 09–12 — all axes `—`:**

Reason: CI-only targets. No Docker. No server. Build args have no effect.

✅ RUNTIME = works today via both `--build-arg RUNTIME=` and `--target <stage-name>`.

All other 6 axes = designed only. Not yet in service source code.

---

<a id="composing"></a>
## Composing Variants — Full Build Command

**What works today:**

RUNTIME is selectable via `--build-arg RUNTIME=` for all 28 Tier 1 Docker services.

All other axes are not yet implemented.

```bash
# Standard runtime (default)
docker build --target runtime -t my-service services/14-express

# Select runtime variant
docker build --build-arg RUNTIME=slim -t my-service services/14-express
docker build --build-arg RUNTIME=fips -t my-service:fips services/14-express

# Backward compat: --target still works
docker build --target runtime-fips -t my-service:fips services/14-express
```

**RUNTIME values per service group:**

| Group | Default | Variants |
|---|---|---|
| Node.js SSR / API servers (01, 07, 14) | `alpine` | `alpine` \| `slim` \| `fips` |
| nginx SPA / static (02, 03) | `alpine` | `alpine` \| `stable` \| `fips` |
| Python servers (15) | `slim` | `slim` \| `alpine` \| `fips` |
| Go servers (16, 28-go-grpc) | `scratch` | `scratch` \| `distroless` \| `alpine` \| `fips` |
| Java / Kotlin servers (17, 18, 28-java-grpc) | `distroless` | `distroless` \| `temurin` \| `fips` |
| .NET / C# servers (19) | `alpine` | `alpine` \| `debian` \| `fips` |
| Rust servers (20) | `scratch` | `scratch` \| `distroless` \| `alpine` \| `fips` |
| Elixir servers (21) | `debian` | `debian` \| `alpine` \| `fips` |
| Ruby servers (22) | `alpine` | `alpine` \| `slim` \| `fips` |
| PHP servers (23) | `alpine` | `alpine` \| `debian` |
| gRPC node/python (28) | `slim` | `slim` \| `alpine` \| `fips` |

**Planned interface (once all axes are implemented):**

All axes compose in a single `docker build` call via `--build-arg`.

```bash
docker build \
  --build-arg RUNTIME=fips \
  --build-arg PKG_MANAGER=pnpm \
  --build-arg BUILD_TOOL=vite \
  --build-arg OBSERVABILITY=otel \
  --build-arg AUTH=oidc \
  --build-arg ORM=prisma \
  --build-arg COMPLIANCE=fips \
  -t my-service:fips-otel-oidc \
  services/14-express
```

Note: only RUNTIME works today. The other 6 axes are designed but not yet implemented.

---

<a id="industry-verticals"></a>
## Industry Vertical → Variant Reference

Which variant combination to use for each industry.

This is self-contained — no external doc needed.

### Financial Services
Banks, credit unions, fintechs, payment processors, investment firms.

Regulations that apply: OSFI (bank risk management), FINTRAC (anti-money laundering reporting), PCI DSS (payment card security).

| What you're building | Variant combination |
|---|---|
| Payment processing service | `RUNTIME=alpine` *(chainguard — planned)* + `COMPLIANCE=pci` + `AUTH=mtls` |
| Open banking API | `RUNTIME=slim` + `COMPLIANCE=pci` + `AUTH=oauth2` |
| AML / KYC pipeline | `RUNTIME=alpine` *(chainguard — planned)* + `COMPLIANCE=soc2` + `AUTH=oidc` |
| Internal tooling (no card data) | `RUNTIME=slim` + `COMPLIANCE=soc2` + `AUTH=jwt` |

### Government — Federal (Canada)
CRA, ESDC, IRCC, SSC, PSPC and all federal departments.

Regulations: ITSG-33 (IT security risk management), Protected B (sensitive unclassified data), WCAG 2.1 AA (accessibility), Official Languages Act (English + French).

Clearance: Reliability Status minimum. Secret for ~40% of roles. Top Secret for DND/CSE/CSIS.

| What you're building | Variant combination |
|---|---|
| Public-facing portal | `RUNTIME=fips` + `COMPLIANCE=fips` + `AUTH=oidc` |
| Internal Protected B system | `RUNTIME=fips` + `COMPLIANCE=fips` + `AUTH=mtls` |
| API service (GC API guidelines) | `RUNTIME=fips` + `COMPLIANCE=fips` + `AUTH=oauth2` |

### Government — Provincial
Ontario, BC, Alberta, Quebec provincial ministries and agencies.

Regulations: FIPPA (Freedom of Information and Protection of Privacy Act), provincial equivalents of PIPEDA.

| What you're building | Variant combination |
|---|---|
| Citizen-facing service | `RUNTIME=slim` + `COMPLIANCE=pipeda` + `AUTH=oidc` |
| Internal staff system | `RUNTIME=alpine` + `COMPLIANCE=pipeda` + `AUTH=jwt` |

### Defense and Intelligence
DND (Department of National Defense), CSE (Communications Security Establishment), defense contractors.

Regulations: CMMC (Cybersecurity Maturity Model Certification), ITAR awareness, Top Secret clearance required for most roles.

| What you're building | Variant combination |
|---|---|
| Any defense system | `RUNTIME=fips` + `COMPLIANCE=cmmc` + `COMPLIANCE=fips` + `AUTH=mtls` |

### Healthcare and Life Sciences
Hospitals, clinics, pharma companies, medical device makers, biotech.

Regulations: PIPEDA (personal data), PHIA (personal health information — provincial), FHIR (health data interoperability standard), Health Canada device regulations.

| What you're building | Variant combination |
|---|---|
| Patient data system | `RUNTIME=alpine` *(chainguard — planned)* + `COMPLIANCE=hipaa` + `COMPLIANCE=pipeda` + `AUTH=oidc` |
| Clinical trial platform | `RUNTIME=alpine` *(chainguard — planned)* + `COMPLIANCE=soc2` + `AUTH=oauth2` |
| Medical device API | `RUNTIME=fips` + `COMPLIANCE=fips` + `AUTH=mtls` |

### Energy and Utilities
Oil and gas, renewable energy, power grid, water utilities.

Regulations: NERC CIP (North American Electric Reliability Corporation — Critical Infrastructure Protection), mandatory for any system connected to the power grid.

| What you're building | Variant combination |
|---|---|
| Grid-connected system | `RUNTIME=fips` + `COMPLIANCE=nerc` + `COMPLIANCE=fips` + `AUTH=mtls` |
| Field operations tool | `RUNTIME=slim` + `COMPLIANCE=soc2` + `AUTH=jwt` |

### Technology and SaaS
Software companies, AI/ML platforms, developer tools, enterprise SaaS.

Regulations: SOC 2 Type II (security audit standard required by enterprise customers), PIPEDA for Canadian users, EU AI Act if serving EU customers.

| What you're building | Variant combination |
|---|---|
| Enterprise SaaS API | `RUNTIME=slim` + `COMPLIANCE=soc2` + `AUTH=jwt` or `oauth2` |
| AI inference service | `RUNTIME=alpine` *(chainguard — planned)* + `COMPLIANCE=soc2` + `AUTH=apikey` |
| Internal developer tool | `RUNTIME=alpine` + no compliance preset |

### Retail and Commerce
E-commerce platforms, point-of-sale systems, payment integrations.

Regulations: PCI DSS (mandatory when storing, processing, or transmitting card data).

| What you're building | Variant combination |
|---|---|
| Checkout / payment service | `RUNTIME=alpine` *(chainguard — planned)* + `COMPLIANCE=pci` + `AUTH=oauth2` |
| Product catalog / storefront | `RUNTIME=slim` + no compliance preset + `AUTH=jwt` |

### Telecommunications
Mobile carriers, ISPs, cable companies.

Regulations: CRTC (Canadian Radio-television and Telecommunications Commission — governs data retention, privacy).

| What you're building | Variant combination |
|---|---|
| Customer data service | `RUNTIME=slim` + `COMPLIANCE=pipeda` + `AUTH=oauth2` |
| Network management API | `RUNTIME=slim` + `COMPLIANCE=soc2` + `AUTH=mtls` |

### Education
Universities, colleges, K-12 boards, EdTech platforms.

Regulations: FIPPA (student data), AODA (accessibility — Ontario), WCAG 2.1 AA.

| What you're building | Variant combination |
|---|---|
| Student information system | `RUNTIME=alpine` + `COMPLIANCE=pipeda` + `AUTH=oidc` |
| EdTech platform | `RUNTIME=slim` + `COMPLIANCE=soc2` + `AUTH=jwt` |

### All Other Verticals

| Vertical | Compliance arg | Runtime arg |
|---|---|---|
| Manufacturing / Industrial IoT | `soc2` | `slim` |
| Media and Entertainment | `standard` | `standard` |
| Transportation and Logistics | `soc2` | `slim` |
| Real Estate (FINTRAC applies) | `pci` | `slim` |
| Agriculture / AgriTech | `standard` | `standard` |
| Legal and Professional Services | `pipeda` | `slim` |
| Non-profit and Social | `standard` | `standard` |

---

<a id="tag-convention"></a>
## Registry Image Tag Convention

One tag encodes the full variant for traceability.

```
<registry>/<service-name>:<compliance>-<runtime>-<semver>

Examples:
  ghcr.io/yarova-ca/14-express:standard-slim-1.0.0
  ghcr.io/yarova-ca/17-spring-boot:fips-ubi9-1.0.0
  ghcr.io/yarova-ca/15-fastapi:pci-chainguard-2.3.1
```

Compliance determines the registry:

| Compliance | Push target |
|---|---|
| `standard`, `soc2`, `pci` | `ghcr.io/yarova-ca` (public) |
| `fips`, `hipaa`, `cmmc` | Internal registry only — no public push |
| `nerc`, CMMC Level 3 | Air-gapped registry — no internet access during push |

---

<a id="catalog"></a>
## Service Catalog — All 105 Services

**Column definitions:**

- **Pkg Mgr** — package manager used in the Dockerfile today
- **Port** — the `EXPOSE` port in the Dockerfile
- **Docker** — `Y` = Dockerfile with `--target runtime` stage exists. `N/A` = no Dockerfile.
- **Build** — `PASS` = `docker build --target runtime` completed without errors. `N/A` = no Dockerfile.
- **/health** — `Y` = `GET /health` route defined in source. `N` = route not present. `N/A` = no server.
- **/live** — `Y` = `GET /health/live` route defined in source. `N` = not present. `N/A` = no server.
- **/ready** — `Y` = `GET /health/ready` route defined in source. `N` = not present. `N/A` = no server.
- **Tests** — `Y` = test files exist in the service directory. `N` = no test files found.
- **Example** — `Y` = worked business-logic pattern example in the service (CRUD, auth, queue, etc.). `N` = hello world + health only. `N/A` = no server.

---

<a id="g01"></a>
### Group 01 — SSR / Full-stack

Each service runs a Node.js server that renders HTML on the server per request.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-angular-ssr | Angular SSR | npm | 4000 | Y | PASS | Y | Y | Y | Y | N |
| 01-nextjs | Next.js | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 01-nuxt | Nuxt | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 01-remix | Remix | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 01-solid-start | Solid Start | npm | 3000 | Y | PASS | Y | Y | Y | N | N |
| 01-sveltekit | SvelteKit | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g02"></a>
### Group 02 — Frontend SPA

Build output is static HTML/JS/CSS. Runtime is nginx serving those files. No Node.js in the container.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 02-angular | Angular | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 02-lit | Lit | npm | 80 | Y | pending | N | N | N | N | N/A |
| 02-preact | Preact | npm | 80 | Y | pending | N | N | N | N | N/A |
| 02-react | React | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 02-solidjs | SolidJS | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 02-svelte | Svelte | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 02-vue | Vue | npm | 80 | Y | PASS | N | N | N | Y | N/A |

---

<a id="g03"></a>
### Group 03 — Static Site Generators

Build output is pre-rendered HTML. Runtime is nginx. Hugo uses a Go binary for the build — no npm.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 03-astro | Astro | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 03-eleventy | Eleventy | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 03-gatsby | Gatsby | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 03-hugo | Hugo | — | 80 | Y | PASS | N | N | N | N | N/A |

---

<a id="g04"></a>
### Group 04 — Island Architecture

Island architecture: only interactive components hydrate in the browser. Rest is static HTML.

Fresh uses Deno natively — no npm.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 04-astro | Astro Islands | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 04-fresh | Fresh | deno | 8000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g05"></a>
### Group 05 — Resumability

Resumability: the server serializes component state to HTML. The browser resumes without re-running JavaScript.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 05-qwik | Qwik | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g06"></a>
### Group 06 — Edge Runtime (CI-only, no Docker)

Cloudflare Workers: code runs at the network edge, not in a container.

Build command: `wrangler deploy` — not `docker build`.

No health endpoints — Workers respond to HTTP requests directly.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 06-hono-edge | Hono / Workers | npm | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 06-nextjs-edge | Next.js Edge | npm | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 06-remix-cloudflare | Remix / Workers | npm | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |

---

<a id="g07"></a>
### Group 07 — Modern Routing Patterns

Same frameworks as group 01 but demonstrating specific routing features: App Router (Next.js), file-based routing (Remix/SvelteKit).

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 07-nextjs-app-router | Next.js App Router | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 07-remix | Remix | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 07-sveltekit | SvelteKit | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g08"></a>
### Group 08 — Module Federation

Module federation: multiple independently deployed frontend apps share components at runtime.

Runtime is nginx serving the shell app or remote entry.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 08-mf-rspack | Rspack MF | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 08-mf-webpack | Webpack 5 MF | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 08-single-spa | single-spa | npm | 80 | Y | PASS | N | N | N | Y | N/A |

---

<a id="g09"></a>
### Group 09 — Mobile / React Native (CI-only, no Docker)

Build via EAS (Expo Application Services) or Metro bundler. Output is a mobile app binary, not a container.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 09-expo | Expo | npm | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 09-ionic | Ionic | npm | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 09-react-native | React Native | npm | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |

---

<a id="g10"></a>
### Group 10 — Cross-platform Mobile (CI-only, no Docker)

Build via `flutter build`, `dotnet build`, or Gradle. Output is a mobile app binary, not a container.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 10-dotnet-maui | .NET MAUI | dotnet | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 10-flutter | Flutter | flutter | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 10-kmp | Kotlin Multiplatform | gradle | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |

---

<a id="g11"></a>
### Group 11 — Native iOS (CI-only, macOS runner required)

Build via Xcode. Requires a macOS CI runner. No Linux Docker build possible.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 11-objc-uikit | Obj-C UIKit | xcodebuild | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 11-swift-swiftui | Swift SwiftUI | xcodebuild | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |

---

<a id="g12"></a>
### Group 12 — Native Android (CI-only, no Docker)

Build via Gradle on a JVM runner. Output is an APK or AAB file, not a container.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 12-java-android | Java Android | gradle | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |
| 12-kotlin-jetpack | Kotlin Jetpack | gradle | N/A | N/A | N/A | N/A | N/A | N/A | N | N/A |

---

<a id="g13"></a>
### Group 13 — Progressive Web Apps (nginx, static)

PWA (Progressive Web App): a web app installable on mobile with offline capability via a service worker.

Build output is static files. Runtime is nginx.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 13-vite-pwa | Vite PWA | npm | 80 | Y | PASS | N | N | N | Y | N/A |
| 13-workbox | Workbox | npm | 80 | Y | PASS | N | N | N | Y | N/A |

---

<a id="g14"></a>
### Group 14 — JavaScript / TypeScript Servers

Deno uses its own dependency system (no npm needed). Elysia is Bun-native.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 14-bun | Bun native | bun | 3000 | Y | pending | Y | Y | Y | Y | N |
| 14-deno | Oak (Deno) | deno | 8000 | Y | PASS | Y | Y | Y | Y | N |
| 14-elysia | Elysia | bun | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 14-express | Express.js | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 14-fastify | Fastify | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 14-hono | Hono | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 14-nestjs | NestJS | npm | 3000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g15"></a>
### Group 15 — Python Servers

All Python services use pip with `requirements.txt`. Runtime uses gunicorn (WSGI) or uvicorn (ASGI).

WSGI: Python standard for synchronous web servers. ASGI: Python standard for async web servers.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 15-django | Django | pip | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 15-fastapi | FastAPI | pip | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 15-flask | Flask | pip | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 15-starlette | Starlette | pip | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g16"></a>
### Group 16 — Go Servers

Go modules (go mod) manages dependencies. Single static binary in the runtime image.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 16-chi | chi | go mod | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 16-echo | Echo | go mod | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 16-fiber | Fiber | go mod | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 16-gin | Gin | go mod | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g17"></a>
### Group 17 — Java Servers

All three use Maven for builds. All output a fat JAR (single runnable file including all dependencies).

Fat JAR: a single `.jar` file that includes the application and all its dependencies.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 17-micronaut | Micronaut | Maven | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 17-quarkus | Quarkus | Maven | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 17-spring-boot | Spring Boot | Maven | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g18"></a>
### Group 18 — Kotlin Servers

Both use Gradle. Ktor uses Exposed ORM. Spring Boot Kotlin is Spring Boot with Kotlin syntax.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 18-ktor | Ktor | Gradle | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 18-spring-boot-kotlin | Spring Boot | Gradle | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g19"></a>
### Group 19 — .NET / C# Servers

`dotnet publish` produces a self-contained binary. Port 8080 is set via `PORT` environment variable.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 19-aspnet-core | ASP.NET Core MVC | dotnet | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 19-minimal-apis | ASP.NET Minimal APIs | dotnet | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g20"></a>
### Group 20 — Rust Servers

Tests are inline `#[cfg(test)]` modules inside `src/main.rs` — no separate test files.

Cargo builds a single static binary. Runtime image requires no runtime dependencies.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 20-actix-web | Actix-web | cargo | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 20-axum | Axum | cargo | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g21"></a>
### Group 21 — Elixir Servers

Mix is Elixir's build tool and dependency manager. Phoenix is Elixir's main web framework.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 21-phoenix | Phoenix | mix | 4000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g22"></a>
### Group 22 — Ruby Servers

Bundler manages Ruby gems (libraries). Bun handles JavaScript asset compilation (CSS/JS bundling).

Why bun for Ruby: Rails and Sinatra use Propshaft for asset pipeline — bun is the JS bundler it calls.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 22-rails | Ruby on Rails | bundler + bun | 3000 | Y | PASS | Y | Y | Y | Y | N |
| 22-sinatra | Sinatra | bundler + bun | 3000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g23"></a>
### Group 23 — PHP Servers

PHP-FPM (FastCGI Process Manager): PHP runtime that handles requests behind nginx.

Port 9000 = PHP-FPM socket port. nginx listens on 80/8080 and proxies to PHP-FPM on 9000.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 23-laravel | Laravel | composer | 9000 | Y | PASS | Y | Y | Y | Y | N |
| 23-slim | Slim | composer | 9000 | Y | PASS | Y | Y | Y | Y | N |
| 23-symfony | Symfony | composer | 9000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g24"></a>
### Group 24 — Swift Servers

SPM (Swift Package Manager): built into the Swift toolchain — no separate install required.

24-hummingbird has a placeholder test file only — no real tests yet.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 24-hummingbird | Hummingbird | SPM | 8080 | Y | PASS | Y | Y | Y | N | N |
| 24-vapor | Vapor | SPM | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g25"></a>
### Group 25 — Scala Servers

sbt (Scala Build Tool): manages dependencies and builds, similar to Maven or Gradle.

Play Framework defaults to port 9000. http4s defaults to port 8080.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 25-http4s | http4s | sbt | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 25-play | Play Framework | sbt | 9000 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g26"></a>
### Group 26 — Clojure Servers

Leiningen (lein): Clojure's primary build tool and dependency manager.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 26-pedestal | Pedestal | lein | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 26-ring | Ring | lein | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g27"></a>
### Group 27 — C++ Servers

CMake: build system generator — produces Makefiles or Ninja build files.

Tests use GoogleTest (GTest) — built alongside the main binary via CMake.

| Service | Framework | Pkg Mgr | Port | Docker | Build | /health | /live | /ready | Tests | Example |
|---|---|---|---|---|---|---|---|---|---|---|
| 27-crow | Crow | cmake | 8080 | Y | PASS | Y | Y | Y | Y | N |
| 27-drogon | Drogon | cmake | 8080 | Y | PASS | Y | Y | Y | Y | N |

---

<a id="g28"></a>
### Group 28 — gRPC Servers

gRPC: Google Remote Procedure Call — binary protocol over HTTP/2 using Protocol Buffers.

Port 50051: the conventional gRPC port.

Port 8080: HTTP sidecar for Kubernetes liveness/readiness probes (gRPC is not HTTP/1.1).

Health check for gRPC: `grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check`

| Service | Library / SDK | Pkg Mgr | gRPC port | HTTP port | Docker | Tests | Example |
|---|---|---|---|---|---|---|---|
| 28-go-grpc | grpc-go 1.63 | go mod | 50051 | 8080 | Y | Y | N |
| 28-node-grpc | @grpc/grpc-js 1.10 | npm | 50051 | 8080 | Y | N | N |
| 28-python-grpc | grpcio 1.63 | pip | 50051 | 8080 | Y | Y | N |
| 28-java-grpc | grpc-java 1.63 | Maven | 50051 | 8080 | Y | N | N |
| 28-kotlin-grpc | grpc-kotlin 1.4 | Gradle | 50051 | N/A | Y | N | N |
| 28-dotnet-grpc | grpc-dotnet 2.62 | dotnet | 50051 | 8080 | Y | N | N |
| 28-rust-grpc | tonic 0.11 | cargo | 50051 | N/A | Y | N | N |
| 28-ruby-grpc | grpc 1.63 | bundler | 50051 | N/A | Y | N | N |
| 28-php-grpc | grpc/grpc 1.63 | composer | 50051 | 8080 | Y | N | N |
| 28-swift-grpc | grpc-swift 2.0 | SPM | 50051 | N/A | Y | N | N |

---

<a id="g29"></a>
### Group 29 — GraphQL Servers

GraphQL: query language for APIs — client specifies exactly what data it needs in one POST /graphql.

Introspection: disabled in production (exposes full schema to attackers — turn off via config).

DataLoader: batching pattern that prevents N+1 query problems in resolvers.

| Service | Library | Language | Pkg Mgr | Port | Docker | Tests | Example |
|---|---|---|---|---|---|---|---|
| 29-apollo | Apollo Server 4.10 | TypeScript | npm | 4000 | Y | N | N |
| 29-graphql-yoga | GraphQL Yoga 5.6 | TypeScript | npm | 4000 | Y | N | N |
| 29-strawberry | Strawberry 0.235 | Python | pip | 8000 | Y | N | N |
| 29-gqlgen | gqlgen 0.17 | Go | go mod | 8080 | Y | Y | N |
| 29-spring-graphql | Spring for GraphQL 1.3 | Java | Maven | 8080 | Y | N | N |
| 29-hot-chocolate | Hot Chocolate 14 | .NET C# | dotnet | 8080 | Y | N | N |
| 29-graphql-ruby | graphql-ruby 2.3 | Ruby | bundler | 4567 | Y | N | N |
| 29-async-graphql | async-graphql 7.0 | Rust | cargo | 8080 | Y | N | N |

---

<a id="g30"></a>
### Group 30 — WebSocket Servers

WebSocket: full-duplex TCP connection started via HTTP Upgrade — persistent, bidirectional.

Horizontal scaling: WebSocket requires sticky sessions or Redis pub/sub because messages go to one pod.

Health probe: Kubernetes cannot probe wss:// — use HTTP GET /health on the same port (except 30-ws-java: use port 8081).

| Service | Library | Language | Pkg Mgr | Port | Docker | Tests | Example |
|---|---|---|---|---|---|---|---|
| 30-ws-node | ws 8.17 | TypeScript | npm | 8080 | Y | N | N |
| 30-ws-go | gorilla/websocket 1.5 | Go | go mod | 8080 | Y | Y | N |
| 30-ws-python | websockets 12.0 / FastAPI | Python | pip | 8080 | Y | Y | N |
| 30-ws-java | Java-WebSocket 1.5 | Java | Maven | 8080 | Y | N | N |
| 30-ws-elixir | Plug.Cowboy 2.7 | Elixir | mix | 8080 | Y | N | N |
| 30-ws-rust | tokio-tungstenite 0.23 / Axum | Rust | cargo | 8080 | Y | N | N |
| 30-ws-dotnet | ASP.NET WebSocket middleware | C# | dotnet | 8080 | Y | N | N |
| 30-ws-ruby | faye-websocket 0.11 | Ruby | bundler | 9292 | Y | N | N |

---

<a id="counts"></a>
## Counts

| Metric | Count |
|---|---|
| Total services | 105 |
| Services with Docker | 92 |
| CI-only (no Docker — edge/mobile/native, by design) | 13 |
| Server services with /health + /health/live + /health/ready | 72 |
| Static/nginx services — health = nginx port 80 response | 16 |
| gRPC services — health via grpc.health.v1 + HTTP sidecar | 10 |
| Services with test files | 66 |
| Services missing tests | 39 |

Tests missing in new services (groups 28–30): all except `28-go-grpc`, `28-python-grpc`, `29-gqlgen`, `30-ws-go`, `30-ws-python`.

Tests missing in original services: `03-hugo`, `06-hono-edge`, `06-nextjs-edge`, `06-remix-cloudflare`, `09-expo`, `09-ionic`, `09-react-native`, `10-dotnet-maui`, `10-flutter`, `10-kmp`, `11-objc-uikit`, `11-swift-swiftui`, `12-java-android`, `12-kotlin-jetpack`, `24-hummingbird`.

---

<a id="ci-stages"></a>
## CI Pipeline Stages — Next Phase

These stages are the plan. They have not been implemented yet.

| Stage | Service groups | What runs |
|---|---|---|
| 1 — Frontend build | 01–08, 13 | `docker build --target runtime`. nginx smoke test on `/`. |
| 2 — HTTP server build and test | 14–27 | `docker build --target runtime`. `/health/live` probe. Run test suite. |
| 3 — gRPC build and test | 28 | `docker build --target runtime`. `grpcurl` health check on port 50051. |
| 4 — GraphQL build and test | 29 | `docker build --target runtime`. `POST /graphql` with `{"query":"{__typename}"}`. |
| 5 — WebSocket build and test | 30 | `docker build --target runtime`. `wscat -c ws://localhost:PORT/ws`. |
| 6 — Mobile CI | 09–12 | Platform-native build. No Docker. |
| 7 — Edge deploy | 06 | `wrangler deploy`. No Docker. |
| 8 — Registry push | All Docker services | Push all 3 variants: `standard`, `chainguard`, `ubi9`. |
| 9 — Compliance scan | All Docker images | Trivy CVE scan per image. Fail on CRITICAL severity. |

Trivy: open-source vulnerability scanner for container images.

CVE (Common Vulnerabilities and Exposures): publicly known security vulnerability identifier.
