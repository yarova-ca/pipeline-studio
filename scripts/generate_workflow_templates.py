#!/usr/bin/env python3
"""
Generate pipeline-studio workflow templates — Option A structure.

Output: workflow-templates/{slug}/ folder per framework.
  Multi-stage (62): 7 YAML files per folder.
  CI-only (13):     5 YAML files per folder.

Usage: python3 scripts/generate_workflow_templates.py
"""

import os, shutil

OUT = "workflow-templates"

# ─── FRAMEWORKS ──────────────────────────────────────────────────────────────
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

# ─── LANGUAGE PROFILES ───────────────────────────────────────────────────────

LANG = {
'nodejs-node': {'setup': "      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n          cache: 'npm'", 'sca_cmd': 'npm audit --audit-level=high', 'sca_name': 'npm audit', 'sast_cmd': None, 'codeql_lang': 'javascript-typescript', 'license_cmd': "npx license-checker --production --failOn 'GPL;AGPL'", 'build_cmd': 'npm ci && npm run build', 'test_cmd': 'npm test -- --coverage --coverageReporters=lcov', 'eco': 'nodejs'},
'nodejs-nginx': {'setup': "      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n          cache: 'npm'", 'sca_cmd': 'npm audit --audit-level=high', 'sca_name': 'npm audit', 'sast_cmd': None, 'codeql_lang': 'javascript-typescript', 'license_cmd': "npx license-checker --production --failOn 'GPL;AGPL'", 'build_cmd': 'npm ci && npm run build', 'test_cmd': 'npm test -- --coverage --coverageReporters=lcov', 'eco': 'nodejs'},
'hugo': {'setup': "      - uses: peaceiris/actions-hugo@v3\n        with:\n          hugo-version: '0.161.0'\n          extended: true", 'sca_cmd': 'osv-scanner --lockfile go.sum', 'sca_name': 'osv-scanner', 'sast_cmd': None, 'codeql_lang': 'go', 'license_cmd': 'go-licenses check ./...', 'build_cmd': 'hugo --minify', 'test_cmd': "hugo --minify && echo 'Build clean'", 'eco': 'go'},
'deno': {'setup': "      - uses: denoland/setup-deno@v2\n        with:\n          deno-version: '2.3'", 'sca_cmd': 'deno audit', 'sca_name': 'deno audit', 'sast_cmd': None, 'codeql_lang': 'javascript-typescript', 'license_cmd': 'deno run --allow-read jsr:@nicolo-ribaudo/deno-license-checker', 'build_cmd': 'deno task build', 'test_cmd': 'deno test --coverage=cov/ && deno coverage cov/ --lcov > cov.lcov', 'eco': 'deno'},
'bun': {'setup': "      - uses: oven-sh/setup-bun@v2\n        with:\n          bun-version: '1'", 'sca_cmd': 'bun pm audit', 'sca_name': 'bun pm audit', 'sast_cmd': None, 'codeql_lang': 'javascript-typescript', 'license_cmd': "bunx license-checker --production --failOn 'GPL;AGPL'", 'build_cmd': 'bun install --frozen-lockfile && bun build', 'test_cmd': 'bun test --coverage', 'eco': 'bun'},
'python': {'setup': "      - uses: actions/setup-python@v5\n        with:\n          python-version: '3.12'\n          cache: 'pip'", 'sca_cmd': 'pip-audit --vulnerability-service pypi', 'sca_name': 'pip-audit', 'sast_cmd': 'bandit -r . -ll -o bandit.json -f json', 'sast_name': 'Bandit', 'codeql_lang': 'python', 'license_cmd': 'pip-licenses --format=json --output-file=licenses.json', 'build_cmd': 'pip install -r requirements.txt', 'test_cmd': 'pytest --cov=. --cov-report=xml', 'eco': 'python'},
'go': {'setup': "      - uses: actions/setup-go@v5\n        with:\n          go-version: '1.23'\n          cache: true", 'sca_cmd': 'govulncheck ./...', 'sca_name': 'govulncheck', 'sast_cmd': 'gosec -fmt json -out gosec.json ./...', 'sast_name': 'gosec', 'codeql_lang': 'go', 'license_cmd': 'go-licenses check ./...', 'build_cmd': 'CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app ./...', 'test_cmd': 'go test ./... -coverprofile=coverage.out', 'eco': 'go'},
'java': {'setup': "      - uses: actions/setup-java@v4\n        with:\n          java-version: '21'\n          distribution: 'temurin'\n          cache: 'maven'", 'sca_cmd': 'mvn org.owasp:dependency-check-maven:check -DfailBuildOnCVSS=7', 'sca_name': 'OWASP Dependency-Check', 'sast_cmd': None, 'codeql_lang': 'java', 'license_cmd': 'mvn license:check', 'build_cmd': 'mvn -B package --file pom.xml -DskipTests', 'test_cmd': 'mvn test', 'eco': 'java'},
'kotlin': {'setup': "      - uses: actions/setup-java@v4\n        with:\n          java-version: '21'\n          distribution: 'temurin'\n          cache: 'gradle'", 'sca_cmd': 'dependency-check --scan . --format JSON', 'sca_name': 'OWASP Dependency-Check', 'sast_cmd': './gradlew detekt', 'sast_name': 'Detekt', 'codeql_lang': 'java-kotlin', 'license_cmd': './gradlew checkLicense', 'build_cmd': './gradlew build -x test', 'test_cmd': './gradlew test', 'eco': 'kotlin'},
'dotnet': {'setup': "      - uses: actions/setup-dotnet@v4\n        with:\n          dotnet-version: '9.0'", 'sca_cmd': 'dotnet list package --vulnerable --include-transitive', 'sca_name': 'dotnet vulnerable packages', 'sast_cmd': None, 'codeql_lang': 'csharp', 'license_cmd': 'dotnet-project-licenses --input . --output licenses.json', 'build_cmd': 'dotnet publish -c Release -o out --self-contained false', 'test_cmd': 'dotnet test --collect:"XPlat Code Coverage"', 'eco': 'dotnet'},
'rust': {'setup': "      - uses: dtolnay/rust-toolchain@stable\n      - uses: Swatinem/rust-cache@v2", 'sca_cmd': 'cargo audit', 'sca_name': 'cargo audit', 'sast_cmd': 'cargo clippy -- -D warnings', 'sast_name': 'Clippy', 'codeql_lang': 'rust', 'license_cmd': 'cargo license --json', 'build_cmd': 'cargo build --release --target x86_64-unknown-linux-musl', 'test_cmd': 'cargo test --workspace', 'eco': 'rust'},
'elixir': {'setup': "      - uses: erlef/setup-beam@v1\n        with:\n          elixir-version: '1.17'\n          otp-version: '27'", 'sca_cmd': 'mix deps.audit', 'sca_name': 'mix deps.audit', 'sast_cmd': 'mix sobelow --config', 'sast_name': 'Sobelow', 'codeql_lang': 'python', 'license_cmd': 'mix licenses', 'build_cmd': 'MIX_ENV=prod mix do deps.get, release', 'test_cmd': 'mix test --cover', 'eco': 'elixir'},
'ruby': {'setup': "      - uses: ruby/setup-ruby@v1\n        with:\n          ruby-version: '3.3'\n          bundler-cache: true", 'sca_cmd': 'bundle exec bundle-audit check --update', 'sca_name': 'bundler-audit', 'sast_cmd': 'bundle exec brakeman -o brakeman.json', 'sast_name': 'Brakeman', 'codeql_lang': 'ruby', 'license_cmd': 'bundle exec license_finder', 'build_cmd': 'bundle install --without development test', 'test_cmd': 'bundle exec rspec --format documentation', 'eco': 'ruby'},
'php': {'setup': "      - uses: shivammathur/setup-php@v2\n        with:\n          php-version: '8.3'\n          tools: composer:v2", 'sca_cmd': 'composer audit', 'sca_name': 'composer audit', 'sast_cmd': 'vendor/bin/psalm --output-format=json', 'sast_name': 'Psalm', 'codeql_lang': 'python', 'license_cmd': 'vendor/bin/composer-license-checker check', 'build_cmd': 'composer install --no-dev --optimize-autoloader', 'test_cmd': 'vendor/bin/phpunit --coverage-clover coverage.xml', 'eco': 'php'},
'swift-server': {'setup': "      - uses: swift-actions/setup-swift@v2\n        with:\n          swift-version: '6.0'", 'sca_cmd': 'osv-scanner --lockfile Package.resolved', 'sca_name': 'osv-scanner', 'sast_cmd': None, 'codeql_lang': 'swift', 'license_cmd': 'swift package-list --output-format json', 'build_cmd': 'swift build -c release', 'test_cmd': 'swift test --enable-code-coverage', 'eco': 'swift'},
'scala': {'setup': "      - uses: actions/setup-java@v4\n        with:\n          java-version: '21'\n          distribution: 'temurin'\n          cache: 'sbt'", 'sca_cmd': 'sbt dependencyCheck', 'sca_name': 'sbt dependencyCheck', 'sast_cmd': None, 'codeql_lang': 'java', 'license_cmd': 'sbt dumpLicenseReport', 'build_cmd': 'sbt assembly', 'test_cmd': 'sbt test', 'eco': 'scala'},
'clojure': {'setup': "      - uses: actions/setup-java@v4\n        with:\n          java-version: '21'\n          distribution: 'temurin'\n      - uses: DeLaGuardo/setup-clojure@13\n        with:\n          lein: '2.11'", 'sca_cmd': 'clojure -M:nvd check', 'sca_name': 'nvd-clojure', 'sast_cmd': 'clj-kondo --lint src', 'sast_name': 'clj-kondo', 'codeql_lang': 'java', 'license_cmd': 'lein licenses', 'build_cmd': 'lein uberjar', 'test_cmd': 'lein test', 'eco': 'clojure'},
'cpp': {'setup': "      - name: Install build tools\n        run: sudo apt-get install -y cmake clang clang-tidy cppcheck", 'sca_cmd': 'osv-scanner --lockfile conan.lock', 'sca_name': 'osv-scanner', 'sast_cmd': 'cppcheck --enable=all --xml . 2> cppcheck.xml', 'sast_name': 'cppcheck', 'codeql_lang': 'cpp', 'license_cmd': 'licensecheck -r .', 'build_cmd': 'cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build', 'test_cmd': 'cd build && ctest --output-on-failure', 'eco': 'cpp'},
'mobile-js': {'setup': "      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n          cache: 'npm'", 'sca_cmd': 'npm audit --audit-level=high', 'sca_name': 'npm audit', 'sast_cmd': None, 'codeql_lang': 'javascript-typescript', 'license_cmd': "npx license-checker --production --failOn 'GPL;AGPL'", 'build_cmd': 'npx react-native build-android', 'test_cmd': 'npm test -- --coverage', 'artifact': 'APK / IPA', 'eco': 'nodejs'},
'flutter': {'setup': "      - uses: subosito/flutter-action@v2\n        with:\n          flutter-version: '3.44.0'", 'sca_cmd': 'osv-scanner --lockfile pubspec.lock', 'sca_name': 'osv-scanner', 'sast_cmd': None, 'codeql_lang': 'java-kotlin', 'license_cmd': 'dart pub deps --json | python3 scripts/extract-licenses.py', 'build_cmd': 'flutter build apk --release', 'test_cmd': 'flutter test --coverage', 'artifact': 'APK / IPA', 'eco': 'dart'},
'dotnet-mobile': {'setup': "      - uses: actions/setup-dotnet@v4\n        with:\n          dotnet-version: '10.0'", 'sca_cmd': 'dotnet list package --vulnerable --include-transitive', 'sca_name': 'dotnet vulnerable', 'sast_cmd': None, 'codeql_lang': 'csharp', 'license_cmd': 'dotnet-project-licenses --input . --output licenses.json', 'build_cmd': 'dotnet build -c Release', 'test_cmd': 'dotnet test --collect:"XPlat Code Coverage"', 'artifact': 'APK / IPA / MSIX', 'eco': 'dotnet'},
'ios-native': {'setup': "      - uses: maxim-lobanov/setup-xcode@v1\n        with:\n          xcode-version: 'latest-stable'", 'sca_cmd': 'osv-scanner --lockfile Package.resolved', 'sca_name': 'osv-scanner', 'sast_cmd': None, 'codeql_lang': 'swift', 'license_cmd': 'swift package-list --output-format json', 'build_cmd': "xcodebuild -scheme MyApp -configuration Release archive -archivePath MyApp.xcarchive", 'test_cmd': "xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16'", 'artifact': 'IPA', 'eco': 'swift'},
'android-native': {'setup': "      - uses: actions/setup-java@v4\n        with:\n          java-version: '17'\n          distribution: 'temurin'\n          cache: 'gradle'", 'sca_cmd': 'dependency-check --scan . --format JSON', 'sca_name': 'OWASP Dependency-Check', 'sast_cmd': './gradlew detekt', 'sast_name': 'Detekt', 'codeql_lang': 'java-kotlin', 'license_cmd': './gradlew checkLicense', 'build_cmd': './gradlew assembleRelease', 'test_cmd': './gradlew test', 'artifact': 'APK / AAB', 'eco': 'kotlin'},
'edge': {'setup': "      - uses: actions/setup-node@v4\n        with:\n          node-version: '22'\n          cache: 'npm'", 'sca_cmd': 'npm audit --audit-level=high', 'sca_name': 'npm audit', 'sast_cmd': None, 'codeql_lang': 'javascript-typescript', 'license_cmd': "npx license-checker --production --failOn 'GPL;AGPL'", 'build_cmd': 'npm run build', 'test_cmd': 'npm test -- --coverage', 'artifact': 'edge bundle', 'eco': 'nodejs'},
}

