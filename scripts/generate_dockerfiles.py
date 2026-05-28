#!/usr/bin/env python3
"""
Generate 75 Dockerfiles for pipeline-studio.

Outputs to: dockerfiles/{slug}.dockerfile

Each file is copy-paste ready. Developer copies to their repo root as 'Dockerfile'.
Multi-stage pattern: build (ubuntu:24.04) → runtime → runtime-fips (where applicable).
CI-only frameworks (mobile, edge): placeholder file explaining no Docker needed.

Usage:
    python3 scripts/generate_dockerfiles.py
"""

import os

# ─── FRAMEWORK DATA (same source of truth as other generators) ────────────

FRAMEWORKS = [
# 01 SSR/Hybrid
{'num':21,'cat':'01 SSR/Hybrid','name':'Next.js','ver':'16.2.6','slug':'01-nextjs','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node server.js','comment':'# Next.js: run "next build" then "next start" or use custom server.js'},
{'num':22,'cat':'01 SSR/Hybrid','name':'Remix','ver':'7','slug':'01-remix','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node ./build/server/index.js','comment':'# Remix: adapter-node builds to ./build'},
{'num':23,'cat':'01 SSR/Hybrid','name':'Nuxt','ver':'4.4','slug':'01-nuxt','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node .output/server/index.mjs','comment':'# Nuxt: output is in .output/server/'},
{'num':24,'cat':'01 SSR/Hybrid','name':'SvelteKit','ver':'2.57','slug':'01-sveltekit','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node build/index.js','comment':'# SvelteKit: adapter-node output is in build/'},
{'num':25,'cat':'01 SSR/Hybrid','name':'Angular SSR','ver':'20','slug':'01-angular-ssr','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':4000,'cmd':'node dist/server/main.js','comment':'# Angular SSR: dist/server/main.js is the SSR entry'},
# 02 CSR/SPA
{'num':26,'cat':'02 CSR/SPA','name':'React','ver':'19','slug':'02-react','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# React: static assets in dist/ or build/ depending on bundler'},
{'num':27,'cat':'02 CSR/SPA','name':'Vue','ver':'3.5','slug':'02-vue','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Vue: Vite outputs to dist/'},
{'num':28,'cat':'02 CSR/SPA','name':'Angular','ver':'20','slug':'02-angular','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Angular: ng build outputs to dist/<project-name>/browser/'},
{'num':29,'cat':'02 CSR/SPA','name':'Svelte','ver':'5','slug':'02-svelte','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Svelte: Vite outputs to dist/'},
{'num':30,'cat':'02 CSR/SPA','name':'Solid.js','ver':'2.0','slug':'02-solidjs','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Solid.js: Vite outputs to dist/'},
# 03 SSG
{'num':31,'cat':'03 SSG','name':'Astro','ver':'6.3','slug':'03-astro','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Astro SSG: astro build outputs to dist/'},
{'num':32,'cat':'03 SSG','name':'Eleventy','ver':'3.0','slug':'03-eleventy','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Eleventy: outputs to _site/ by default'},
{'num':33,'cat':'03 SSG','name':'Hugo','ver':'0.161','slug':'03-hugo','lang':'hugo','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Hugo: hugo --minify outputs to public/'},
{'num':34,'cat':'03 SSG','name':'Gatsby','ver':'5.13','slug':'03-gatsby','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Gatsby: gatsby build outputs to public/'},
# 04 Islands
{'num':35,'cat':'04 Islands','name':'Astro','ver':'6.3','slug':'04-astro','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node dist/server/entry.mjs','comment':'# Astro Islands: adapter-node; dist/server/entry.mjs'},
{'num':36,'cat':'04 Islands','name':'Fresh','ver':'2.3','slug':'04-fresh','lang':'deno','pattern':'multi-stage','runtime':'denoland/deno:2.3-alpine','fips_rt':None,'port':8000,'cmd':'deno task start','comment':'# Fresh: runs directly with deno — no separate build step needed'},
# 05 Resumability
{'num':37,'cat':'05 Resumability','name':'Qwik','ver':'2.0','slug':'05-qwik','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node server/entry.express.js','comment':'# Qwik: adaptor-express; entry point is server/entry.express.js'},
# 06 Edge — CI-only
{'num':38,'cat':'06 Edge Rendering','name':'Next.js Edge','ver':'16','slug':'06-nextjs-edge','lang':'edge','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':39,'cat':'06 Edge Rendering','name':'Hono','ver':'4.7','slug':'06-hono-edge','lang':'edge','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':40,'cat':'06 Edge Rendering','name':'Remix Cloudflare','ver':'7','slug':'06-remix-cloudflare','lang':'edge','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
# 07 Streaming SSR
{'num':41,'cat':'07 Streaming SSR','name':'Next.js App Router','ver':'16','slug':'07-nextjs-app-router','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node server.js','comment':'# Next.js App Router: same as standard Next.js — node server.js'},
{'num':42,'cat':'07 Streaming SSR','name':'Remix','ver':'7','slug':'07-remix','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node ./build/server/index.js','comment':'# Remix streaming: adapter-node; same entry as cat 01'},
{'num':43,'cat':'07 Streaming SSR','name':'SvelteKit','ver':'2.57','slug':'07-sveltekit','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node build/index.js','comment':'# SvelteKit streaming: same as cat 01 SvelteKit'},
# 08 Micro-frontends
{'num':44,'cat':'08 Micro-frontends','name':'Module Federation Webpack','ver':'5','slug':'08-mf-webpack','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Webpack Module Federation: each micro-frontend is a standalone static bundle'},
{'num':45,'cat':'08 Micro-frontends','name':'Module Federation Rspack','ver':'1','slug':'08-mf-rspack','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Rspack Module Federation: same pattern as Webpack MF'},
{'num':46,'cat':'08 Micro-frontends','name':'single-spa','ver':'6.0','slug':'08-single-spa','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# single-spa: each app is a static bundle served independently'},
# 09 Cross-platform JS — CI-only
{'num':47,'cat':'09 Cross-platform JS','name':'React Native','ver':'0.79','slug':'09-react-native','lang':'mobile-js','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':48,'cat':'09 Cross-platform JS','name':'Expo','ver':'52','slug':'09-expo','lang':'mobile-js','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':49,'cat':'09 Cross-platform JS','name':'Ionic','ver':'8','slug':'09-ionic','lang':'mobile-js','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
# 10 Cross-platform non-JS — CI-only
{'num':50,'cat':'10 Cross-platform non-JS','name':'Flutter','ver':'3.44','slug':'10-flutter','lang':'flutter','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':51,'cat':'10 Cross-platform non-JS','name':'.NET MAUI','ver':'10','slug':'10-dotnet-maui','lang':'dotnet-mobile','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':52,'cat':'10 Cross-platform non-JS','name':'Kotlin Multiplatform','ver':'2.1','slug':'10-kmp','lang':'android-native','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
# 11 Native iOS — CI-only
{'num':53,'cat':'11 Native iOS','name':'Swift / SwiftUI','ver':'6','slug':'11-swift-swiftui','lang':'ios-native','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':54,'cat':'11 Native iOS','name':'Objective-C UIKit','ver':'SDK 17','slug':'11-objc-uikit','lang':'ios-native','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
# 12 Native Android — CI-only
{'num':55,'cat':'12 Native Android','name':'Kotlin Jetpack Compose','ver':'2.0','slug':'12-kotlin-jetpack','lang':'android-native','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
{'num':56,'cat':'12 Native Android','name':'Java Android SDK','ver':'17','slug':'12-java-android','lang':'android-native','pattern':'ci-only','runtime':None,'fips_rt':None,'port':None,'cmd':None,'comment':None},
# 13 PWA
{'num':57,'cat':'13 PWA','name':'Workbox','ver':'7.3','slug':'13-workbox','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Workbox PWA: static bundle served from dist/'},
{'num':58,'cat':'13 PWA','name':'Vite PWA Plugin','ver':'0.21','slug':'13-vite-pwa','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80,'cmd':None,'comment':'# Vite PWA: Vite outputs to dist/; service worker included'},
# 14 Node/Deno/Bun
{'num':59,'cat':'14 Node/Deno/Bun','name':'Express','ver':'5.0','slug':'14-express','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node dist/index.js','comment':'# Express: entry point after tsc build; adjust if using plain JS (node src/index.js)'},
{'num':60,'cat':'14 Node/Deno/Bun','name':'Fastify','ver':'5.2','slug':'14-fastify','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node dist/index.js','comment':'# Fastify: same entry pattern as Express'},
{'num':61,'cat':'14 Node/Deno/Bun','name':'NestJS','ver':'11.0','slug':'14-nestjs','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node dist/main.js','comment':'# NestJS: tsc outputs to dist/main.js'},
{'num':62,'cat':'14 Node/Deno/Bun','name':'Hono','ver':'4.7','slug':'14-hono','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000,'cmd':'node dist/index.js','comment':'# Hono on Node: entry is dist/index.js after build'},
{'num':63,'cat':'14 Node/Deno/Bun','name':'Deno','ver':'2.3','slug':'14-deno','lang':'deno','pattern':'multi-stage','runtime':'denoland/deno:2.3-alpine','fips_rt':None,'port':8000,'cmd':'deno task start','comment':'# Deno server: deno task start defined in deno.json'},
{'num':64,'cat':'14 Node/Deno/Bun','name':'Elysia','ver':'1.2','slug':'14-elysia','lang':'bun','pattern':'multi-stage','runtime':'oven/bun:1-alpine','fips_rt':None,'port':3000,'cmd':'bun run dist/index.js','comment':'# Elysia (Bun): bun build outputs to dist/index.js'},
# 15 Python
{'num':65,'cat':'15 Python','name':'FastAPI','ver':'0.115','slug':'15-fastapi','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080,'cmd':'uvicorn main:app --host 0.0.0.0 --port 8080','comment':'# FastAPI: REPLACE main:app with your module:app (e.g. app.main:app)'},
{'num':66,'cat':'15 Python','name':'Django','ver':'5.2','slug':'15-django','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080,'cmd':'gunicorn myproject.wsgi:application --bind 0.0.0.0:8080','comment':'# Django: REPLACE myproject with your Django project name'},
{'num':67,'cat':'15 Python','name':'Flask','ver':'3.1','slug':'15-flask','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080,'cmd':'gunicorn app:app --bind 0.0.0.0:8080','comment':'# Flask: REPLACE app:app with your module:Flask-instance'},
{'num':68,'cat':'15 Python','name':'Starlette','ver':'0.41','slug':'15-starlette','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080,'cmd':'uvicorn main:app --host 0.0.0.0 --port 8080','comment':'# Starlette: same entry pattern as FastAPI'},
# 16 Go
{'num':69,'cat':'16 Go','name':'Gin','ver':'1.10','slug':'16-gin','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Gin: statically linked binary copied to scratch image'},
{'num':70,'cat':'16 Go','name':'Echo','ver':'4.12','slug':'16-echo','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Echo: same pattern as Gin'},
{'num':71,'cat':'16 Go','name':'Fiber','ver':'3.0','slug':'16-fiber','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Fiber: same pattern as Gin'},
{'num':72,'cat':'16 Go','name':'Chi','ver':'5.2','slug':'16-chi','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Chi: same pattern as Gin'},
# 17 Java
{'num':73,'cat':'17 Java','name':'Spring Boot','ver':'3.4','slug':'17-spring-boot','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Spring Boot: mvn package produces target/*.jar (fat jar via spring-boot-maven-plugin)'},
{'num':74,'cat':'17 Java','name':'Quarkus','ver':'3.35','slug':'17-quarkus','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Quarkus: mvn package -Dquarkus.package.jar.type=uber-jar; adjust if using native mode'},
{'num':75,'cat':'17 Java','name':'Micronaut','ver':'5.0','slug':'17-micronaut','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Micronaut: mvn package produces target/*.jar'},
# 18 Kotlin
{'num':76,'cat':'18 Kotlin','name':'Ktor','ver':'3.5','slug':'18-ktor','lang':'kotlin','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Ktor: ./gradlew shadowJar produces build/libs/*-all.jar'},
{'num':77,'cat':'18 Kotlin','name':'Spring Boot Kotlin','ver':'3.4','slug':'18-spring-boot-kotlin','lang':'kotlin','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Spring Boot Kotlin: same JAR pattern as Java Spring Boot'},
# 19 .NET
{'num':78,'cat':'19 .NET','name':'ASP.NET Core','ver':'9','slug':'19-aspnet-core','lang':'dotnet','pattern':'multi-stage','runtime':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine','fips_rt':'mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips','port':8080,'cmd':None,'comment':'# ASP.NET Core: dotnet publish -c Release -o out; REPLACE App.dll with your assembly name'},
{'num':79,'cat':'19 .NET','name':'Minimal APIs .NET','ver':'9','slug':'19-minimal-apis','lang':'dotnet','pattern':'multi-stage','runtime':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine','fips_rt':'mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips','port':8080,'cmd':None,'comment':'# Minimal APIs: same publish pattern as ASP.NET Core'},
# 20 Rust
{'num':80,'cat':'20 Rust','name':'Axum','ver':'0.8','slug':'20-axum','lang':'rust','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Axum: statically linked via musl target; zero-dependency scratch image'},
{'num':81,'cat':'20 Rust','name':'Actix-web','ver':'4.9','slug':'20-actix-web','lang':'rust','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Actix-web: same musl/scratch pattern as Axum'},
# 21 Elixir
{'num':82,'cat':'21 Elixir/BEAM','name':'Phoenix','ver':'1.7','slug':'21-phoenix','lang':'elixir','pattern':'multi-stage','runtime':'hexpm/elixir:1.17-erlang-27-debian-bookworm-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-minimal','port':4000,'cmd':None,'comment':'# Phoenix: mix release; REPLACE myapp with your OTP app name'},
# 22 Ruby
{'num':83,'cat':'22 Ruby','name':'Rails','ver':'8.0','slug':'22-rails','lang':'ruby','pattern':'multi-stage','runtime':'ruby:3.3-alpine','fips_rt':'registry.access.redhat.com/ubi9/ruby-32','port':3000,'cmd':'bundle exec puma -C config/puma.rb','comment':'# Rails: Puma is the default Rails app server'},
{'num':84,'cat':'22 Ruby','name':'Sinatra','ver':'4.0','slug':'22-sinatra','lang':'ruby','pattern':'multi-stage','runtime':'ruby:3.3-alpine','fips_rt':'registry.access.redhat.com/ubi9/ruby-32','port':3000,'cmd':'bundle exec rackup --host 0.0.0.0 --port 3000','comment':'# Sinatra: rackup with config.ru; REPLACE if using a different server'},
# 23 PHP
{'num':85,'cat':'23 PHP','name':'Laravel','ver':'12','slug':'23-laravel','lang':'php','pattern':'multi-stage','runtime':'php:8.3-fpm-alpine','fips_rt':None,'port':9000,'cmd':None,'comment':'# Laravel: php-fpm serves on port 9000; pair with nginx sidecar for HTTP'},
{'num':86,'cat':'23 PHP','name':'Symfony','ver':'7.2','slug':'23-symfony','lang':'php','pattern':'multi-stage','runtime':'php:8.3-fpm-alpine','fips_rt':None,'port':9000,'cmd':None,'comment':'# Symfony: same php-fpm pattern as Laravel'},
{'num':87,'cat':'23 PHP','name':'Slim','ver':'4.14','slug':'23-slim','lang':'php','pattern':'multi-stage','runtime':'php:8.3-fpm-alpine','fips_rt':None,'port':9000,'cmd':None,'comment':'# Slim: same php-fpm pattern; simpler app structure'},
# 24 Swift Server
{'num':88,'cat':'24 Swift Server','name':'Vapor','ver':'4.121','slug':'24-vapor','lang':'swift-server','pattern':'multi-stage','runtime':'swift:6.0-noble-slim','fips_rt':None,'port':8080,'cmd':None,'comment':'# Vapor: swift build -c release; REPLACE App with your target name'},
{'num':89,'cat':'24 Swift Server','name':'Hummingbird','ver':'2.0','slug':'24-hummingbird','lang':'swift-server','pattern':'multi-stage','runtime':'swift:6.0-noble-slim','fips_rt':None,'port':8080,'cmd':None,'comment':'# Hummingbird: same swift build pattern as Vapor'},
# 25 Scala
{'num':90,'cat':'25 Scala','name':'Play','ver':'3.0','slug':'25-play','lang':'scala','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':9000,'cmd':None,'comment':'# Play: sbt dist; unzip dist/universal/*.zip; run bin/<app-name>'},
{'num':91,'cat':'25 Scala','name':'http4s','ver':'0.23','slug':'25-http4s','lang':'scala','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# http4s: sbt assembly produces a fat JAR'},
# 26 Clojure
{'num':92,'cat':'26 Clojure','name':'Ring','ver':'1.12','slug':'26-ring','lang':'clojure','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Ring: lein uberjar produces target/*-standalone.jar'},
{'num':93,'cat':'26 Clojure','name':'Pedestal','ver':'0.7','slug':'26-pedestal','lang':'clojure','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080,'cmd':None,'comment':'# Pedestal: same uberjar pattern as Ring'},
# 27 C/C++
{'num':94,'cat':'27 C/C++','name':'Drogon','ver':'1.9.13','slug':'27-drogon','lang':'cpp','pattern':'multi-stage','runtime':'debian:12-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Drogon: cmake --build outputs app binary; requires shared libs so uses debian:12-slim not scratch'},
{'num':95,'cat':'27 C/C++','name':'Crow','ver':'1.3.2','slug':'27-crow','lang':'cpp','pattern':'multi-stage','runtime':'debian:12-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080,'cmd':None,'comment':'# Crow: header-only library; cmake --build produces single binary'},
]

# ─── LANGUAGE PROFILES ────────────────────────────────────────────────────

LANG = {

'nodejs-node': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \\
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \\
 && apt-get install -y nodejs \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build""",
    'runtime_copy': """\
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./""",
    'runtime_user_alpine': "RUN addgroup -S app && adduser -S app -G app",
    'runtime_user_ubi': "RUN useradd -u 1001 -r -g 0 -s /sbin/nologin app",
    'cmd_prefix': 'CMD ["node",',
},

'nodejs-nginx': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \\
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \\
 && apt-get install -y nodejs \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build""",
    'static_dir': 'dist',
    'nginx_html': '/usr/share/nginx/html',
},

'hugo': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \\
 && wget -q https://github.com/gohugoio/hugo/releases/download/v0.161.0/hugo_extended_0.161.0_linux-amd64.tar.gz \\
 && tar -xzf hugo_extended_0.161.0_linux-amd64.tar.gz -C /usr/local/bin \\
 && rm hugo_extended_0.161.0_linux-amd64.tar.gz \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY . .
RUN hugo --minify""",
    'static_dir': 'public',
    'nginx_html': '/usr/share/nginx/html',
},

'deno': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \\
 && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY deno.json deno.lock* ./
RUN deno cache src/main.ts
COPY . .
RUN deno task build 2>/dev/null || echo "No build step — running directly\"""",
    'runtime_copy': """\
COPY --from=build --chown=1001:0 /app ./""",
    'runtime_user': "USER 1001",
},

'bun': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \\
 && curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build src/index.ts --target bun --outfile dist/index.js""",
    'runtime_copy': """\
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./""",
    'runtime_user': "RUN adduser -D -u 1001 app",
},

'python': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends python3.12 python3-pip python3-venv \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY requirements.txt ./
RUN python3 -m venv /venv \\
 && /venv/bin/pip install --no-cache-dir --upgrade pip \\
 && /venv/bin/pip install --no-cache-dir -r requirements.txt""",
    'runtime_copy': """\
COPY --from=build --chown=1001:0 /venv /venv
COPY --chown=1001:0 . .""",
    'runtime_user_slim': "RUN useradd -u 1001 -r app",
    'runtime_user_ubi': "USER 1001",
    'env': 'ENV PATH="/venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1',
},

'go': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \\
 && wget -q https://go.dev/dl/go1.23.4.linux-amd64.tar.gz \\
 && tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz \\
 && rm go1.23.4.linux-amd64.tar.gz \\
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/local/go/bin:$PATH" CGO_ENABLED=0 GOOS=linux""",
    'build_steps': """\
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -a -installsuffix cgo -ldflags="-s -w" -o /app/bin/app ./...""",
    'runtime_copy_scratch': """\
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app/bin/app /app""",
    'runtime_copy_ubi': """\
COPY --from=build /app/bin/app /usr/local/bin/app""",
},

'java': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends maven openjdk-21-jdk \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY pom.xml ./
RUN mvn dependency:go-offline -B -q
COPY src ./src
RUN mvn package -DskipTests -B -q
# REPLACE: if using Gradle, use: COPY build.gradle.kts settings.gradle.kts ./
# REPLACE: ./gradlew shadowJar or ./gradlew bootJar""",
    'runtime_copy': """\
COPY --from=build /app/target/*.jar app.jar""",
    'runtime_copy_ubi': """\
COPY --from=build /app/target/*.jar /deployments/app.jar""",
},

'kotlin': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle ./gradle
RUN ./gradlew dependencies -q
COPY src ./src
RUN ./gradlew shadowJar -q
# REPLACE: use bootJar for Spring Boot Kotlin; shadowJar for Ktor""",
    'runtime_copy': """\
COPY --from=build /app/build/libs/*-all.jar app.jar""",
    'runtime_copy_ubi': """\
COPY --from=build /app/build/libs/*-all.jar /deployments/app.jar""",
},

'dotnet': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \\
 && wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \\
 && dpkg -i packages-microsoft-prod.deb \\
 && apt-get update && apt-get install -y dotnet-sdk-9.0 \\
 && rm -rf /var/lib/apt/lists/* packages-microsoft-prod.deb""",
    'build_steps': """\
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/out --self-contained false""",
    'runtime_copy': """\
COPY --from=build --chown=app:app /app/out ./""",
    'runtime_user': "RUN adduser -u 1001 -D app",
},

'rust': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential musl-tools ca-certificates \\
 && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \\
 && . /root/.cargo/env \\
 && rustup target add x86_64-unknown-linux-musl \\
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/root/.cargo/bin:$PATH" """,
    'build_steps': """\
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release --target x86_64-unknown-linux-musl && rm src/main.rs
COPY src ./src
RUN cargo build --release --target x86_64-unknown-linux-musl
# REPLACE: binary name in COPY below defaults to 'app' — update to your Cargo package name""",
    'runtime_copy_scratch': """\
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/app /app""",
    'runtime_copy_ubi': """\
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/app /usr/local/bin/app""",
},

'elixir': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
ENV MIX_ENV=prod
COPY mix.exs mix.lock ./
RUN mix local.hex --force && mix local.rebar --force && mix deps.get --only prod
COPY config ./config
COPY lib ./lib
COPY priv ./priv
RUN mix compile && mix release
# REPLACE: 'myapp' in CMD below with your OTP app name (from mix.exs :app key)""",
    'runtime_copy': """\
COPY --from=build --chown=1001:0 /app/_build/prod/rel/myapp ./
# REPLACE: myapp with your OTP release name""",
    'runtime_user': "RUN useradd -u 1001 -r -g 0 app",
},

'ruby': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends ruby ruby-dev build-essential \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY Gemfile Gemfile.lock ./
RUN bundle config set without 'development test' \\
 && bundle install --path vendor/bundle
COPY . .""",
    'runtime_copy': """\
COPY --from=build --chown=app:app /app ./""",
    'runtime_user_alpine': "RUN adduser -D -u 1001 app",
    'runtime_user_ubi': "RUN useradd -u 1001 -r -g 0 app",
},

'php': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml \\
 && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress
COPY . .""",
    'runtime_copy': """\
COPY --from=build --chown=www-data:www-data /app ./""",
    'runtime_user': "USER www-data",
},

'swift-server': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends wget clang libicu-dev libssl-dev \\
 && wget -q https://download.swift.org/swift-6.0.3-release/ubuntu2404/swift-6.0.3-RELEASE/swift-6.0.3-RELEASE-ubuntu24.04.tar.gz \\
 && tar -xzf swift-6.0.3-RELEASE-ubuntu24.04.tar.gz -C /usr \\
 && mv /usr/swift-6.0.3-RELEASE-ubuntu24.04 /usr/swift \\
 && rm swift-6.0.3-RELEASE-ubuntu24.04.tar.gz \\
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/swift/usr/bin:$PATH" """,
    'build_steps': """\
COPY Package.swift Package.resolved ./
RUN swift package resolve
COPY Sources ./Sources
COPY Tests ./Tests
RUN swift build -c release
# REPLACE: 'App' in COPY below with your Swift target/product name""",
    'runtime_copy': """\
COPY --from=build --chown=1001:0 /app/.build/release/App /app/app
# REPLACE: App with your executable target name""",
    'runtime_user': "RUN useradd -u 1001 -r app",
},

'scala': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \\
 && curl -fL https://github.com/sbt/sbt/releases/download/v1.10.5/sbt-1.10.5.tgz | tar -xz -C /usr/local \\
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/local/sbt/bin:$PATH" """,
    'build_steps': """\
COPY build.sbt ./
COPY project ./project
RUN sbt update
COPY src ./src
RUN sbt assembly
# REPLACE: if using Play Framework use 'sbt dist' and unzip the zip file""",
    'runtime_copy': """\
COPY --from=build /app/target/scala-*/*-assembly-*.jar app.jar""",
    'runtime_copy_ubi': """\
COPY --from=build /app/target/scala-*/*-assembly-*.jar /deployments/app.jar""",
},

'clojure': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \\
 && curl -fL https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein > /usr/local/bin/lein \\
 && chmod +x /usr/local/bin/lein \\
 && lein version \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY project.clj ./
RUN lein deps
COPY src ./src
COPY resources ./resources
RUN lein uberjar""",
    'runtime_copy': """\
COPY --from=build /app/target/*-standalone.jar app.jar""",
    'runtime_copy_ubi': """\
COPY --from=build /app/target/*-standalone.jar /deployments/app.jar""",
},

'cpp': {
    'build_setup': """\
RUN apt-get update && apt-get install -y --no-install-recommends cmake clang libssl-dev zlib1g-dev \\
    libjsoncpp-dev uuid-dev libpq-dev libbrotli-dev \\
 && rm -rf /var/lib/apt/lists/*""",
    'build_steps': """\
COPY CMakeLists.txt ./
COPY src ./src
COPY include ./include
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++ \\
 && cmake --build build --parallel $(nproc)
# REPLACE: binary name 'app' below with your CMake target name""",
    'runtime_copy_debian': """\
COPY --from=build /app/build/app /usr/local/bin/app""",
    'runtime_copy_ubi': """\
COPY --from=build /app/build/app /usr/local/bin/app""",
    'runtime_deps': """\
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 zlib1g libjsoncpp25 \\
 && rm -rf /var/lib/apt/lists/*""",
},

}

# ─── DOCKERFILE GENERATORS ───────────────────────────────────────────────

def df_cionly(fw):
    artifact_map = {
        'mobile-js': 'APK (Android) / IPA (iOS)',
        'flutter': 'APK (Android) / IPA (iOS) / AppBundle',
        'dotnet-mobile': 'APK (Android) / IPA (iOS) / MSIX (Windows)',
        'android-native': 'APK / AAB (Android App Bundle)',
        'ios-native': 'IPA (iOS archive)',
        'edge': 'edge bundle (Cloudflare Worker / Vercel Edge Function)',
    }
    artifact = artifact_map.get(fw['lang'], 'platform artifact')
    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   CI-only — no Docker image is built for this framework.
# Output:    {artifact}
#
# This framework produces a native platform artifact, not a container image.
# The workflow YAML (workflow-templates/{fw['slug']}.yml) handles the build
# entirely within GitHub Actions runners — no Dockerfile is required.
#
# If you need to wrap the artifact in a container (e.g. for internal testing
# infrastructure), use a base image such as debian:12-slim and COPY the
# artifact in. That is non-standard and not covered by the pipeline templates.
# ─────────────────────────────────────────────────────────────────────────
"""

def df_nodejs_node(fw):
    lang = LANG['nodejs-node']
    port = fw['port']
    cmd_arg = fw['cmd'].replace('node ', '').strip() if fw['cmd'] else 'dist/index.js'
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')
    fips_block = f"""
# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /app
{lang['runtime_user_ubi']}
{lang['runtime_copy']}
USER 1001
EXPOSE {port}
CMD ["node", "{cmd_arg}"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Node.js 22 installed)
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A — no dedicated FIPS variant'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user_alpine']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
CMD ["node", "{cmd_arg}"]
{fips_block}"""

def df_nodejs_nginx(fw):
    lang = LANG['nodejs-nginx']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')
    static_dir = lang['static_dir']
    # Adjust for Eleventy (_site) and Gatsby/Hugo (public)
    if fw['lang'] == 'hugo':
        static_dir = 'public'
    elif fw['slug'] == '03-eleventy':
        static_dir = '_site'
    elif fw['slug'] == '03-gatsby':
        static_dir = 'public'
    elif fw['slug'] == '02-angular':
        static_dir = 'dist/browser'

    fips_block = f"""
# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
COPY --from=build /app/{static_dir} /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
""" if fips_rt else ""

    build_setup = LANG['hugo']['build_setup'] if fw['lang'] == 'hugo' else lang['build_setup']
    build_steps = LANG['hugo']['build_steps'] if fw['lang'] == 'hugo' else lang['build_steps']

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker (build → static → nginx)
# Build:     ubuntu:24.04
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A — no dedicated FIPS variant'}
# Port:      {fw['port']}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{build_setup}
WORKDIR /app
{build_steps}

# ── Runtime stage (standard — nginx serves static assets) ─────────────────
FROM {fw['runtime']} AS runtime
COPY --from=build /app/{static_dir} /usr/share/nginx/html
# Optional: COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE {fw['port']}
CMD ["nginx", "-g", "daemon off;"]
{fips_block}"""

def df_python(fw):
    lang = LANG['python']
    port = fw['port']
    cmd = fw['cmd']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    cmd_parts = cmd.split()
    cmd_json = '["' + '", "'.join(cmd_parts) + '"]'
    fips_cmd_json = '["/venv/bin/' + cmd_parts[0] + '"' + (', ' + ', '.join('"' + p + '"' for p in cmd_parts[1:]) if len(cmd_parts) > 1 else '') + ']'

    fips_block = f"""
# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /app
{lang['runtime_user_ubi']}
{lang['runtime_copy']}
{lang['env']}
USER 1001
EXPOSE {port}
CMD {fips_cmd_json}
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Python 3.12 + venv)
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A — no dedicated FIPS variant'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user_slim']}
{lang['runtime_copy']}
{lang['env']}
USER 1001
EXPOSE {port}
CMD {cmd_json}
{fips_block}"""

def df_go(fw):
    lang = LANG['go']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["/usr/local/bin/app"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker (statically linked binary → scratch)
# Build:     ubuntu:24.04 (Go 1.23 + musl via CGO_ENABLED=0)
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — scratch, zero attack surface) ───────────────
FROM {fw['runtime']} AS runtime
{lang['runtime_copy_scratch']}
USER 65534:65534
EXPOSE {port}
ENTRYPOINT ["/app"]
{fips_block}"""

def df_java(fw):
    lang = LANG['java']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /deployments
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Maven + OpenJDK 21)
# Runtime:   {fw['runtime']} (distroless — no shell, minimal attack surface)
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_copy']}
USER 65534:65534
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
{fips_block}"""

def df_kotlin(fw):
    lang = LANG['kotlin']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /deployments
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Gradle + OpenJDK 21)
# Runtime:   {fw['runtime']} (distroless)
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_copy']}
USER 65534:65534
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
{fips_block}"""

def df_dotnet(fw):
    lang = LANG['dotnet']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (Mariner 2.0 FIPS-compliant .NET) ─────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
# REPLACE: App.dll with your assembly name
ENTRYPOINT ["dotnet", "App.dll"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (.NET SDK 9.0)
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
# REPLACE: App.dll with your assembly name (project name without extension)
ENTRYPOINT ["dotnet", "App.dll"]
{fips_block}"""

def df_rust(fw):
    lang = LANG['rust']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["/usr/local/bin/app"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker (musl static binary → scratch)
# Build:     ubuntu:24.04 (rustup + musl target)
# Runtime:   {fw['runtime']} (zero attack surface — no OS, no shell)
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — scratch) ────────────────────────────────────
FROM {fw['runtime']} AS runtime
{lang['runtime_copy_scratch']}
USER 65534:65534
EXPOSE {port}
ENTRYPOINT ["/app"]
{fips_block}"""

def df_elixir(fw):
    lang = LANG['elixir']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (UBI9 minimal) ────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
# REPLACE: myapp with your OTP release name
CMD ["bin/myapp", "start"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker (mix release)
# Build:     ubuntu:24.04 (Erlang + Elixir)
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
# REPLACE: myapp with your OTP release name (from mix.exs :app key)
CMD ["bin/myapp", "start"]
{fips_block}"""

def df_ruby(fw):
    lang = LANG['ruby']
    port = fw['port']
    cmd = fw['cmd']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')
    cmd_parts = cmd.split()
    cmd_json = '["' + '", "'.join(cmd_parts) + '"]'

    fips_block = f"""
# ── Runtime — FIPS (UBI9 ruby-32) ────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /app
{lang['runtime_user_ubi']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
CMD {cmd_json}
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Ruby + Bundler)
# Runtime:   {fw['runtime']}
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user_alpine']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
CMD {cmd_json}
{fips_block}"""

def df_php(fw):
    lang = LANG['php']
    port = fw['port']
    comment = fw.get('comment', '')

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (PHP 8.3 + Composer)
# Runtime:   {fw['runtime']} (php-fpm on port {port})
# FIPS:      N/A — no dedicated FIPS variant for PHP; use Alpine FIPS kernel
# Port:      {port} (php-fpm — pair with an nginx sidecar for HTTP port 80/443)
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — php-fpm) ────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
RUN apk add --no-cache php83-pdo php83-pdo_mysql php83-opcache
{lang['runtime_copy']}
{lang['runtime_user']}
EXPOSE {port}
CMD ["php-fpm", "-F"]
"""

def df_swift(fw):
    lang = LANG['swift-server']
    port = fw['port']
    comment = fw.get('comment', '')

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Swift 6.0.3)
# Runtime:   {fw['runtime']}
# FIPS:      N/A — no dedicated FIPS variant for Swift Server
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
# REPLACE: /app/app with your Swift target binary name
ENTRYPOINT ["/app/app", "--hostname", "0.0.0.0", "--port", "{port}"]
"""

def df_scala(fw):
    lang = LANG['scala']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /deployments
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (sbt + OpenJDK 21)
# Runtime:   {fw['runtime']} (distroless)
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_copy']}
USER 65534:65534
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
{fips_block}"""

def df_clojure(fw):
    lang = LANG['clojure']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM {fips_rt} AS runtime-fips
WORKDIR /deployments
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Leiningen + OpenJDK 21)
# Runtime:   {fw['runtime']} (distroless)
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_copy']}
USER 65534:65534
EXPOSE {port}
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
{fips_block}"""

def df_deno(fw):
    lang = LANG['deno']
    port = fw['port']
    cmd = fw.get('cmd', 'deno task start')
    comment = fw.get('comment', '')

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Deno 2.3 installed)
# Runtime:   {fw['runtime']}
# FIPS:      N/A — no dedicated FIPS variant for Deno
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
EXPOSE {port}
# Deno permissions: add --allow-net --allow-read etc. as needed
CMD ["deno", "task", "start"]
"""

def df_bun(fw):
    lang = LANG['bun']
    port = fw['port']
    cmd = fw.get('cmd', 'bun run dist/index.js')
    comment = fw.get('comment', '')
    cmd_parts = cmd.split()
    cmd_json = '["' + '", "'.join(cmd_parts) + '"]'

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Bun 1.x installed)
# Runtime:   {fw['runtime']}
# FIPS:      N/A — no dedicated FIPS variant for Bun
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM {fw['runtime']} AS runtime
WORKDIR /app
{lang['runtime_user']}
{lang['runtime_copy']}
USER app
EXPOSE {port}
CMD {cmd_json}
"""

def df_cpp(fw):
    lang = LANG['cpp']
    port = fw['port']
    fips_rt = fw.get('fips_rt')
    comment = fw.get('comment', '')

    fips_block = f"""
# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM {fips_rt} AS runtime-fips
{lang['runtime_copy_ubi']}
USER 1001
EXPOSE {port}
ENTRYPOINT ["/usr/local/bin/app"]
""" if fips_rt else ""

    return f"""\
# ─────────────────────────────────────────────────────────────────────────
# Framework: {fw['cat']} — {fw['name']} {fw['ver']}
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (CMake + Clang + dependencies)
# Runtime:   {fw['runtime']} (debian slim — shared libs required)
# FIPS:      {fips_rt or 'N/A'}
# Port:      {port}
{comment}
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
{lang['build_setup']}
WORKDIR /app
{lang['build_steps']}

# ── Runtime stage (standard — debian:12-slim with shared libs) ────────────
FROM {fw['runtime']} AS runtime
{lang['runtime_deps']}
RUN useradd -u 1001 -r app
{lang['runtime_copy_debian']}
USER app
EXPOSE {port}
ENTRYPOINT ["/usr/local/bin/app"]
{fips_block}"""

# ─── DISPATCH ────────────────────────────────────────────────────────────

LANG_DISPATCH = {
    'nodejs-node': df_nodejs_node,
    'nodejs-nginx': df_nodejs_nginx,
    'hugo':         lambda fw: df_nodejs_nginx(fw),  # hugo reuses nginx pattern
    'deno':         df_deno,
    'bun':          df_bun,
    'python':       df_python,
    'go':           df_go,
    'java':         df_java,
    'kotlin':       df_kotlin,
    'dotnet':       df_dotnet,
    'rust':         df_rust,
    'elixir':       df_elixir,
    'ruby':         df_ruby,
    'php':          df_php,
    'swift-server': df_swift,
    'scala':        df_scala,
    'clojure':      df_clojure,
    'cpp':          df_cpp,
    # CI-only groups
    'mobile-js':    df_cionly,
    'flutter':      df_cionly,
    'dotnet-mobile':df_cionly,
    'android-native':df_cionly,
    'ios-native':   df_cionly,
    'edge':         df_cionly,
}

def build_dockerfile(fw):
    if fw['pattern'] == 'ci-only':
        return df_cionly(fw)
    fn = LANG_DISPATCH.get(fw['lang'])
    if fn is None:
        return df_cionly(fw)
    return fn(fw)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    out_dir = os.path.join(repo_root, 'dockerfiles')
    os.makedirs(out_dir, exist_ok=True)

    count = 0
    for fw in FRAMEWORKS:
        content = build_dockerfile(fw)
        filename = f"{fw['slug']}.dockerfile"
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        count += 1

    print(f"Generated {count} Dockerfiles → {out_dir}")

if __name__ == '__main__':
    main()
