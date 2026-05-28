#!/usr/bin/env python3
"""
Generate 75 GitHub Actions workflow YAML templates for pipeline-studio.

Outputs to: workflow-templates/{slug}.yml

Each file is copy-paste ready. Developer copies to their repo's
.github/workflows/ci.yml and it works immediately.

Usage:
    python3 scripts/generate_workflow_templates.py
"""

import os

# ─── FRAMEWORK DATA (same source of truth as issue templates) ─────────────

FRAMEWORKS = [
# 01 SSR/Hybrid
{'num':21,'cat':'01 SSR/Hybrid','name':'Next.js','ver':'16.2.6','slug':'01-nextjs','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':22,'cat':'01 SSR/Hybrid','name':'Remix','ver':'7','slug':'01-remix','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':23,'cat':'01 SSR/Hybrid','name':'Nuxt','ver':'4.4','slug':'01-nuxt','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':24,'cat':'01 SSR/Hybrid','name':'SvelteKit','ver':'2.57','slug':'01-sveltekit','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':25,'cat':'01 SSR/Hybrid','name':'Angular SSR','ver':'20','slug':'01-angular-ssr','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':4000},
# 02 CSR/SPA
{'num':26,'cat':'02 CSR/SPA','name':'React','ver':'19','slug':'02-react','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':27,'cat':'02 CSR/SPA','name':'Vue','ver':'3.5','slug':'02-vue','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':28,'cat':'02 CSR/SPA','name':'Angular','ver':'20','slug':'02-angular','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':29,'cat':'02 CSR/SPA','name':'Svelte','ver':'5','slug':'02-svelte','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':30,'cat':'02 CSR/SPA','name':'Solid.js','ver':'2.0','slug':'02-solidjs','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 03 SSG
{'num':31,'cat':'03 SSG','name':'Astro','ver':'6.3','slug':'03-astro','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':32,'cat':'03 SSG','name':'Eleventy','ver':'3.0','slug':'03-eleventy','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':33,'cat':'03 SSG','name':'Hugo','ver':'0.161','slug':'03-hugo','lang':'hugo','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':34,'cat':'03 SSG','name':'Gatsby','ver':'5.13','slug':'03-gatsby','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 04 Islands
{'num':35,'cat':'04 Islands','name':'Astro','ver':'6.3','slug':'04-astro','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':36,'cat':'04 Islands','name':'Fresh','ver':'2.3','slug':'04-fresh','lang':'deno','pattern':'multi-stage','runtime':'denoland/deno:2.3-alpine','fips_rt':'N/A','port':8000},
# 05 Resumability
{'num':37,'cat':'05 Resumability','name':'Qwik','ver':'2.0','slug':'05-qwik','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
# 06 Edge
{'num':38,'cat':'06 Edge Rendering','name':'Next.js Edge','ver':'16','slug':'06-nextjs-edge','lang':'edge','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':39,'cat':'06 Edge Rendering','name':'Hono','ver':'4.7','slug':'06-hono-edge','lang':'edge','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':40,'cat':'06 Edge Rendering','name':'Remix Cloudflare','ver':'7','slug':'06-remix-cloudflare','lang':'edge','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
# 07 Streaming SSR
{'num':41,'cat':'07 Streaming SSR','name':'Next.js App Router','ver':'16','slug':'07-nextjs-app-router','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':42,'cat':'07 Streaming SSR','name':'Remix','ver':'7','slug':'07-remix','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':43,'cat':'07 Streaming SSR','name':'SvelteKit','ver':'2.57','slug':'07-sveltekit','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
# 08 Micro-frontends
{'num':44,'cat':'08 Micro-frontends','name':'Module Federation Webpack','ver':'5','slug':'08-mf-webpack','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':45,'cat':'08 Micro-frontends','name':'Module Federation Rspack','ver':'1','slug':'08-mf-rspack','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':46,'cat':'08 Micro-frontends','name':'single-spa','ver':'6.0','slug':'08-single-spa','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 09 Cross-platform JS
{'num':47,'cat':'09 Cross-platform JS','name':'React Native','ver':'0.79','slug':'09-react-native','lang':'mobile-js','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':48,'cat':'09 Cross-platform JS','name':'Expo','ver':'52','slug':'09-expo','lang':'mobile-js','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':49,'cat':'09 Cross-platform JS','name':'Ionic','ver':'8','slug':'09-ionic','lang':'mobile-js','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
# 10 Cross-platform non-JS
{'num':50,'cat':'10 Cross-platform non-JS','name':'Flutter','ver':'3.44','slug':'10-flutter','lang':'flutter','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':51,'cat':'10 Cross-platform non-JS','name':'.NET MAUI','ver':'10','slug':'10-dotnet-maui','lang':'dotnet-mobile','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':52,'cat':'10 Cross-platform non-JS','name':'Kotlin Multiplatform','ver':'2.1','slug':'10-kmp','lang':'android-native','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
# 11 Native iOS
{'num':53,'cat':'11 Native iOS','name':'Swift / SwiftUI','ver':'6','slug':'11-swift-swiftui','lang':'ios-native','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':54,'cat':'11 Native iOS','name':'Objective-C UIKit','ver':'SDK 17','slug':'11-objc-uikit','lang':'ios-native','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
# 12 Native Android
{'num':55,'cat':'12 Native Android','name':'Kotlin Jetpack Compose','ver':'2.0','slug':'12-kotlin-jetpack','lang':'android-native','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
{'num':56,'cat':'12 Native Android','name':'Java Android SDK','ver':'17','slug':'12-java-android','lang':'android-native','pattern':'ci-only','runtime':'N/A','fips_rt':'N/A','port':None},
# 13 PWA
{'num':57,'cat':'13 PWA','name':'Workbox','ver':'7.3','slug':'13-workbox','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':58,'cat':'13 PWA','name':'Vite PWA Plugin','ver':'0.21','slug':'13-vite-pwa','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 14 Node/Deno/Bun
{'num':59,'cat':'14 Node/Deno/Bun','name':'Express','ver':'5.0','slug':'14-express','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':60,'cat':'14 Node/Deno/Bun','name':'Fastify','ver':'5.2','slug':'14-fastify','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':61,'cat':'14 Node/Deno/Bun','name':'NestJS','ver':'11.0','slug':'14-nestjs','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':62,'cat':'14 Node/Deno/Bun','name':'Hono','ver':'4.7','slug':'14-hono','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':63,'cat':'14 Node/Deno/Bun','name':'Deno','ver':'2.3','slug':'14-deno','lang':'deno','pattern':'multi-stage','runtime':'denoland/deno:2.3-alpine','fips_rt':'N/A','port':8000},
{'num':64,'cat':'14 Node/Deno/Bun','name':'Elysia','ver':'1.2','slug':'14-elysia','lang':'bun','pattern':'multi-stage','runtime':'oven/bun:1-alpine','fips_rt':'N/A','port':3000},
# 15 Python
{'num':65,'cat':'15 Python','name':'FastAPI','ver':'0.115','slug':'15-fastapi','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
{'num':66,'cat':'15 Python','name':'Django','ver':'5.2','slug':'15-django','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
{'num':67,'cat':'15 Python','name':'Flask','ver':'3.1','slug':'15-flask','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
{'num':68,'cat':'15 Python','name':'Starlette','ver':'0.41','slug':'15-starlette','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
# 16 Go
{'num':69,'cat':'16 Go','name':'Gin','ver':'1.10','slug':'16-gin','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':70,'cat':'16 Go','name':'Echo','ver':'4.12','slug':'16-echo','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':71,'cat':'16 Go','name':'Fiber','ver':'3.0','slug':'16-fiber','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':72,'cat':'16 Go','name':'Chi','ver':'5.2','slug':'16-chi','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
# 17 Java
{'num':73,'cat':'17 Java','name':'Spring Boot','ver':'3.4','slug':'17-spring-boot','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':74,'cat':'17 Java','name':'Quarkus','ver':'3.35','slug':'17-quarkus','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':75,'cat':'17 Java','name':'Micronaut','ver':'5.0','slug':'17-micronaut','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 18 Kotlin
{'num':76,'cat':'18 Kotlin','name':'Ktor','ver':'3.5','slug':'18-ktor','lang':'kotlin','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':77,'cat':'18 Kotlin','name':'Spring Boot Kotlin','ver':'3.4','slug':'18-spring-boot-kotlin','lang':'kotlin','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 19 .NET
{'num':78,'cat':'19 .NET','name':'ASP.NET Core','ver':'9','slug':'19-aspnet-core','lang':'dotnet','pattern':'multi-stage','runtime':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine','fips_rt':'mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips','port':8080},
{'num':79,'cat':'19 .NET','name':'Minimal APIs .NET','ver':'9','slug':'19-minimal-apis','lang':'dotnet','pattern':'multi-stage','runtime':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine','fips_rt':'mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips','port':8080},
# 20 Rust
{'num':80,'cat':'20 Rust','name':'Axum','ver':'0.8','slug':'20-axum','lang':'rust','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':81,'cat':'20 Rust','name':'Actix-web','ver':'4.9','slug':'20-actix-web','lang':'rust','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
# 21 Elixir
{'num':82,'cat':'21 Elixir/BEAM','name':'Phoenix','ver':'1.7','slug':'21-phoenix','lang':'elixir','pattern':'multi-stage','runtime':'hexpm/elixir:1.17-erlang-27-debian-bookworm-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-minimal','port':4000},
# 22 Ruby
{'num':83,'cat':'22 Ruby','name':'Rails','ver':'8.0','slug':'22-rails','lang':'ruby','pattern':'multi-stage','runtime':'ruby:3.3-alpine','fips_rt':'registry.access.redhat.com/ubi9/ruby-32','port':3000},
{'num':84,'cat':'22 Ruby','name':'Sinatra','ver':'4.0','slug':'22-sinatra','lang':'ruby','pattern':'multi-stage','runtime':'ruby:3.3-alpine','fips_rt':'registry.access.redhat.com/ubi9/ruby-32','port':3000},
# 23 PHP
{'num':85,'cat':'23 PHP','name':'Laravel','ver':'12','slug':'23-laravel','lang':'php','pattern':'multi-stage','runtime':'php:8.3-fpm-alpine','fips_rt':'N/A','port':9000},
{'num':86,'cat':'23 PHP','name':'Symfony','ver':'7.2','slug':'23-symfony','lang':'php','pattern':'multi-stage','runtime':'php:8.3-fpm-alpine','fips_rt':'N/A','port':9000},
{'num':87,'cat':'23 PHP','name':'Slim','ver':'4.14','slug':'23-slim','lang':'php','pattern':'multi-stage','runtime':'php:8.3-fpm-alpine','fips_rt':'N/A','port':9000},
# 24 Swift Server
{'num':88,'cat':'24 Swift Server','name':'Vapor','ver':'4.121','slug':'24-vapor','lang':'swift-server','pattern':'multi-stage','runtime':'swift:6.0-noble-slim','fips_rt':'N/A','port':8080},
{'num':89,'cat':'24 Swift Server','name':'Hummingbird','ver':'2.0','slug':'24-hummingbird','lang':'swift-server','pattern':'multi-stage','runtime':'swift:6.0-noble-slim','fips_rt':'N/A','port':8080},
# 25 Scala
{'num':90,'cat':'25 Scala','name':'Play','ver':'3.0','slug':'25-play','lang':'scala','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':9000},
{'num':91,'cat':'25 Scala','name':'http4s','ver':'0.23','slug':'25-http4s','lang':'scala','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 26 Clojure
{'num':92,'cat':'26 Clojure','name':'Ring','ver':'1.12','slug':'26-ring','lang':'clojure','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':93,'cat':'26 Clojure','name':'Pedestal','ver':'0.7','slug':'26-pedestal','lang':'clojure','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 27 C/C++
{'num':94,'cat':'27 C/C++','name':'Drogon','ver':'1.9.13','slug':'27-drogon','lang':'cpp','pattern':'multi-stage','runtime':'debian:12-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':95,'cat':'27 C/C++','name':'Crow','ver':'1.3.2','slug':'27-crow','lang':'cpp','pattern':'multi-stage','runtime':'debian:12-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
]

# ─── LANGUAGE PROFILES ──────────────────────────────────────────────────

LANG = {

'nodejs-node': {
    'setup': """      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'""",
    'sca': "npm audit --audit-level=high\n          # alternatives: yarn audit --level high | pnpm audit --audit-level high | osv-scanner --lockfile package-lock.json",
    'sast': "semgrep --config=auto .\n          # alternatives: njsscan --json . > njsscan.json | eslint . --plugin security",
    'codeql_lang': 'javascript-typescript',
    'license': "npx license-checker --production --failOn 'GPL;AGPL'",
    'build': "npm ci && npm run build\n          # alternatives: yarn install --frozen-lockfile && yarn build | pnpm install --frozen-lockfile && pnpm build",
    'test': "npm test -- --coverage --coverageReporters=lcov",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json\n          # alternatives: cyclonedx-npm --output sbom.cdx.json",
},

'nodejs-nginx': {
    'setup': """      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'""",
    'sca': "npm audit --audit-level=high\n          # alternatives: yarn audit --level high | pnpm audit --audit-level high | osv-scanner --lockfile package-lock.json",
    'sast': "semgrep --config=auto .\n          # alternatives: njsscan --json . > njsscan.json | eslint . --plugin security",
    'codeql_lang': 'javascript-typescript',
    'license': "npx license-checker --production --failOn 'GPL;AGPL'",
    'build': "npm ci && npm run build\n          # alternatives: yarn install --frozen-lockfile && yarn build | pnpm install --frozen-lockfile && pnpm build",
    'test': "npm test -- --coverage --coverageReporters=lcov",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'hugo': {
    'setup': """      - uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.161.0'
          extended: true""",
    'sca': "osv-scanner --lockfile go.sum\n          # alternatives: nancy (go list -json -m all | nancy sleuth)",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'go',
    'license': "go-licenses check ./...",
    'build': "hugo --minify",
    'test': "hugo --minify && echo 'Build clean'",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'deno': {
    'setup': """      - uses: denoland/setup-deno@v2
        with:
          deno-version: '2.3'""",
    'sca': "deno audit\n          # alternatives: osv-scanner --lockfile deno.lock",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'javascript-typescript',
    'license': "deno run --allow-read jsr:@nicolo-ribaudo/deno-license-checker",
    'build': "deno task build",
    'test': "deno test --coverage=cov/ && deno coverage cov/ --lcov > cov.lcov",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'bun': {
    'setup': """      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: '1'""",
    'sca': "bun pm audit\n          # alternatives: osv-scanner --lockfile bun.lockb",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'javascript-typescript',
    'license': "bunx license-checker --production --failOn 'GPL;AGPL'",
    'build': "bun install --frozen-lockfile && bun build",
    'test': "bun test --coverage",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'python': {
    'setup': """      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'""",
    'sca': "pip-audit --vulnerability-service pypi\n          # alternatives: safety check --json | osv-scanner --lockfile requirements.txt | snyk test",
    'sast': "bandit -r . -ll -o bandit.json -f json && cat bandit.json\n          # alternatives: semgrep --config=auto . | CodeQL",
    'codeql_lang': 'python',
    'license': "pip-licenses --format=json --output-file=licenses.json && cat licenses.json",
    'build': "pip install -r requirements.txt\n          # alternatives: poetry install --no-dev | uv pip install -r requirements.txt",
    'test': "pytest --cov=. --cov-report=xml",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json\n          # alternatives: cyclonedx-py -o sbom.cdx.json",
},

'go': {
    'setup': """      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true""",
    'sca': "govulncheck ./...\n          # alternatives: nancy (go list -json -m all | nancy sleuth) | osv-scanner --lockfile go.sum",
    'sast': "gosec -fmt json -out gosec.json ./... && cat gosec.json\n          # alternatives: staticcheck ./... | semgrep --config=auto .",
    'codeql_lang': 'go',
    'license': "go-licenses check ./...",
    'build': "CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app ./...",
    'test': "go test ./... -coverprofile=coverage.out",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json\n          # alternatives: cyclonedx-gomod app -output sbom.cdx.json",
},

'java': {
    'setup': """      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'""",
    'sca': "mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7\n          # alternatives: osv-scanner --lockfile pom.xml | snyk test",
    'sast': "semgrep --config=auto .\n          # alternatives: mvn spotbugs:check | CodeQL",
    'codeql_lang': 'java',
    'license': "mvn license:check\n          # alternatives: ./gradlew checkLicense",
    'build': "mvn -B package --file pom.xml -DskipTests\n          # alternatives: ./gradlew build -x test",
    'test': "mvn test\n          # alternatives: ./gradlew test",
    'sbom': "mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom && syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'kotlin': {
    'setup': """      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'gradle'""",
    'sca': "dependency-check --scan . --format JSON\n          # alternatives: osv-scanner --lockfile gradle.lockfile | snyk test",
    'sast': "./gradlew detekt\n          # alternatives: semgrep --config=auto . | CodeQL",
    'codeql_lang': 'java-kotlin',
    'license': "./gradlew checkLicense",
    'build': "./gradlew build -x test",
    'test': "./gradlew test",
    'sbom': "./gradlew cyclonedxBom && syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'dotnet': {
    'setup': """      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0'""",
    'sca': "dotnet list package --vulnerable --include-transitive\n          # alternatives: osv-scanner --lockfile packages.lock.json | snyk test",
    'sast': "semgrep --config=auto .\n          # alternatives: security-code-scan | CodeQL (csharp)",
    'codeql_lang': 'csharp',
    'license': "dotnet-project-licenses --input . --output licenses.json",
    'build': "dotnet publish -c Release -o out --self-contained false",
    'test': "dotnet test --collect:\"XPlat Code Coverage\"",
    'sbom': "cyclonedx . --output sbom.cdx.json && syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'rust': {
    'setup': """      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2""",
    'sca': "cargo audit\n          # alternatives: cargo deny check | osv-scanner --lockfile Cargo.lock",
    'sast': "cargo clippy -- -D warnings\n          # alternatives: semgrep --config=auto . | CodeQL (rust)",
    'codeql_lang': 'rust',
    'license': "cargo license --json",
    'build': "cargo build --release --target x86_64-unknown-linux-musl",
    'test': "cargo test --workspace",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json\n          # alternatives: cargo cyclonedx --format json",
},

'elixir': {
    'setup': """      - uses: erlef/setup-beam@v1
        with:
          elixir-version: '1.17'
          otp-version: '27'""",
    'sca': "mix deps.audit\n          # alternatives: mix hex.audit | osv-scanner --lockfile mix.lock",
    'sast': "mix sobelow --config\n          # alternatives: mix credo --strict | semgrep --config=auto .",
    'codeql_lang': 'python',  # no Elixir CodeQL support
    'license': "mix licenses",
    'build': "MIX_ENV=prod mix do deps.get, release",
    'test': "mix test --cover",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'ruby': {
    'setup': """      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true""",
    'sca': "bundle exec bundle-audit check --update\n          # alternatives: osv-scanner --lockfile Gemfile.lock | snyk test",
    'sast': "bundle exec brakeman -o brakeman.json\n          # alternatives: semgrep --config=auto . | CodeQL (ruby)",
    'codeql_lang': 'ruby',
    'license': "bundle exec license_finder",
    'build': "bundle install --without development test",
    'test': "bundle exec rspec --format documentation",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'php': {
    'setup': """      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
          tools: composer:v2""",
    'sca': "composer audit\n          # alternatives: local-php-security-checker | osv-scanner --lockfile composer.lock",
    'sast': "vendor/bin/psalm --output-format=json\n          # alternatives: vendor/bin/phpstan analyse --level max | semgrep --config=auto .",
    'codeql_lang': 'python',  # no PHP CodeQL support
    'license': "vendor/bin/composer-license-checker check",
    'build': "composer install --no-dev --optimize-autoloader",
    'test': "vendor/bin/phpunit --coverage-clover coverage.xml",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'swift-server': {
    'setup': """      - uses: swift-actions/setup-swift@v2
        with:
          swift-version: '6.0'""",
    'sca': "osv-scanner --lockfile Package.resolved\n          # alternatives: snyk test",
    'sast': "semgrep --config=auto .\n          # alternatives: CodeQL (swift)",
    'codeql_lang': 'swift',
    'license': "swift package-list --output-format json",
    'build': "swift build -c release",
    'test': "swift test --enable-code-coverage",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'scala': {
    'setup': """      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'sbt'""",
    'sca': "sbt dependencyCheck\n          # alternatives: osv-scanner --lockfile build.sbt | snyk test",
    'sast': "semgrep --config=auto .\n          # alternatives: scalafmt --check | CodeQL (java)",
    'codeql_lang': 'java',
    'license': "sbt dumpLicenseReport",
    'build': "sbt assembly\n          # alternatives: sbt dist (for Play Framework)",
    'test': "sbt test",
    'sbom': "sbt cyclonedxBom && syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'clojure': {
    'setup': """      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - uses: DeLaGuardo/setup-clojure@13
        with:
          lein: '2.11'""",
    'sca': "clojure -M:nvd check\n          # alternatives: osv-scanner --lockfile deps.edn | snyk test",
    'sast': "clj-kondo --lint src\n          # alternatives: semgrep --config=auto . | CodeQL (java)",
    'codeql_lang': 'java',
    'license': "lein licenses",
    'build': "lein uberjar\n          # alternatives: clojure -T:build uber",
    'test': "lein test",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

'cpp': {
    'setup': """      - name: Install build tools
        run: sudo apt-get install -y cmake clang clang-tidy cppcheck""",
    'sca': "osv-scanner --lockfile conan.lock\n          # alternatives: vcpkg audit | snyk test",
    'sast': "cppcheck --enable=all --xml . 2> cppcheck.xml && cat cppcheck.xml\n          # alternatives: clang-tidy -p build src/**/*.cpp | semgrep --config=auto .",
    'codeql_lang': 'cpp',
    'license': "licensecheck -r .",
    'build': "cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build",
    'test': "cd build && ctest --output-on-failure",
    'sbom': "syft packages $REGISTRY/$IMAGE_NAME:${{ github.sha }} -o spdx-json > sbom.spdx.json",
},

# ─── CI-only language groups ─────────────────────────────────────────────

'mobile-js': {
    'setup': """      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'""",
    'sca': "npm audit --audit-level=high",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'javascript-typescript',
    'license': "npx license-checker --production --failOn 'GPL;AGPL'",
    'build': "npx react-native build-android\n          # alternatives: eas build --profile preview --platform android | ionic build --prod",
    'test': "npm test -- --coverage",
    'artifact': 'APK / IPA',
},

'flutter': {
    'setup': """      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.44.0'""",
    'sca': "osv-scanner --lockfile pubspec.lock",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'java-kotlin',
    'license': "dart pub deps --json | python3 scripts/extract-licenses.py",
    'build': "flutter build apk --release\n          # alternatives: flutter build ios --release | flutter build appbundle",
    'test': "flutter test --coverage",
    'artifact': 'APK / IPA',
},

'dotnet-mobile': {
    'setup': """      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0'""",
    'sca': "dotnet list package --vulnerable --include-transitive",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'csharp',
    'license': "dotnet-project-licenses --input . --output licenses.json",
    'build': "dotnet build -c Release\n          # targets: -f net10.0-android | -f net10.0-ios | -f net10.0-maccatalyst",
    'test': "dotnet test --collect:\"XPlat Code Coverage\"",
    'artifact': 'APK / IPA / MSIX',
},

'ios-native': {
    'setup': """      - uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: 'latest-stable'""",
    'sca': "osv-scanner --lockfile Package.resolved",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'swift',
    'license': "swift package-list --output-format json",
    'build': "xcodebuild -scheme MyApp -configuration Release archive -archivePath MyApp.xcarchive",
    'test': "xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16'",
    'artifact': 'IPA',
},

'android-native': {
    'setup': """      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: 'gradle'""",
    'sca': "dependency-check --scan . --format JSON",
    'sast': "./gradlew detekt\n          # alternatives: semgrep --config=auto . | CodeQL (java-kotlin)",
    'codeql_lang': 'java-kotlin',
    'license': "./gradlew checkLicense",
    'build': "./gradlew assembleRelease\n          # alternatives: ./gradlew bundleRelease (for AAB)",
    'test': "./gradlew test",
    'artifact': 'APK / AAB',
},

'edge': {
    'setup': """      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'""",
    'sca': "npm audit --audit-level=high",
    'sast': "semgrep --config=auto .",
    'codeql_lang': 'javascript-typescript',
    'license': "npx license-checker --production --failOn 'GPL;AGPL'",
    'build': "npm run build\n          # alternatives: wrangler build | vercel build",
    'test': "npm test -- --coverage",
    'artifact': 'edge bundle',
},

}

# ─── WORKFLOW GENERATORS ─────────────────────────────────────────────────

def workflow_multistage(fw):
    lang = LANG[fw['lang']]
    name = fw['name']
    ver = fw['ver']
    cat = fw['cat']
    port = fw['port'] or 8080
    runtime = fw['runtime']
    fips_rt = fw['fips_rt']
    has_fips = fips_rt not in ('N/A', '')
    fips_block = f"""

      - name: Build and push — FIPS image
        run: |
          docker buildx build --platform linux/amd64 \\
            --push --target runtime-fips \\
            -t $REGISTRY/$IMAGE_NAME:${{{{ github.sha }}}}-fips \\
            .
          # FIPS runtime: {fips_rt}""" if has_fips else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Pipeline: {cat} — {name} {ver}
# Pattern:  Multi-stage Docker (build image: ubuntu:24.04, runtime: {runtime})
# Copy to:  .github/workflows/ci.yml in your {name} project repo
#
# Requirements: Dockerfile with --target runtime (and optionally --target runtime-fips)
# Secrets needed: none for GHCR  |  AWS_ACCOUNT_ID for ECR  |  see Registry section
# ─────────────────────────────────────────────────────────────────────────

name: CI — {name} {ver}

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  id-token: write        # OIDC — keyless cosign signing + registry auth
  packages: write        # GHCR push
  security-events: write # CodeQL / Trivy SARIF upload

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{{{ github.repository }}}}

jobs:

  # ── Phase 1 — pre-commit (every push / PR) ─────────────────────────────
  pre-commit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - uses: pre-commit/action@v3.0.1

  # ── Phase 2 — security gates (parallel, on every PR push) ──────────────
  sca:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: SCA — dependency audit
        run: |
          {lang['sca']}

  sast:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: auto
        # alternatives: see issue template for language-specific SAST tools

  codeql:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: {lang['codeql_lang']}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3

  license-scan:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: License check
        run: |
          {lang['license']}

  iac-scan:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
      - uses: bridgecrewio/checkov-action@v12
        with:
          directory: .
          soft_fail: true   # set to false on main-branch job
        # alternatives: KICS | trivy config .

  secrets-scan:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
        # alternatives: trufflehog | GitGuardian ggshield

  # ── PR build + container scan (PR only, no push to registry) ───────────
  build-pr:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    needs: [sca, sast, codeql, license-scan, iac-scan, secrets-scan]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build image (no push)
        run: |
          docker build --platform linux/amd64 \\
            --target runtime \\
            -t $REGISTRY/$IMAGE_NAME:pr-${{{{ github.sha }}}} \\
            --load .

      - name: SBOM — PR stage
        uses: anchore/syft-action@v1
        with:
          image: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:pr-${{{{ github.sha }}}}
          output-file: sbom-pr.spdx.json

      - name: Container scan — Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:pr-${{{{ github.sha }}}}
          format: sarif
          output: trivy-results.sarif
          exit-code: '1'
          severity: HIGH,CRITICAL
        # alternatives: grype | snyk container test | docker scout cves

      - name: Upload Trivy SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif

  # ── Phase 3 — main build: sign, SBOM, SLSA, test, DAST (main only) ────
  build-push-sign:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    needs: [sca, sast, codeql, license-scan, iac-scan, secrets-scan]
    outputs:
      image-digest: ${{{{ steps.push.outputs.digest }}}}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{{{ env.REGISTRY }}}}
          username: ${{{{ github.actor }}}}
          password: ${{{{ secrets.GITHUB_TOKEN }}}}
        # For ECR: use aws-actions/amazon-ecr-login with OIDC (no stored credentials)
        # For GCP AR: use google-github-actions/auth + docker/login-action
        # For ACR: use azure/login + docker/login-action

{lang['setup']}

      - name: App build
        run: |
          {lang['build']}

      - name: Build and push — standard image
        id: push
        run: |
          docker buildx build --platform linux/amd64 \\
            --push --target runtime \\
            -t $REGISTRY/$IMAGE_NAME:${{{{ github.sha }}}} \\
            -t $REGISTRY/$IMAGE_NAME:latest \\
            .
{fips_block}

      - name: Container scan — registry image (post-push)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:${{{{ github.sha }}}}
          exit-code: '1'
          severity: HIGH,CRITICAL

      - name: Install cosign
        uses: sigstore/cosign-installer@v3

      - name: Sign image (keyless OIDC)
        run: |
          cosign sign --yes \\
            $REGISTRY/$IMAGE_NAME@${{{{ steps.push.outputs.digest }}}}

      - name: Generate SBOM + attest
        uses: anchore/syft-action@v1
        with:
          image: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:${{{{ github.sha }}}}
          output-file: sbom.spdx.json
      - run: |
          cosign attest --yes \\
            --predicate sbom.spdx.json \\
            $REGISTRY/$IMAGE_NAME@${{{{ steps.push.outputs.digest }}}}

  slsa-provenance:
    needs: build-push-sign
    if: github.ref == 'refs/heads/main'
    permissions:
      actions: read
      id-token: write
      packages: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2
    with:
      image: ghcr.io/${{{{ github.repository }}}}
      digest: ${{{{ needs.build-push-sign.outputs.image-digest }}}}
    secrets:
      registry-username: ${{{{ github.actor }}}}
      registry-password: ${{{{ secrets.GITHUB_TOKEN }}}}

  test:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          {lang['test']}
      - uses: codecov/codecov-action@v4
        with:
          token: ${{{{ secrets.CODECOV_TOKEN }}}}

  release:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    needs: [build-push-sign, test]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Semantic release
        uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}

  notify:
    if: always() && github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    needs: [build-push-sign, test, release]
    steps:
      - uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {{
              "text": "Pipeline ${{{{ job.status }}}}: {name} {ver} — ${{{{ github.sha }}}}"
            }}
        env:
          SLACK_WEBHOOK_URL: ${{{{ secrets.SLACK_WEBHOOK_URL }}}}

# ── Registry reference ────────────────────────────────────────────────────
# GHCR (default above): uses GITHUB_TOKEN — no extra secrets needed
#
# AWS ECR:
#   - uses: aws-actions/configure-aws-credentials@v4
#     with: role-to-assume: arn:aws:iam::ACCOUNT:role/GitHubActions
#   - uses: aws-actions/amazon-ecr-login@v2
#
# GCP Artifact Registry:
#   - uses: google-github-actions/auth@v2
#     with: workload_identity_provider: projects/PROJECT/locations/global/workloadIdentityPools/...
#   - uses: docker/login-action@v3
#     with: registry: REGION-docker.pkg.dev
#
# Azure ACR:
#   - uses: azure/login@v2
#     with: client-id / tenant-id / subscription-id (OIDC)
#   - uses: docker/login-action@v3
#     with: registry: myregistry.azurecr.io
#
# Red Hat Quay: registry: quay.io — username/password via secrets
# Docker Hub:   registry: docker.io — username/password via secrets

# ── Compliance delta reference ─────────────────────────────────────────────
# FIPS:       use --target runtime-fips; push :$SHA-fips tag (block above)
# PCI DSS:    trivy --severity CRITICAL --exit-code 1 (already set above)
# HIPAA:      add PHI scan step: semgrep --config p/hipaa .
# FedRAMP:    FIPS build required + SLSA Level 3 (both wired above)
# CMMC:       named reviewers in CODEOWNERS; artifact retention in Actions settings
# SOC 2:      upload-artifact for all scan results; retention-days: 90
# SOX:        require 2+ approvers in branch protection; ticket ID in commit message
# GDPR:       semgrep --config p/pii . — add as parallel job
# PIPEDA:     semgrep --config p/pii . — ca-central-1 registry region
# NERC CIP:   vendor all deps; block outbound in build via network policy
# ISO 27001:  retention-days: 1825 (5 years) on all artifact uploads
"""

def workflow_cionly(fw):
    lang = LANG[fw['lang']]
    name = fw['name']
    ver = fw['ver']
    cat = fw['cat']
    artifact = lang.get('artifact', 'artifact')

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Pipeline: {cat} — {name} {ver}
# Pattern:  CI-only (no Docker — output is {artifact})
# Copy to:  .github/workflows/ci.yml in your {name} project repo
#
# No Dockerfile required. Output artifact uploaded to GitHub Releases.
# ─────────────────────────────────────────────────────────────────────────

name: CI — {name} {ver}

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write        # create releases
  id-token: write        # OIDC
  security-events: write # CodeQL / SARIF upload

jobs:

  # ── Phase 1 — pre-commit ───────────────────────────────────────────────
  pre-commit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - uses: pre-commit/action@v3.0.1

  # ── Phase 2 — security gates (parallel) ───────────────────────────────
  sca:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: SCA — dependency audit
        run: |
          {lang['sca']}

  sast:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: auto

  codeql:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: {lang['codeql_lang']}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3

  secrets-scan:
    runs-on: ubuntu-24.04
    needs: pre-commit
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}

  # ── Phase 3 — build artifact + release (main only) ────────────────────
  build:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    needs: [sca, sast, codeql, secrets-scan]
    steps:
      - uses: actions/checkout@v4

{lang['setup']}

      - name: Build — {artifact}
        run: |
          {lang['build']}

      - name: Run tests
        run: |
          {lang['test']}

      - uses: codecov/codecov-action@v4
        with:
          token: ${{{{ secrets.CODECOV_TOKEN }}}}

      - name: Semantic release
        uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}

      - name: Notify
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {{
              "text": "Build ${{{{ job.status }}}}: {name} {ver} — ${{{{ github.sha }}}}"
            }}
        env:
          SLACK_WEBHOOK_URL: ${{{{ secrets.SLACK_WEBHOOK_URL }}}}

# ── Compliance delta reference ─────────────────────────────────────────────
# PCI DSS:  govulncheck / pip-audit with --exit-code 1 on CRITICAL
# HIPAA:    semgrep --config p/hipaa . — add as parallel job
# CMMC:     named reviewers in CODEOWNERS; artifact retention 3 years
# SOC 2:    upload-artifact for all scan results; retention-days: 90
# SOX:      require 2+ approvers in branch protection
# GDPR:     semgrep --config p/pii . — add as parallel job
"""

def build_workflow(fw):
    if fw['pattern'] == 'ci-only':
        return workflow_cionly(fw)
    else:
        return workflow_multistage(fw)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    out_dir = os.path.join(repo_root, 'workflow-templates')
    os.makedirs(out_dir, exist_ok=True)

    count = 0
    for fw in FRAMEWORKS:
        content = build_workflow(fw)
        filename = f"{fw['slug']}.yml"
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        count += 1

    print(f"Generated {count} workflow templates → {out_dir}")

if __name__ == '__main__':
    main()