# ─── SCA ALTERNATIVES per ecosystem ─────────────────────────────────────────

SCA_ALTS = {
'nodejs': """      #
      # ── ALTERNATIVE: yarn audit ──────────────────────────────────
      # - name: SCA — yarn audit
      #   run: yarn audit --level high
      #
      # ── ALTERNATIVE: pnpm audit ──────────────────────────────────
      # - name: SCA — pnpm audit
      #   run: pnpm audit --audit-level high
      #
      # ── ALTERNATIVE: osv-scanner ─────────────────────────────────
      # - name: SCA — osv-scanner
      #   uses: google/osv-scanner-action@v1
      #   with:
      #     scan-args: --lockfile=package-lock.json
      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk
      #   uses: snyk/actions/node@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'python': """      #
      # ── ALTERNATIVE: safety ──────────────────────────────────────
      # - name: SCA — safety
      #   run: pip install safety && safety check -r requirements.txt --json
      #
      # ── ALTERNATIVE: osv-scanner ─────────────────────────────────
      # - name: SCA — osv-scanner
      #   uses: google/osv-scanner-action@v1
      #   with:
      #     scan-args: --lockfile=requirements.txt
      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk
      #   uses: snyk/actions/python@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'go': """      #
      # ── ALTERNATIVE: nancy ───────────────────────────────────────
      # - name: SCA — nancy
      #   run: go list -json -m all | docker run --rm -i sonatypecommunity/nancy:latest sleuth
      #
      # ── ALTERNATIVE: osv-scanner ─────────────────────────────────
      # - name: SCA — osv-scanner
      #   uses: google/osv-scanner-action@v1
      #   with:
      #     scan-args: --lockfile=go.sum""",
'java': """      #
      # ── ALTERNATIVE: Gradle OWASP ────────────────────────────────
      # - name: SCA — Gradle dependencyCheckAnalyze
      #   run: ./gradlew dependencyCheckAnalyze
      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk Maven
      #   uses: snyk/actions/maven@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'kotlin': """      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk Gradle
      #   uses: snyk/actions/gradle@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'dotnet': """      #
      # ── ALTERNATIVE: OWASP Dependency-Check ──────────────────────
      # - name: SCA — OWASP Dependency-Check
      #   uses: dependency-check/Dependency-Check_Action@main
      #   with:
      #     project: 'my-project'
      #     path: '.'
      #     format: 'JSON'
      #     args: '--failOnCVSS 7'
      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk .NET
      #   uses: snyk/actions/dotnet@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'rust': """      #
      # ── ALTERNATIVE: cargo deny ──────────────────────────────────
      # - name: SCA — cargo deny
      #   uses: EmbarkStudios/cargo-deny-action@v1
      #   with:
      #     command: check advisories""",
'ruby': """      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk Ruby
      #   uses: snyk/actions/ruby@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'php': """      #
      # ── ALTERNATIVE: local-php-security-checker ──────────────────
      # - name: SCA — local-php-security-checker
      #   run: |
      #     curl -L https://github.com/fabpot/local-php-security-checker/releases/download/v2.0.6/local-php-security-checker_linux_amd64 -o security-checker
      #     chmod +x security-checker && ./security-checker security:check composer.lock""",
'swift': """      #
      # ── ALTERNATIVE: Snyk (requires SNYK_TOKEN secret) ───────────
      # - name: SCA — Snyk Swift
      #   uses: snyk/actions/swift@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}""",
'elixir': """      #
      # ── ALTERNATIVE: mix hex.audit ───────────────────────────────
      # - name: SCA — mix hex.audit
      #   run: mix hex.audit""",
}
SCA_ALTS['scala'] = SCA_ALTS['java']
SCA_ALTS['clojure'] = SCA_ALTS['java']
SCA_ALTS['cpp'] = SCA_ALTS['rust']
SCA_ALTS['deno'] = SCA_ALTS['rust']
SCA_ALTS['bun'] = SCA_ALTS['nodejs']
SCA_ALTS['dart'] = ''

# ─── SAST ALTERNATIVES per ecosystem ────────────────────────────────────────

SAST_ALTS = {
'nodejs': """      #
      # ── ALTERNATIVE: NodeJsScan ──────────────────────────────────
      # - name: SAST — NodeJsScan
      #   uses: ajinabraham/njsscan-action@master
      #   with:
      #     args: '. --sarif --output njsscan.sarif'
      # - name: Upload NodeJsScan SARIF
      #   uses: github/codeql-action/upload-sarif@v3
      #   with:
      #     sarif_file: njsscan.sarif
      #
      # ── ALTERNATIVE: ESLint security ─────────────────────────────
      # - name: SAST — ESLint security plugin
      #   run: |
      #     npm install --save-dev eslint-plugin-security
      #     npx eslint --plugin security .""",
'python': """      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto
      #
      # ── ALTERNATIVE: Pylint security ─────────────────────────────
      # - name: SAST — Pylint
      #   run: pip install pylint && pylint --disable=all --enable=W0611,W0612 . || true""",
'go': """      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto
      #
      # ── ALTERNATIVE: staticcheck ──────────────────────────────────
      # - name: SAST — staticcheck
      #   uses: dominikh/staticcheck-action@v1.3.0""",
'java': """      #
      # ── ALTERNATIVE: SpotBugs / Find Security Bugs ────────────────
      # - name: SAST — SpotBugs
      #   run: mvn spotbugs:check -Dspotbugs.plugins=com.h3xstream.findsecbugs:findsecbugs-plugin:1.13.0
      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto""",
'kotlin': """      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto
      #
      # ── ALTERNATIVE: Android Lint ────────────────────────────────
      # - name: SAST — Android Lint
      #   run: ./gradlew lint""",
'dotnet': """      #
      # ── ALTERNATIVE: Security Code Scan ──────────────────────────
      # - name: SAST — Security Code Scan
      #   run: dotnet add package SecurityCodeScan.VS2019 && dotnet build --configuration Release
      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto""",
'rust': """      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto
      #
      # ── ALTERNATIVE: cargo-geiger (unsafe code detector) ─────────
      # - name: SAST — cargo-geiger
      #   run: cargo install cargo-geiger && cargo geiger 2>&1 || true""",
'ruby': """      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto
      #
      # ── ALTERNATIVE: RuboCop security ────────────────────────────
      # - name: SAST — RuboCop
      #   run: gem install rubocop rubocop-rails && rubocop --only Security""",
'php': """      #
      # ── ALTERNATIVE: PHPStan ─────────────────────────────────────
      # - name: SAST — PHPStan
      #   run: vendor/bin/phpstan analyse --level max src/
      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto""",
'swift': """      #
      # ── ALTERNATIVE: SwiftLint ────────────────────────────────────
      # - name: SAST — SwiftLint
      #   run: brew install swiftlint && swiftlint --strict
      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto""",
'elixir': """      #
      # ── ALTERNATIVE: Credo ───────────────────────────────────────
      # - name: SAST — Credo
      #   run: mix credo --strict
      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto""",
'cpp': """      #
      # ── ALTERNATIVE: clang-tidy ───────────────────────────────────
      # - name: SAST — clang-tidy
      #   run: run-clang-tidy -p build src/**/*.cpp
      #
      # ── ALTERNATIVE: Semgrep ─────────────────────────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto""",
}
SAST_ALTS['scala'] = SAST_ALTS['java']
SAST_ALTS['clojure'] = SAST_ALTS['java']
for k in ['deno', 'bun', 'dart']:
    SAST_ALTS[k] = SAST_ALTS['nodejs']

# ─── UNIVERSAL ALTERNATIVES ──────────────────────────────────────────────────

REGISTRY_ALTS = """      #
      # ── ALTERNATIVE: AWS ECR (OIDC) ──────────────────────────────
      # Requires: AWS_ACCOUNT_ID secret + OIDC role with ECR push
      # - name: Configure AWS credentials
      #   uses: aws-actions/configure-aws-credentials@v4
      #   with:
      #     role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-ecr
      #     aws-region: us-east-1
      # - name: Login to ECR
      #   id: login-ecr
      #   uses: aws-actions/amazon-ecr-login@v2
      # # env override: REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      #
      # ── ALTERNATIVE: GCP Artifact Registry (Workload Identity) ───
      # Requires: WORKLOAD_IDENTITY_PROVIDER + GCP_SERVICE_ACCOUNT secrets
      # - name: Authenticate to GCP
      #   id: auth
      #   uses: google-github-actions/auth@v2
      #   with:
      #     workload_identity_provider: ${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}
      #     service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
      # - name: Login to Artifact Registry
      #   uses: docker/login-action@v3
      #   with:
      #     registry: ${{ secrets.GCP_REGION }}-docker.pkg.dev
      #     username: oauth2accesstoken
      #     password: ${{ steps.auth.outputs.access_token }}
      # # env override: REGISTRY: ${{ secrets.GCP_REGION }}-docker.pkg.dev
      #
      # ── ALTERNATIVE: Azure ACR (OIDC) ────────────────────────────
      # Requires: AZURE_CLIENT_ID + AZURE_TENANT_ID + AZURE_SUBSCRIPTION_ID + ACR_NAME
      # - name: Login to Azure
      #   uses: azure/login@v2
      #   with:
      #     client-id: ${{ secrets.AZURE_CLIENT_ID }}
      #     tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      #     subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      # - name: Login to ACR
      #   run: az acr login --name ${{ secrets.ACR_NAME }}
      # # env override: REGISTRY: ${{ secrets.ACR_NAME }}.azurecr.io
      #
      # ── ALTERNATIVE: Red Hat Quay.io ──────────────────────────────
      # Requires: QUAY_USERNAME + QUAY_PASSWORD secrets
      # - name: Login to Quay.io
      #   uses: docker/login-action@v3
      #   with:
      #     registry: quay.io
      #     username: ${{ secrets.QUAY_USERNAME }}
      #     password: ${{ secrets.QUAY_PASSWORD }}
      # # env override: REGISTRY: quay.io
      #
      # ── ALTERNATIVE: Docker Hub ───────────────────────────────────
      # Requires: DOCKERHUB_USERNAME + DOCKERHUB_TOKEN secrets
      # - name: Login to Docker Hub
      #   uses: docker/login-action@v3
      #   with:
      #     username: ${{ secrets.DOCKERHUB_USERNAME }}
      #     password: ${{ secrets.DOCKERHUB_TOKEN }}
      # # env override: REGISTRY: docker.io"""

CONTAINER_SCAN_ALTS = """      #
      # ── ALTERNATIVE: Grype ───────────────────────────────────────
      # - name: Container scan — Grype
      #   uses: anchore/scan-action@v3
      #   with:
      #     image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
      #     fail-build: 'true'
      #     severity-cutoff: high
      #     output-format: sarif
      # - name: Upload Grype SARIF
      #   uses: github/codeql-action/upload-sarif@v3
      #   with:
      #     sarif_file: results.sarif
      #
      # ── ALTERNATIVE: Snyk Container (requires SNYK_TOKEN) ────────
      # - name: Container scan — Snyk
      #   uses: snyk/actions/docker@master
      #   env:
      #     SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      #   with:
      #     image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
      #     args: --severity-threshold=high --sarif-file-output=snyk.sarif
      # - name: Upload Snyk SARIF
      #   uses: github/codeql-action/upload-sarif@v3
      #   with:
      #     sarif_file: snyk.sarif
      #
      # ── ALTERNATIVE: Docker Scout ─────────────────────────────────
      # Requires: DOCKER_SCOUT_HUB_USER + DOCKER_SCOUT_HUB_PASSWORD secrets
      # - name: Container scan — Docker Scout
      #   uses: docker/scout-action@v1
      #   with:
      #     command: cves
      #     image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
      #     only-severities: critical,high
      #     exit-code: true"""

IAC_ALTS = """      #
      # ── ALTERNATIVE: KICS ────────────────────────────────────────
      # - name: IAC scan — KICS
      #   uses: checkmarx/kics-github-action@v2
      #   with:
      #     path: '.'
      #     output_formats: 'sarif'
      #     output_path: 'kics-results.sarif'
      #     fail_on: high
      # - name: Upload KICS SARIF
      #   uses: github/codeql-action/upload-sarif@v3
      #   with:
      #     sarif_file: kics-results.sarif
      #
      # ── ALTERNATIVE: Trivy config scan ───────────────────────────
      # - name: IAC scan — Trivy config
      #   uses: aquasecurity/trivy-action@master
      #   with:
      #     scan-type: config
      #     scan-ref: .
      #     format: sarif
      #     output: trivy-iac.sarif
      # - name: Upload Trivy IAC SARIF
      #   uses: github/codeql-action/upload-sarif@v3
      #   with:
      #     sarif_file: trivy-iac.sarif
      #
      # ── ALTERNATIVE: tfsec (Terraform-specific) ──────────────────
      # - name: IAC scan — tfsec
      #   uses: aquasecurity/tfsec-action@v1.0.0"""

SECRETS_ALTS = """      #
      # ── ALTERNATIVE: TruffleHog ──────────────────────────────────
      # - name: Secrets scan — TruffleHog
      #   uses: trufflesecurity/trufflehog@main
      #   with:
      #     path: ./
      #     base: ${{ github.event.repository.default_branch }}
      #     head: HEAD
      #     extra_args: --debug --only-verified
      #
      # ── ALTERNATIVE: GitGuardian (requires GITGUARDIAN_API_KEY) ──
      # - name: Secrets scan — GitGuardian
      #   uses: GitGuardian/ggshield-action@v1
      #   env:
      #     GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
      #   with:
      #     args: secret scan ci"""

BUILD_ALTS = {
'nodejs': """      #
      # ── ALTERNATIVE: yarn ────────────────────────────────────────
      # - name: Build — yarn
      #   run: yarn install --frozen-lockfile && yarn build
      #
      # ── ALTERNATIVE: pnpm ────────────────────────────────────────
      # - name: Build — pnpm
      #   run: pnpm install --frozen-lockfile && pnpm build
      #
      # ── ALTERNATIVE: bun ─────────────────────────────────────────
      # - name: Build — bun
      #   run: bun install --frozen-lockfile && bun run build""",
'java': """      #
      # ── ALTERNATIVE: Gradle ──────────────────────────────────────
      # - name: Build — Gradle
      #   run: ./gradlew build -x test""",
'python': """      #
      # ── ALTERNATIVE: poetry ──────────────────────────────────────
      # - name: Build — poetry
      #   run: pip install poetry && poetry install --no-dev
      #
      # ── ALTERNATIVE: uv ──────────────────────────────────────────
      # - name: Build — uv
      #   run: pip install uv && uv pip install -r requirements.txt""",
'mobile-js': """      #
      # ── ALTERNATIVE: Expo EAS Build ──────────────────────────────
      # - name: Build — Expo EAS
      #   run: npx eas-cli build --profile preview --platform android --non-interactive
      #
      # ── ALTERNATIVE: Ionic ───────────────────────────────────────
      # - name: Build — Ionic
      #   run: npx ionic build --prod""",
'flutter': """      #
      # ── ALTERNATIVE: flutter build ios ───────────────────────────
      # - name: Build — flutter iOS
      #   run: flutter build ios --release --no-codesign
      #
      # ── ALTERNATIVE: App Bundle (AAB) ────────────────────────────
      # - name: Build — flutter appbundle
      #   run: flutter build appbundle --release""",
'android-native': """      #
      # ── ALTERNATIVE: AAB (App Bundle) ────────────────────────────
      # - name: Build — gradle bundleRelease
      #   run: ./gradlew bundleRelease""",
'edge': """      #
      # ── ALTERNATIVE: Wrangler (Cloudflare) ───────────────────────
      # - name: Build — Wrangler
      #   run: npx wrangler build
      #
      # ── ALTERNATIVE: Vercel ──────────────────────────────────────
      # - name: Build — Vercel
      #   run: npx vercel build --prod""",
}
BUILD_ALTS['kotlin'] = BUILD_ALTS['java']
BUILD_ALTS['scala'] = BUILD_ALTS['java']
BUILD_ALTS['clojure'] = BUILD_ALTS['java']

def sca_alt(fw):
    e = LANG[fw['lang']].get('eco', 'nodejs')
    return SCA_ALTS.get(e, '')

def sast_alt(fw):
    e = LANG[fw['lang']].get('eco', 'nodejs')
    return SAST_ALTS.get(e, '')

def build_alt(fw):
    e = LANG[fw['lang']].get('eco', 'nodejs')
    return BUILD_ALTS.get(e, '')

# ─── STAGE GENERATORS ────────────────────────────────────────────────────────

def s01_pre_commit(fw):
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 01 — Pre-Commit  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: every push and pull_request to main
# Purpose: fast code-quality gates before all other stages
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "01 Pre-Commit — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:

  pre-commit:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      # ── DEFAULT: pre-commit framework ────────────────────────────
      - uses: pre-commit/action@v3.0.1
      #
      # ── ALTERNATIVE: commitlint (commit message format) ──────────
      # - name: Lint commit messages
      #   uses: wagoid/commitlint-github-action@v6
      #
      # ── ALTERNATIVE: super-linter ────────────────────────────────
      # - name: Super-Linter
      #   uses: super-linter/super-linter@v7
      #   env:
      #     GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
"""

def s02_security_gates(fw):
    lang = LANG[fw['lang']]
    sca_name = lang['sca_name']
    sca_cmd = lang['sca_cmd']
    sca_a = sca_alt(fw)

    sast_custom = lang.get('sast_cmd')
    sast_primary_name = lang.get('sast_name', 'Semgrep')
    sast_a = sast_alt(fw)

    if sast_custom:
        sast_primary = f"""      # ── DEFAULT: {sast_primary_name} ─────────────────────────────────────
      - name: SAST — {sast_primary_name}
        run: {sast_custom}
      #
      # ── ALTERNATIVE: Semgrep (language-agnostic) ─────────────────
      # - uses: returntocorp/semgrep-action@v1
      #   with:
      #     config: auto"""
    else:
        sast_primary = f"""      # ── DEFAULT: Semgrep ─────────────────────────────────────────
      - uses: returntocorp/semgrep-action@v1
        with:
          config: auto"""

    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 02 — Security Gates  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Jobs: sca  sast  codeql  license-scan  iac-scan  secrets-scan
# All jobs run in PARALLEL — no ordering dependency between them.
# Runs on: every push and pull_request to main
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "02 Security Gates — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  security-events: write  # SARIF upload to GitHub Security tab

jobs:

  # ── SCA: Software Composition Analysis (dependency vulnerabilities) ──
  sca:
    runs-on: ubuntu-24.04
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      # ── DEFAULT: {sca_name} ──────────────────────────────────────
      - name: SCA — {sca_name}
        run: {sca_cmd}
{sca_a}

  # ── SAST: Static Application Security Testing (code-level bugs) ─────
  sast:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
{sast_primary}
{sast_a}

  # ── CodeQL (GitHub-native SAST + dataflow analysis) ─────────────────
  codeql:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: {lang['codeql_lang']}
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3

  # ── License scan (detect copyleft licenses in dependencies) ─────────
  license-scan:
    runs-on: ubuntu-24.04
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: License check
        run: {lang['license_cmd']}
      #
      # ── ALTERNATIVE: FOSSA (commercial, full license intelligence) ─
      # - name: License scan — FOSSA
      #   uses: fossas/fossa-action@main
      #   with:
      #     api-key: ${{{{ secrets.FOSSA_API_KEY }}}}

  # ── IAC scan (Infrastructure as Code misconfigurations) ─────────────
  iac-scan:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      # ── DEFAULT: Checkov ─────────────────────────────────────────
      - uses: bridgecrewio/checkov-action@v12
        with:
          directory: .
          soft_fail: true  # REPLACE: false to hard-fail on violations
{IAC_ALTS}

  # ── Secrets scan (leaked credentials and API keys) ───────────────────
  secrets-scan:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # full history required for Gitleaks delta scan
      # ── DEFAULT: Gitleaks ─────────────────────────────────────────
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
{SECRETS_ALTS}
"""

def s03_build_pr(fw):
    fips_rt = fw.get('fips_rt', 'N/A')
    has_fips = fips_rt not in ('N/A', '', None)
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 03 — PR Build + Container Scan  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: pull_request to main ONLY — no image push to registry
# Requires: Dockerfile in repo root with --target runtime stage
# Runtime image: {fw['runtime']}
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "03 PR Build + Scan — {fw['name']} {fw['ver']}"

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  packages: write        # needed for GHCR --load (even without push)
  security-events: write # SARIF upload

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{{{ github.repository }}}}  # REPLACE: your-org/your-image-name

jobs:

  build-pr:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build image (no push — PR validation only)
        run: |
          docker build --platform linux/amd64 \\
            --target runtime \\
            -t $REGISTRY/$IMAGE_NAME:pr-${{{{ github.sha }}}} \\
            --load .

      - name: Generate SBOM (PR build)
        uses: anchore/syft-action@v1
        with:
          image: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:pr-${{{{ github.sha }}}}
          output-file: sbom-pr.spdx.json

      # ── DEFAULT: Trivy container scan ─────────────────────────────
      - name: Container scan — Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:pr-${{{{ github.sha }}}}
          format: sarif
          output: trivy-pr.sarif
          exit-code: '1'
          severity: HIGH,CRITICAL
      - name: Upload Trivy SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-pr.sarif
{CONTAINER_SCAN_ALTS}
"""

def s04_build_push_sign(fw):
    fips_rt = fw.get('fips_rt', 'N/A')
    has_fips = fips_rt not in ('N/A', '', None)
    lang = LANG[fw['lang']]
    build_cmd = lang['build_cmd']
    b_alt = build_alt(fw)

    fips_block = ""
    if has_fips:
        fips_block = f"""
      - name: Build and push — FIPS image (--target runtime-fips)
        run: |
          docker buildx build --platform linux/amd64 \\
            --push --target runtime-fips \\
            -t $REGISTRY/$IMAGE_NAME:${{{{ github.sha }}}}-fips \\
            .
          # FIPS runtime: {fips_rt}"""

    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 04 — Build / Push / Sign + SLSA  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: push to main ONLY
# Pushes to: GHCR (default) — see ALTERNATIVE registry blocks below
# Runtime image: {fw['runtime']}
# FIPS image:    {fips_rt if has_fips else 'N/A — no FIPS variant for this framework'}
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "04 Build Push Sign — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]

# ── Required secrets ──────────────────────────────────────────────
# GHCR (default):  none — uses GITHUB_TOKEN automatically
# ECR:             AWS_ACCOUNT_ID + OIDC role with ECR push
# GCP AR:          WORKLOAD_IDENTITY_PROVIDER + GCP_SERVICE_ACCOUNT
# ACR:             AZURE_CLIENT_ID + AZURE_TENANT_ID + AZURE_SUBSCRIPTION_ID + ACR_NAME
# Quay.io:         QUAY_USERNAME + QUAY_PASSWORD
# Docker Hub:      DOCKERHUB_USERNAME + DOCKERHUB_TOKEN
# Snyk (optional): SNYK_TOKEN
# ─────────────────────────────────────────────────────────────────

permissions:
  contents: read
  id-token: write        # OIDC for keyless cosign signing + cloud registry auth
  packages: write        # GHCR push
  security-events: write # Trivy SARIF upload

env:
  REGISTRY: ghcr.io                        # REPLACE: swap to ECR/GCP/ACR below
  IMAGE_NAME: ${{{{ github.repository }}}}     # REPLACE: your-org/your-image-name

jobs:

  build-push-sign:
    runs-on: ubuntu-24.04
    outputs:
      image-digest: ${{{{ steps.push.outputs.digest }}}}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # ── DEFAULT: Log in to GHCR ───────────────────────────────────
      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{{{ env.REGISTRY }}}}
          username: ${{{{ github.actor }}}}
          password: ${{{{ secrets.GITHUB_TOKEN }}}}
{REGISTRY_ALTS}

{lang['setup']}

      # ── DEFAULT: {build_cmd.split()[0]} build ──────────────────────
      - name: App build
        run: {build_cmd}
{b_alt}

      - name: Build and push — standard image (--target runtime)
        id: push
        run: |
          docker buildx build --platform linux/amd64 \\
            --push --target runtime \\
            -t $REGISTRY/$IMAGE_NAME:${{{{ github.sha }}}} \\
            -t $REGISTRY/$IMAGE_NAME:latest \\
            .
{fips_block}

      # ── DEFAULT: Trivy post-push scan ─────────────────────────────
      - name: Container scan — Trivy (post-push)
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:${{{{ github.sha }}}}
          exit-code: '1'
          severity: HIGH,CRITICAL
          format: sarif
          output: trivy-main.sarif
      - name: Upload Trivy SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-main.sarif
{CONTAINER_SCAN_ALTS}

      - name: Install cosign
        uses: sigstore/cosign-installer@v3

      - name: Sign image (keyless OIDC — no stored private key)
        run: cosign sign --yes $REGISTRY/$IMAGE_NAME@${{{{ steps.push.outputs.digest }}}}

      - name: Generate SBOM
        uses: anchore/syft-action@v1
        with:
          image: ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:${{{{ github.sha }}}}
          output-file: sbom.spdx.json

      - name: Attest SBOM to image
        run: |
          cosign attest --yes \\
            --predicate sbom.spdx.json \\
            $REGISTRY/$IMAGE_NAME@${{{{ steps.push.outputs.digest }}}}

  # ── SLSA Level 3 provenance (needs image digest from build-push-sign) ─
  slsa-provenance:
    needs: build-push-sign
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

# ── Compliance delta checklist ─────────────────────────────────────
# FIPS 140-2/3:  use --target runtime-fips (block above, wired for {fips_rt if has_fips else 'N/A'})
# PCI DSS v4.0:  trivy --severity CRITICAL --exit-code 1 (already set)
# HIPAA:         add step: semgrep --config p/hipaa .
# FedRAMP:       FIPS image required + SLSA Level 3 (both above)
# CMMC Level 2:  add CODEOWNERS; set artifact retention-days: 365
# SOC 2 Type II: upload-artifact for scan results; retention-days: 90
# SOX:           2+ approvers in branch protection (GitHub repo settings)
# GDPR/PIPEDA:   add step: semgrep --config p/pii .
# NERC CIP:      vendor all deps; add --network none to docker build
# ISO 27001:     set retention-days: 1825 on all artifact uploads
"""

def s05_test(fw):
    lang = LANG[fw['lang']]
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 05 — Test  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: every push and pull_request to main
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "05 Test — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:

  test:
    runs-on: ubuntu-24.04
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: Run tests
        run: {lang['test_cmd']}

      # ── OPTIONAL: Codecov coverage upload ─────────────────────────
      # - uses: codecov/codecov-action@v4
      #   with:
      #     token: ${{{{ secrets.CODECOV_TOKEN }}}}

      # ── OPTIONAL: SonarCloud (requires SONAR_TOKEN secret) ────────
      # - name: SonarCloud analysis
      #   uses: SonarSource/sonarcloud-github-action@master
      #   env:
      #     GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
      #     SONAR_TOKEN: ${{{{ secrets.SONAR_TOKEN }}}}
"""

def s06_release(fw):
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 06 — Release  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: push to main only
# Default: semantic-release (reads commit messages for version bump)
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "06 Release — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]

permissions:
  contents: write  # needed to create tags and GitHub releases
  id-token: write
  packages: write

jobs:

  release:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # full history required for semantic-release

      # ── DEFAULT: semantic-release ─────────────────────────────────
      - name: Semantic release
        uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
      #
      # ── ALTERNATIVE: Release Please (Google) ─────────────────────
      # - uses: googleapis/release-please-action@v4
      #   with:
      #     release-type: node  # REPLACE: go | python | java | etc.
      #
      # ── ALTERNATIVE: GitHub Release (manual tag push) ─────────────
      # - name: Create GitHub Release
      #   uses: ncipollo/release-action@v1
      #   with:
      #     tag: ${{{{ github.ref_name }}}}
      #     generateReleaseNotes: true
"""

def s07_notify(fw):
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 07 — Notify  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Triggers after: "04 Build Push Sign — {fw['name']} {fw['ver']}"
# Runs on: main branch only, on workflow_run completion
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "07 Notify — {fw['name']} {fw['ver']}"

on:
  workflow_run:
    # Must exactly match the 'name:' field in 04-build-push-sign.yml
    workflows: ["04 Build Push Sign — {fw['name']} {fw['ver']}"]
    types: [completed]

permissions:
  contents: read

jobs:

  notify:
    if: github.event.workflow_run.conclusion != 'skipped'
    runs-on: ubuntu-24.04
    steps:
      # ── DEFAULT: Slack ────────────────────────────────────────────
      - uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {{{{
              "text": "Pipeline ${{{{ github.event.workflow_run.conclusion }}}}: {fw['name']} {fw['ver']} — ${{{{ github.event.workflow_run.head_sha }}}}"
            }}}}
        env:
          SLACK_WEBHOOK_URL: ${{{{ secrets.SLACK_WEBHOOK_URL }}}}
      #
      # ── ALTERNATIVE: Microsoft Teams ──────────────────────────────
      # - uses: aliencube/microsoft-teams-actions@v0.8.0
      #   with:
      #     webhook_uri: ${{{{ secrets.TEAMS_WEBHOOK_URL }}}}
      #     title: "Pipeline ${{{{ github.event.workflow_run.conclusion }}}}"
      #     summary: "{fw['name']} {fw['ver']} — ${{{{ github.event.workflow_run.head_sha }}}}"
      #
      # ── ALTERNATIVE: PagerDuty (failures only) ────────────────────
      # - if: github.event.workflow_run.conclusion == 'failure'
      #   uses: PagerDuty/pagerduty-send-event@v2
      #   with:
      #     integration-key: ${{{{ secrets.PAGERDUTY_INTEGRATION_KEY }}}}
      #     payload-summary: "CI failed: {fw['name']} {fw['ver']}"
"""

# ─── CI-ONLY STAGE GENERATORS ────────────────────────────────────────────────

def s03_build_artifact(fw):
    lang = LANG[fw['lang']]
    artifact = lang.get('artifact', 'artifact')
    build_cmd = lang['build_cmd']
    b_alt = build_alt(fw)

    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 03 — Build Artifact  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Output: {artifact}
# No Docker image is built — this framework targets mobile/edge platforms.
# Runs on: every push and pull_request to main
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "03 Build Artifact — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:

  build:
    runs-on: ubuntu-24.04
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      # ── DEFAULT: {build_cmd.split()[0]} build ──────────────────────
      - name: Build — {build_cmd.split()[0]}
        run: {build_cmd}
{b_alt}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: {artifact.lower().replace('/', '-').replace(' ', '-')}
          path: |
            build/
            dist/
            *.apk
            *.ipa
            *.aab
            *.msix
          retention-days: 30
"""

def s04_test_cionly(fw):
    lang = LANG[fw['lang']]
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 04 — Test  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: every push and pull_request to main
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "04 Test — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:

  test:
    runs-on: ubuntu-24.04
    steps:
{lang['setup']}
      - uses: actions/checkout@v4
      - name: Run tests
        run: {lang['test_cmd']}
      # ── OPTIONAL: Codecov ─────────────────────────────────────────
      # - uses: codecov/codecov-action@v4
      #   with:
      #     token: ${{{{ secrets.CODECOV_TOKEN }}}}
"""

def s05_release_notify_cionly(fw):
    lang = LANG[fw['lang']]
    artifact = lang.get('artifact', 'artifact')
    return f"""\
# ════════════════════════════════════════════════════════════════════
# Stage 05 — Release + Notify  |  {fw['cat']} — {fw['name']} {fw['ver']}
# Runs on: push to main only
# Copy to: .github/workflows/ in your {fw['name']} repo
# ════════════════════════════════════════════════════════════════════

name: "05 Release Notify — {fw['name']} {fw['ver']}"

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:

  release:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      # ── DEFAULT: semantic-release ─────────────────────────────────
      - name: Semantic release
        uses: cycjimmy/semantic-release-action@v4
        env:
          GITHUB_TOKEN: ${{{{ secrets.GITHUB_TOKEN }}}}
      #
      # ── ALTERNATIVE: Release Please ───────────────────────────────
      # - uses: googleapis/release-please-action@v4
      #   with:
      #     release-type: node

  notify:
    needs: release
    if: always()
    runs-on: ubuntu-24.04
    steps:
      # ── DEFAULT: Slack ────────────────────────────────────────────
      - uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {{{{
              "text": "Pipeline ${{{{ job.status }}}}: {fw['name']} {fw['ver']} {artifact} — ${{{{ github.sha }}}}"
            }}}}
        env:
          SLACK_WEBHOOK_URL: ${{{{ secrets.SLACK_WEBHOOK_URL }}}}
      #
      # ── ALTERNATIVE: Microsoft Teams ──────────────────────────────
      # - uses: aliencube/microsoft-teams-actions@v0.8.0
      #   with:
      #     webhook_uri: ${{{{ secrets.TEAMS_WEBHOOK_URL }}}}
      #     title: "Pipeline ${{{{ job.status }}}}"
      #     summary: "{fw['name']} {fw['ver']} — ${{{{ github.sha }}}}"
"""

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    # Remove old flat yml files first
    import glob
    for f in glob.glob(f"{OUT}/*.yml"):
        os.remove(f)

    total_dirs = 0
    total_files = 0

    for fw in FRAMEWORKS:
        folder = f"{OUT}/{fw['slug']}"
        os.makedirs(folder, exist_ok=True)
        total_dirs += 1

        if fw['pattern'] == 'multi-stage':
            stages = [
                ('01-pre-commit.yml',      s01_pre_commit(fw)),
                ('02-security-gates.yml',  s02_security_gates(fw)),
                ('03-build-pr.yml',        s03_build_pr(fw)),
                ('04-build-push-sign.yml', s04_build_push_sign(fw)),
                ('05-test.yml',            s05_test(fw)),
                ('06-release.yml',         s06_release(fw)),
                ('07-notify.yml',          s07_notify(fw)),
            ]
        else:
            stages = [
                ('01-pre-commit.yml',          s01_pre_commit(fw)),
                ('02-security-gates.yml',      s02_security_gates(fw)),
                ('03-build-artifact.yml',      s03_build_artifact(fw)),
                ('04-test.yml',                s04_test_cionly(fw)),
                ('05-release-notify.yml',      s05_release_notify_cionly(fw)),
            ]

        for fname, content in stages:
            fpath = f"{folder}/{fname}"
            with open(fpath, 'w') as f:
                f.write(content)
            total_files += 1

        pattern_label = '7 stages' if fw['pattern'] == 'multi-stage' else '5 stages'
        print(f"  ✓ {folder}/  ({pattern_label})")

    print(f"\nGenerated {total_dirs} framework folders, {total_files} YAML files")
    print(f"Output: {OUT}/")

if __name__ == '__main__':
    main()
