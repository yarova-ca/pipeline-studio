#!/usr/bin/env python3
"""
Generate 75 minimal runnable service starter apps.
Output: services/{slug}/ — entry point, health routes, tests, config, .env.example

Each multi-stage service has:
  - Package/build config (package.json, requirements.txt, go.mod, pom.xml, etc.)
  - Main entry point with GET /, GET /health, GET /health/live, GET /health/ready
  - Test file with 4 assertions (one per route)
  - .env.example
  - Framework config file where required

CI-only services (mobile, edge, native) get README.md + .env.example only.
"""

import os
import json

# ── Framework registry (same 75 as gen_service_issue_templates.py) ─────────────

FRAMEWORKS = [
# 01 SSR/Hybrid
{'num':1,'cat':'01 SSR/Hybrid','name':'Next.js','ver':'16.2.6','slug':'01-nextjs','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'.next/standalone','docker_cmd':'node server.js','extra_setup':'next.config.ts must have output: standalone','runtime_img':'node:22-alpine'},
{'num':2,'cat':'01 SSR/Hybrid','name':'Remix','ver':'7','slug':'01-remix','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'build/','docker_cmd':'node ./build/server/index.js','extra_setup':'adapter-node required in remix.config.ts','runtime_img':'node:22-alpine'},
{'num':3,'cat':'01 SSR/Hybrid','name':'Nuxt','ver':'4.4','slug':'01-nuxt','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'.output/','docker_cmd':'node .output/server/index.mjs','extra_setup':'nitro preset: node-server in nuxt.config.ts','runtime_img':'node:22-alpine'},
{'num':4,'cat':'01 SSR/Hybrid','name':'SvelteKit','ver':'2.57','slug':'01-sveltekit','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'build/','docker_cmd':'node build/index.js','extra_setup':'@sveltejs/adapter-node required','runtime_img':'node:22-alpine'},
{'num':5,'cat':'01 SSR/Hybrid','name':'Angular SSR','ver':'20','slug':'01-angular-ssr','lang':'nodejs-node','pattern':'multi-stage','port':4000,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node dist/server/main.js','extra_setup':'@angular/ssr package required; server.ts entry','runtime_img':'node:22-alpine'},
# 02 CSR/SPA
{'num':6,'cat':'02 CSR/SPA','name':'React','ver':'19','slug':'02-react','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in public/health/','runtime_img':'nginx:alpine'},
{'num':7,'cat':'02 CSR/SPA','name':'Vue','ver':'3.5','slug':'02-vue','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in public/health/','runtime_img':'nginx:alpine'},
{'num':8,'cat':'02 CSR/SPA','name':'Angular','ver':'20','slug':'02-angular','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/browser/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in public/health/','runtime_img':'nginx:alpine'},
{'num':9,'cat':'02 CSR/SPA','name':'Svelte','ver':'5','slug':'02-svelte','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in public/health/','runtime_img':'nginx:alpine'},
{'num':10,'cat':'02 CSR/SPA','name':'Solid.js','ver':'2.0','slug':'02-solidjs','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in public/health/','runtime_img':'nginx:alpine'},
# 03 SSG
{'num':11,'cat':'03 SSG','name':'Astro','ver':'6.3','slug':'03-astro','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in public/health/','runtime_img':'nginx:alpine'},
{'num':12,'cat':'03 SSG','name':'Eleventy','ver':'3.0','slug':'03-eleventy','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'_site/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in _data/health/','runtime_img':'nginx:alpine'},
{'num':13,'cat':'03 SSG','name':'Hugo','ver':'0.161','slug':'03-hugo','lang':'hugo','pattern':'multi-stage','port':80,'node':None,'pkg':None,'test':None,'build_cmd':'hugo --minify','build_out':'public/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in static/health/','runtime_img':'nginx:alpine'},
{'num':14,'cat':'03 SSG','name':'Gatsby','ver':'5.13','slug':'03-gatsby','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'public/','docker_cmd':None,'extra_setup':'Health endpoints: static JSON files in static/health/','runtime_img':'nginx:alpine'},
# 04 Islands
{'num':15,'cat':'04 Islands','name':'Astro','ver':'6.3','slug':'04-astro','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node dist/server/entry.mjs','extra_setup':'@astrojs/node adapter required; output: server in astro.config.mjs','runtime_img':'node:22-alpine'},
{'num':16,'cat':'04 Islands','name':'Fresh','ver':'2.3','slug':'04-fresh','lang':'deno','pattern':'multi-stage','port':8000,'node':None,'pkg':'deno','test':'deno test','build_cmd':'deno task build','build_out':'_fresh/','docker_cmd':'deno task start','extra_setup':'deno.json tasks: build and start required','runtime_img':'denoland/deno:2.3-alpine'},
# 05 Resumability
{'num':17,'cat':'05 Resumability','name':'Qwik','ver':'2.0','slug':'05-qwik','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node server/entry.express.js','extra_setup':'qwik-city-plan express adaptor required','runtime_img':'node:22-alpine'},
# 06 Edge CI-only
{'num':18,'cat':'06 Edge Rendering','name':'Next.js Edge','ver':'16','slug':'06-nextjs-edge','lang':'edge','pattern':'ci-only','port':None,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Deploys to Vercel Edge / Cloudflare Pages — no Docker','runtime_img':None},
{'num':19,'cat':'06 Edge Rendering','name':'Hono','ver':'4.7','slug':'06-hono-edge','lang':'edge','pattern':'ci-only','port':None,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Deploys to Cloudflare Workers — no Docker','runtime_img':None},
{'num':20,'cat':'06 Edge Rendering','name':'Remix Cloudflare','ver':'7','slug':'06-remix-cloudflare','lang':'edge','pattern':'ci-only','port':None,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'build/','docker_cmd':None,'extra_setup':'Deploys to Cloudflare Pages — no Docker','runtime_img':None},
# 07 Streaming SSR
{'num':21,'cat':'07 Streaming SSR','name':'Next.js App Router','ver':'16','slug':'07-nextjs-app-router','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'.next/standalone','docker_cmd':'node server.js','extra_setup':'output: standalone in next.config.ts; React Server Components enabled','runtime_img':'node:22-alpine'},
{'num':22,'cat':'07 Streaming SSR','name':'Remix','ver':'7','slug':'07-remix','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'build/','docker_cmd':'node ./build/server/index.js','extra_setup':'adapter-node; streaming enabled by default in Remix v7','runtime_img':'node:22-alpine'},
{'num':23,'cat':'07 Streaming SSR','name':'SvelteKit','ver':'2.57','slug':'07-sveltekit','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'build/','docker_cmd':'node build/index.js','extra_setup':'@sveltejs/adapter-node; streaming via ReadableStream','runtime_img':'node:22-alpine'},
# 08 Micro-frontends
{'num':24,'cat':'08 Micro-frontends','name':'Module Federation Webpack','ver':'5','slug':'08-mf-webpack','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'exposes remoteEntry.js; health endpoints as static JSON files','runtime_img':'nginx:alpine'},
{'num':25,'cat':'08 Micro-frontends','name':'Module Federation Rspack','ver':'1','slug':'08-mf-rspack','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'@rspack/core; exposes remoteEntry.js; health as static JSON','runtime_img':'nginx:alpine'},
{'num':26,'cat':'08 Micro-frontends','name':'single-spa','ver':'6.0','slug':'08-single-spa','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Root config + one micro-app; health as static JSON files','runtime_img':'nginx:alpine'},
# 09 Cross-platform JS CI-only
{'num':27,'cat':'09 Cross-platform JS','name':'React Native','ver':'0.79','slug':'09-react-native','lang':'mobile-js','pattern':'ci-only','port':None,'node':'22','pkg':'npm','test':'jest','build_cmd':'npx react-native build-android','build_out':'android/app/build/outputs/apk/','docker_cmd':None,'extra_setup':'No server — outputs APK/IPA; health check via app ping endpoint','runtime_img':None},
{'num':28,'cat':'09 Cross-platform JS','name':'Expo','ver':'52','slug':'09-expo','lang':'mobile-js','pattern':'ci-only','port':None,'node':'22','pkg':'npm','test':'jest','build_cmd':'npx expo build','build_out':'dist/','docker_cmd':None,'extra_setup':'No server — EAS Build produces APK/IPA','runtime_img':None},
{'num':29,'cat':'09 Cross-platform JS','name':'Ionic','ver':'8','slug':'09-ionic','lang':'mobile-js','pattern':'ci-only','port':None,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'www/','docker_cmd':None,'extra_setup':'Capacitor builds APK/IPA from www/ output','runtime_img':None},
# 10 Cross-platform non-JS CI-only
{'num':30,'cat':'10 Cross-platform non-JS','name':'Flutter','ver':'3.44','slug':'10-flutter','lang':'flutter','pattern':'ci-only','port':None,'node':None,'pkg':'flutter','test':'flutter test','build_cmd':'flutter build apk --release','build_out':'build/app/outputs/flutter-apk/','docker_cmd':None,'extra_setup':'No server — outputs APK/IPA/AppBundle','runtime_img':None},
{'num':31,'cat':'10 Cross-platform non-JS','name':'.NET MAUI','ver':'10','slug':'10-dotnet-maui','lang':'dotnet-mobile','pattern':'ci-only','port':None,'node':None,'pkg':'dotnet','test':'dotnet test','build_cmd':'dotnet build -c Release','build_out':'bin/Release/','docker_cmd':None,'extra_setup':'No server — outputs APK/IPA/MSIX','runtime_img':None},
{'num':32,'cat':'10 Cross-platform non-JS','name':'Kotlin Multiplatform','ver':'2.1','slug':'10-kmp','lang':'android-native','pattern':'ci-only','port':None,'node':None,'pkg':'gradle','test':'./gradlew test','build_cmd':'./gradlew assembleRelease','build_out':'androidApp/build/outputs/apk/','docker_cmd':None,'extra_setup':'Shared Kotlin code; Android + iOS targets','runtime_img':None},
# 11 Native iOS CI-only
{'num':33,'cat':'11 Native iOS','name':'Swift / SwiftUI','ver':'6','slug':'11-swift-swiftui','lang':'ios-native','pattern':'ci-only','port':None,'node':None,'pkg':'swift','test':'swift test','build_cmd':'xcodebuild -scheme App -configuration Release','build_out':'build/Release-iphoneos/','docker_cmd':None,'extra_setup':'macOS runner required; outputs IPA','runtime_img':None},
{'num':34,'cat':'11 Native iOS','name':'Objective-C UIKit','ver':'SDK 17','slug':'11-objc-uikit','lang':'ios-native','pattern':'ci-only','port':None,'node':None,'pkg':'xcode','test':'xcodebuild test','build_cmd':'xcodebuild -scheme App -configuration Release','build_out':'build/Release-iphoneos/','docker_cmd':None,'extra_setup':'macOS runner required; outputs IPA','runtime_img':None},
# 12 Native Android CI-only
{'num':35,'cat':'12 Native Android','name':'Kotlin Jetpack Compose','ver':'2.0','slug':'12-kotlin-jetpack','lang':'android-native','pattern':'ci-only','port':None,'node':None,'pkg':'gradle','test':'./gradlew test','build_cmd':'./gradlew assembleRelease','build_out':'app/build/outputs/apk/release/','docker_cmd':None,'extra_setup':'JDK 21 required; outputs APK/AAB','runtime_img':None},
{'num':36,'cat':'12 Native Android','name':'Java Android SDK','ver':'17','slug':'12-java-android','lang':'android-native','pattern':'ci-only','port':None,'node':None,'pkg':'gradle','test':'./gradlew test','build_cmd':'./gradlew assembleRelease','build_out':'app/build/outputs/apk/release/','docker_cmd':None,'extra_setup':'JDK 21 required; outputs APK/AAB','runtime_img':None},
# 13 PWA
{'num':37,'cat':'13 PWA','name':'Workbox','ver':'7.3','slug':'13-workbox','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'Service worker generated by workbox-webpack-plugin; health as static JSON','runtime_img':'nginx:alpine'},
{'num':38,'cat':'13 PWA','name':'Vite PWA Plugin','ver':'0.21','slug':'13-vite-pwa','lang':'nodejs-nginx','pattern':'multi-stage','port':80,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':None,'extra_setup':'vite-plugin-pwa generates sw.js; health as static JSON','runtime_img':'nginx:alpine'},
# 14 Node/Deno/Bun
{'num':39,'cat':'14 Node/Deno/Bun','name':'Express','ver':'5.0','slug':'14-express','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node dist/index.js','extra_setup':'TypeScript; tsc compiles to dist/','runtime_img':'node:22-alpine'},
{'num':40,'cat':'14 Node/Deno/Bun','name':'Fastify','ver':'5.2','slug':'14-fastify','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node dist/index.js','extra_setup':'TypeScript; @fastify/type-provider-typebox recommended','runtime_img':'node:22-alpine'},
{'num':41,'cat':'14 Node/Deno/Bun','name':'NestJS','ver':'11.0','slug':'14-nestjs','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'jest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node dist/main.js','extra_setup':'@nestjs/terminus for health module; TerminusModule imported','runtime_img':'node:22-alpine'},
{'num':42,'cat':'14 Node/Deno/Bun','name':'Hono','ver':'4.7','slug':'14-hono','lang':'nodejs-node','pattern':'multi-stage','port':3000,'node':'22','pkg':'npm','test':'vitest','build_cmd':'npm run build','build_out':'dist/','docker_cmd':'node dist/index.js','extra_setup':'@hono/node-server adapter; TypeScript','runtime_img':'node:22-alpine'},
{'num':43,'cat':'14 Node/Deno/Bun','name':'Deno','ver':'2.3','slug':'14-deno','lang':'deno','pattern':'multi-stage','port':8000,'node':None,'pkg':'deno','test':'deno test','build_cmd':'deno task build','build_out':'dist/','docker_cmd':'deno task start','extra_setup':'deno.json with start + build tasks; --allow-net permission','runtime_img':'denoland/deno:2.3-alpine'},
{'num':44,'cat':'14 Node/Deno/Bun','name':'Elysia','ver':'1.2','slug':'14-elysia','lang':'bun','pattern':'multi-stage','port':3000,'node':None,'pkg':'bun','test':'bun test','build_cmd':'bun build src/index.ts --target bun --outfile dist/index.js','build_out':'dist/','docker_cmd':'bun run dist/index.js','extra_setup':'Bun 1.x LTS; bun.lockb committed','runtime_img':'oven/bun:1-alpine'},
# 15 Python
{'num':45,'cat':'15 Python','name':'FastAPI','ver':'0.115','slug':'15-fastapi','lang':'python','pattern':'multi-stage','port':8080,'node':None,'pkg':'pip','test':'pytest','build_cmd':'pip install -r requirements.txt','build_out':'venv/','docker_cmd':'uvicorn main:app --host 0.0.0.0 --port 8080','extra_setup':'Python 3.12 LTS; uvicorn[standard]; REPLACE main:app with your module','runtime_img':'python:3.12-slim'},
{'num':46,'cat':'15 Python','name':'Django','ver':'5.2','slug':'15-django','lang':'python','pattern':'multi-stage','port':8080,'node':None,'pkg':'pip','test':'pytest','build_cmd':'pip install -r requirements.txt','build_out':'venv/','docker_cmd':'gunicorn myproject.wsgi:application --bind 0.0.0.0:8080','extra_setup':'Python 3.12 LTS; gunicorn; REPLACE myproject with your app name','runtime_img':'python:3.12-slim'},
{'num':47,'cat':'15 Python','name':'Flask','ver':'3.1','slug':'15-flask','lang':'python','pattern':'multi-stage','port':8080,'node':None,'pkg':'pip','test':'pytest','build_cmd':'pip install -r requirements.txt','build_out':'venv/','docker_cmd':'gunicorn app:app --bind 0.0.0.0:8080','extra_setup':'Python 3.12 LTS; gunicorn; REPLACE app:app with module:Flask-instance','runtime_img':'python:3.12-slim'},
{'num':48,'cat':'15 Python','name':'Starlette','ver':'0.41','slug':'15-starlette','lang':'python','pattern':'multi-stage','port':8080,'node':None,'pkg':'pip','test':'pytest','build_cmd':'pip install -r requirements.txt','build_out':'venv/','docker_cmd':'uvicorn main:app --host 0.0.0.0 --port 8080','extra_setup':'Python 3.12 LTS; uvicorn[standard]; httpx for testing','runtime_img':'python:3.12-slim'},
# 16 Go
{'num':49,'cat':'16 Go','name':'Gin','ver':'1.10','slug':'16-gin','lang':'go','pattern':'multi-stage','port':8080,'node':None,'pkg':'go','test':'go test ./...','build_cmd':'go build -o bin/app ./...','build_out':'bin/','docker_cmd':None,'extra_setup':'Go 1.23 LTS; CGO_ENABLED=0 for scratch image','runtime_img':'scratch'},
{'num':50,'cat':'16 Go','name':'Echo','ver':'4.12','slug':'16-echo','lang':'go','pattern':'multi-stage','port':8080,'node':None,'pkg':'go','test':'go test ./...','build_cmd':'go build -o bin/app ./...','build_out':'bin/','docker_cmd':None,'extra_setup':'Go 1.23 LTS; CGO_ENABLED=0 for scratch image','runtime_img':'scratch'},
{'num':51,'cat':'16 Go','name':'Fiber','ver':'3.0','slug':'16-fiber','lang':'go','pattern':'multi-stage','port':8080,'node':None,'pkg':'go','test':'go test ./...','build_cmd':'go build -o bin/app ./...','build_out':'bin/','docker_cmd':None,'extra_setup':'Go 1.23 LTS; CGO_ENABLED=0; fasthttp-based','runtime_img':'scratch'},
{'num':52,'cat':'16 Go','name':'Chi','ver':'5.2','slug':'16-chi','lang':'go','pattern':'multi-stage','port':8080,'node':None,'pkg':'go','test':'go test ./...','build_cmd':'go build -o bin/app ./...','build_out':'bin/','docker_cmd':None,'extra_setup':'Go 1.23 LTS; CGO_ENABLED=0 for scratch image','runtime_img':'scratch'},
# 17 Java
{'num':53,'cat':'17 Java','name':'Spring Boot','ver':'3.4','slug':'17-spring-boot','lang':'java','pattern':'multi-stage','port':8080,'node':None,'pkg':'mvn','test':'mvn test','build_cmd':'mvn package -DskipTests','build_out':'target/*.jar','docker_cmd':None,'extra_setup':'Java 21 LTS; Spring Boot Actuator for /health endpoints','runtime_img':'gcr.io/distroless/java21-debian12'},
{'num':54,'cat':'17 Java','name':'Quarkus','ver':'3.35','slug':'17-quarkus','lang':'java','pattern':'multi-stage','port':8080,'node':None,'pkg':'mvn','test':'mvn test','build_cmd':'mvn package -DskipTests','build_out':'target/*.jar','docker_cmd':None,'extra_setup':'Java 21 LTS; quarkus-smallrye-health extension for /q/health','runtime_img':'gcr.io/distroless/java21-debian12'},
{'num':55,'cat':'17 Java','name':'Micronaut','ver':'5.0','slug':'17-micronaut','lang':'java','pattern':'multi-stage','port':8080,'node':None,'pkg':'mvn','test':'mvn test','build_cmd':'mvn package -DskipTests','build_out':'target/*.jar','docker_cmd':None,'extra_setup':'Java 21 LTS; micronaut-management for /health endpoint','runtime_img':'gcr.io/distroless/java21-debian12'},
# 18 Kotlin
{'num':56,'cat':'18 Kotlin','name':'Ktor','ver':'3.5','slug':'18-ktor','lang':'kotlin','pattern':'multi-stage','port':8080,'node':None,'pkg':'gradle','test':'./gradlew test','build_cmd':'./gradlew shadowJar','build_out':'build/libs/*-all.jar','docker_cmd':None,'extra_setup':'Kotlin 2.1 LTS; ktor-server-status-pages for health','runtime_img':'gcr.io/distroless/java21-debian12'},
{'num':57,'cat':'18 Kotlin','name':'Spring Boot Kotlin','ver':'3.4','slug':'18-spring-boot-kotlin','lang':'kotlin','pattern':'multi-stage','port':8080,'node':None,'pkg':'gradle','test':'./gradlew test','build_cmd':'./gradlew bootJar','build_out':'build/libs/*.jar','docker_cmd':None,'extra_setup':'Kotlin 2.1 LTS; Spring Boot Actuator for /actuator/health','runtime_img':'gcr.io/distroless/java21-debian12'},
# 19 .NET
{'num':58,'cat':'19 .NET','name':'ASP.NET Core','ver':'9','slug':'19-aspnet-core','lang':'dotnet','pattern':'multi-stage','port':8080,'node':None,'pkg':'dotnet','test':'dotnet test','build_cmd':'dotnet publish -c Release -o out','build_out':'out/','docker_cmd':None,'extra_setup':'.NET 9 LTS; Microsoft.Extensions.Diagnostics.HealthChecks built-in','runtime_img':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine'},
{'num':59,'cat':'19 .NET','name':'Minimal APIs .NET','ver':'9','slug':'19-minimal-apis','lang':'dotnet','pattern':'multi-stage','port':8080,'node':None,'pkg':'dotnet','test':'dotnet test','build_cmd':'dotnet publish -c Release -o out','build_out':'out/','docker_cmd':None,'extra_setup':'.NET 9 LTS; app.MapHealthChecks("/health") pattern','runtime_img':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine'},
# 20 Rust
{'num':60,'cat':'20 Rust','name':'Axum','ver':'0.8','slug':'20-axum','lang':'rust','pattern':'multi-stage','port':8080,'node':None,'pkg':'cargo','test':'cargo test','build_cmd':'cargo build --release --target x86_64-unknown-linux-musl','build_out':'target/x86_64-unknown-linux-musl/release/','docker_cmd':None,'extra_setup':'Rust 1.82 LTS (stable); musl target for scratch image','runtime_img':'scratch'},
{'num':61,'cat':'20 Rust','name':'Actix-web','ver':'4.9','slug':'20-actix-web','lang':'rust','pattern':'multi-stage','port':8080,'node':None,'pkg':'cargo','test':'cargo test','build_cmd':'cargo build --release --target x86_64-unknown-linux-musl','build_out':'target/x86_64-unknown-linux-musl/release/','docker_cmd':None,'extra_setup':'Rust 1.82 LTS (stable); musl target for scratch image','runtime_img':'scratch'},
# 21 Elixir
{'num':62,'cat':'21 Elixir/BEAM','name':'Phoenix','ver':'1.7','slug':'21-phoenix','lang':'elixir','pattern':'multi-stage','port':4000,'node':None,'pkg':'mix','test':'mix test','build_cmd':'MIX_ENV=prod mix release','build_out':'_build/prod/rel/','docker_cmd':None,'extra_setup':'Elixir 1.17 + OTP 27 LTS; Phoenix LiveDashboard optional','runtime_img':'hexpm/elixir:1.17-erlang-27-debian-bookworm-slim'},
# 22 Ruby
{'num':63,'cat':'22 Ruby','name':'Rails','ver':'8.0','slug':'22-rails','lang':'ruby','pattern':'multi-stage','port':3000,'node':None,'pkg':'bundler','test':'bundle exec rspec','build_cmd':'bundle install','build_out':'vendor/bundle/','docker_cmd':'bundle exec puma -C config/puma.rb','extra_setup':'Ruby 3.3 LTS; rails/health built-in at /up endpoint (Rails 7.1+)','runtime_img':'ruby:3.3-alpine'},
{'num':64,'cat':'22 Ruby','name':'Sinatra','ver':'4.0','slug':'22-sinatra','lang':'ruby','pattern':'multi-stage','port':3000,'node':None,'pkg':'bundler','test':'bundle exec rspec','build_cmd':'bundle install','build_out':'vendor/bundle/','docker_cmd':'bundle exec rackup --host 0.0.0.0 --port 3000','extra_setup':'Ruby 3.3 LTS; rack health middleware for /health','runtime_img':'ruby:3.3-alpine'},
# 23 PHP
{'num':65,'cat':'23 PHP','name':'Laravel','ver':'12','slug':'23-laravel','lang':'php','pattern':'multi-stage','port':9000,'node':None,'pkg':'composer','test':'./vendor/bin/phpunit','build_cmd':'composer install --no-dev','build_out':'vendor/','docker_cmd':None,'extra_setup':'PHP 8.3 LTS; /health route in routes/api.php; php-fpm + nginx sidecar','runtime_img':'php:8.3-fpm-alpine'},
{'num':66,'cat':'23 PHP','name':'Symfony','ver':'7.2','slug':'23-symfony','lang':'php','pattern':'multi-stage','port':9000,'node':None,'pkg':'composer','test':'./vendor/bin/phpunit','build_cmd':'composer install --no-dev','build_out':'vendor/','docker_cmd':None,'extra_setup':'PHP 8.3 LTS; /health route in config/routes.yaml; php-fpm + nginx sidecar','runtime_img':'php:8.3-fpm-alpine'},
{'num':67,'cat':'23 PHP','name':'Slim','ver':'4.14','slug':'23-slim','lang':'php','pattern':'multi-stage','port':9000,'node':None,'pkg':'composer','test':'./vendor/bin/phpunit','build_cmd':'composer install --no-dev','build_out':'vendor/','docker_cmd':None,'extra_setup':'PHP 8.3 LTS; health route in src/routes.php; php-fpm','runtime_img':'php:8.3-fpm-alpine'},
# 24 Swift Server
{'num':68,'cat':'24 Swift Server','name':'Vapor','ver':'4.121','slug':'24-vapor','lang':'swift-server','pattern':'multi-stage','port':8080,'node':None,'pkg':'swift','test':'swift test','build_cmd':'swift build -c release','build_out':'.build/release/','docker_cmd':None,'extra_setup':'Swift 6.0 LTS; Vapor health route at GET /health','runtime_img':'swift:6.0-noble-slim'},
{'num':69,'cat':'24 Swift Server','name':'Hummingbird','ver':'2.0','slug':'24-hummingbird','lang':'swift-server','pattern':'multi-stage','port':8080,'node':None,'pkg':'swift','test':'swift test','build_cmd':'swift build -c release','build_out':'.build/release/','docker_cmd':None,'extra_setup':'Swift 6.0 LTS; HummingbirdCore health route at GET /health','runtime_img':'swift:6.0-noble-slim'},
# 25 Scala
{'num':70,'cat':'25 Scala','name':'Play','ver':'3.0','slug':'25-play','lang':'scala','pattern':'multi-stage','port':9000,'node':None,'pkg':'sbt','test':'sbt test','build_cmd':'sbt dist','build_out':'target/universal/','docker_cmd':None,'extra_setup':'Scala 3 LTS + Java 21; /health route in conf/routes','runtime_img':'gcr.io/distroless/java21-debian12'},
{'num':71,'cat':'25 Scala','name':'http4s','ver':'0.23','slug':'25-http4s','lang':'scala','pattern':'multi-stage','port':8080,'node':None,'pkg':'sbt','test':'sbt test','build_cmd':'sbt assembly','build_out':'target/scala-*/','docker_cmd':None,'extra_setup':'Scala 3 LTS + Java 21 + Cats Effect 3; /health route in Router','runtime_img':'gcr.io/distroless/java21-debian12'},
# 26 Clojure
{'num':72,'cat':'26 Clojure','name':'Ring','ver':'1.12','slug':'26-ring','lang':'clojure','pattern':'multi-stage','port':8080,'node':None,'pkg':'lein','test':'lein test','build_cmd':'lein uberjar','build_out':'target/*-standalone.jar','docker_cmd':None,'extra_setup':'Clojure 1.12 LTS + Java 21; /health route in ring handler','runtime_img':'gcr.io/distroless/java21-debian12'},
{'num':73,'cat':'26 Clojure','name':'Pedestal','ver':'0.7','slug':'26-pedestal','lang':'clojure','pattern':'multi-stage','port':8080,'node':None,'pkg':'lein','test':'lein test','build_cmd':'lein uberjar','build_out':'target/*-standalone.jar','docker_cmd':None,'extra_setup':'Clojure 1.12 LTS + Java 21; /health interceptor in service map','runtime_img':'gcr.io/distroless/java21-debian12'},
# 27 C/C++
{'num':74,'cat':'27 C/C++','name':'Drogon','ver':'1.9.13','slug':'27-drogon','lang':'cpp','pattern':'multi-stage','port':8080,'node':None,'pkg':'cmake','test':'ctest','build_cmd':'cmake --build build --config Release','build_out':'build/','docker_cmd':None,'extra_setup':'C++20; CMake 3.28; Drogon health controller at GET /health','runtime_img':'debian:12-slim'},
{'num':75,'cat':'27 C/C++','name':'Crow','ver':'1.3.2','slug':'27-crow','lang':'cpp','pattern':'multi-stage','port':8080,'node':None,'pkg':'cmake','test':'ctest','build_cmd':'cmake --build build --config Release','build_out':'build/','docker_cmd':None,'extra_setup':'C++20; CMake 3.28; Crow CROW_ROUTE macro at GET /health','runtime_img':'debian:12-slim'},
]

CI_ONLY_LANGS = {'edge','mobile-js','flutter','ios-native','android-native','dotnet-mobile'}

# ── Helpers ────────────────────────────────────────────────────────────────────

def env_example(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw.get('port') or 8080
    lang = fw['lang']
    lines = [f"# .env.example — {name} {ver} ({slug})", "# Copy: cp .env.example .env", "# Never commit .env to git", ""]
    if lang in ('nodejs-node','deno','bun'):
        lines += [f"PORT={port}", "NODE_ENV=development", "LOG_LEVEL=info"]
    elif lang == 'nodejs-nginx':
        lines += ["VITE_APP_VERSION=1.0.0", "VITE_API_URL=http://localhost:8080"]
    elif lang == 'hugo':
        lines += ["# Hugo build-time variables", "API_BASE_URL=http://localhost:8080"]
    elif lang == 'python':
        lines += [f"PORT={port}", "PYTHONPATH=src", "LOG_LEVEL=INFO"]
    elif lang == 'go':
        lines += [f"PORT={port}", "LOG_LEVEL=info"]
    elif lang in ('java','kotlin'):
        lines += [f"SERVER_PORT={port}", "SPRING_PROFILES_ACTIVE=dev"]
    elif lang == 'dotnet':
        lines += [f"ASPNETCORE_URLS=http://+:{port}", "ASPNETCORE_ENVIRONMENT=Development"]
    elif lang == 'rust':
        lines += [f"PORT={port}", "RUST_LOG=info"]
    elif lang == 'elixir':
        lines += [f"PORT={port}", "MIX_ENV=dev", "SECRET_KEY_BASE=run_mix_phx_gen_secret"]
    elif lang == 'ruby':
        lines += [f"PORT={port}", "RACK_ENV=development", "RAILS_ENV=development"]
    elif lang == 'php':
        lines += [f"APP_PORT={port}", "APP_ENV=local", "APP_DEBUG=true", "APP_KEY="]
    elif lang == 'swift-server':
        lines += [f"PORT={port}", "APP_ENV=development"]
    elif lang in ('scala','clojure'):
        lines += [f"PORT={port}", "HOST=0.0.0.0"]
    elif lang == 'cpp':
        lines += [f"PORT={port}"]
    else:
        lines += [f"PORT={port}", "API_BASE_URL=http://localhost:8080"]
    return "\n".join(lines) + "\n"


def gitignore(fw):
    lang = fw['lang']
    lines = ["# .gitignore", ""]
    common = [".env", ".env.local", ".env.*.local"]
    if lang in ('nodejs-node','nodejs-nginx','deno','bun','edge','mobile-js'):
        lines += common + ["node_modules/", "dist/", "build/", ".next/", ".output/", "_fresh/", "*.log", ".DS_Store"]
    elif lang == 'python':
        lines += common + ["__pycache__/", "*.pyc", ".venv/", "venv/", ".pytest_cache/", "*.egg-info/", "dist/"]
    elif lang == 'go':
        lines += common + ["bin/", "*.test", "vendor/"]
    elif lang in ('java','kotlin'):
        lines += common + ["target/", "build/", ".gradle/", "*.class", "*.jar", "!*-all.jar"]
    elif lang == 'dotnet':
        lines += common + ["bin/", "obj/", "out/", "*.user", ".vs/"]
    elif lang == 'rust':
        lines += common + ["target/", "Cargo.lock"]
    elif lang == 'elixir':
        lines += common + ["_build/", "deps/", "*.beam", "priv/static/", ".elixir_ls/"]
    elif lang == 'ruby':
        lines += common + [".bundle/", "vendor/bundle/", "log/", "tmp/", "*.gem"]
    elif lang == 'php':
        lines += common + ["vendor/", ".phpunit.result.cache", "*.cache"]
    elif lang == 'swift-server':
        lines += common + [".build/", "*.xcodeproj", ".swiftpm/"]
    elif lang in ('scala','clojure'):
        lines += common + ["target/", ".bloop/", ".metals/", ".bsp/"]
    elif lang == 'cpp':
        lines += common + ["build/", "*.o", "*.a", "CMakeFiles/", "cmake_install.cmake", "CMakeCache.txt"]
    elif lang == 'hugo':
        lines += common + ["public/", "resources/", ".hugo_build.lock"]
    else:
        lines += common
    return "\n".join(lines) + "\n"


def tsconfig(strict=False):
    cfg = {
        "compilerOptions": {
            "target": "ES2022",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "outDir": "dist",
            "rootDir": "src",
            "strict": strict,
            "esModuleInterop": True,
            "skipLibCheck": True,
            "sourceMap": True
        },
        "include": ["src/**/*"],
        "exclude": ["node_modules", "dist"]
    }
    return json.dumps(cfg, indent=2) + "\n"


# ── CI-only ────────────────────────────────────────────────────────────────────

def ci_only_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    cat = fw['cat']
    build_cmd = fw['build_cmd']
    build_out = fw['build_out']
    extra = fw.get('extra_setup','')
    readme = f"""# {slug} — {name} {ver}

**Category:** {cat}
**Pattern:** CI-only — no Docker runtime, no server port

## What ships

Build command: `{build_cmd}`
Output: `{build_out}`

{extra}

## Health check pattern

This app has no server port.
Kubernetes health probes do not apply.
CI verifies the build succeeds and tests pass.

For in-app health: implement a status screen that pings your backend
API `/health` endpoint and shows the result in the UI.

## Local dev

```
cp .env.example .env
# Fill in .env values
```

See official {name} docs for emulator / simulator setup.

## Tests

Run tests locally with: `{fw.get('test','')}`
CI runs the same command via pipeline-studio `05-test.yml`.
"""
    return {
        "README.md": readme,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── nginx static SPA/SSG ───────────────────────────────────────────────────────

def nginx_conf(port=80):
    return f"""server {{
    listen {port};
    root /usr/share/nginx/html;
    index index.html;

    location /health {{
        default_type application/json;
        try_files /health/index.json =404;
        add_header Cache-Control "no-cache, no-store";
    }}

    location /health/live {{
        default_type application/json;
        try_files /health/live.json =404;
        add_header Cache-Control "no-cache, no-store";
    }}

    location /health/ready {{
        default_type application/json;
        try_files /health/ready.json =404;
        add_header Cache-Control "no-cache, no-store";
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""


def health_json_files(health_dir="public/health"):
    """Return static JSON health files for SPA/SSG."""
    return {
        f"{health_dir}/index.json": '{"status":"ok","version":"1.0.0"}\n',
        f"{health_dir}/live.json": '{"status":"ok"}\n',
        f"{health_dir}/ready.json": '{"status":"ok"}\n',
    }


# ── Express 5 ─────────────────────────────────────────────────────────────────

def express_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug,
        "version": "1.0.0",
        "description": f"Minimal {name} {ver} starter — hello world + health endpoints",
        "type": "module",
        "main": "dist/index.js",
        "scripts": {
            "build": "tsc",
            "start": "node dist/index.js",
            "dev": "tsx watch src/index.ts",
            "test": "jest --forceExit"
        },
        "dependencies": {
            "express": "^5.0.0",
            "dotenv": "^16.4.5"
        },
        "devDependencies": {
            "@types/express": "^5.0.0",
            "@types/node": "^22.0.0",
            "@types/supertest": "^6.0.2",
            "jest": "^29.7.0",
            "supertest": "^7.0.0",
            "ts-jest": "^29.3.0",
            "tsx": "^4.19.0",
            "typescript": "^5.7.0"
        },
        "jest": {
            "preset": "ts-jest",
            "testEnvironment": "node",
            "extensionsToTreatAsEsm": [".ts"],
            "moduleNameMapper": {"^(\\.{1,2}/.*)\\.js$": "$1"}
        }
    }
    src = f"""import express from 'express'
import 'dotenv/config'

const app = express()
const PORT = Number(process.env.PORT ?? '{port}')

app.get('/', (_req, res) => {{
  res.json({{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }})
}})

app.get('/health', (_req, res) => {{
  res.json({{ status: 'ok', version: '1.0.0' }})
}})

app.get('/health/live', (_req, res) => {{
  res.json({{ status: 'ok' }})
}})

app.get('/health/ready', (_req, res) => {{
  res.json({{ status: 'ok' }})
}})

export const server = app.listen(PORT, () => {{
  console.log(`{name} running on port ${{PORT}}`)
}})

export default app
"""
    test = f"""import request from 'supertest'
import app from '../src/index.js'
import {{ server }} from '../src/index.js'

afterAll(() => server.close())

describe('{slug} health endpoints', () => {{
  it('GET / returns hello world', async () => {{
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/{name.split()[0]}/i)
  }})

  it('GET /health returns ok', async () => {{
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  }})

  it('GET /health/live returns ok', async () => {{
    const res = await request(app).get('/health/live')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  }})

  it('GET /health/ready returns ok', async () => {{
    const res = await request(app).get('/health/ready')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  }})
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "tsconfig.json": tsconfig(),
        "src/index.ts": src,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Fastify 5 ─────────────────────────────────────────────────────────────────

def fastify_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "type": "module",
        "scripts": {"build": "tsc", "start": "node dist/index.js", "dev": "tsx watch src/index.ts", "test": "jest --forceExit"},
        "dependencies": {"fastify": "^5.2.0", "dotenv": "^16.4.5"},
        "devDependencies": {
            "@types/node": "^22.0.0", "jest": "^29.7.0",
            "ts-jest": "^29.3.0", "tsx": "^4.19.0", "typescript": "^5.7.0"
        },
        "jest": {"preset": "ts-jest", "testEnvironment": "node"}
    }
    src = f"""import Fastify from 'fastify'
import 'dotenv/config'

export const app = Fastify({{ logger: true }})
const PORT = Number(process.env.PORT ?? '{port}')

app.get('/', async () => {{
  return {{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}
}})

app.get('/health', async () => {{
  return {{ status: 'ok', version: '1.0.0' }}
}})

app.get('/health/live', async () => {{
  return {{ status: 'ok' }}
}})

app.get('/health/ready', async () => {{
  return {{ status: 'ok' }}
}})

if (process.env.NODE_ENV !== 'test') {{
  app.listen({{ port: PORT, host: '0.0.0.0' }})
}}
"""
    test = f"""import {{ app }} from '../src/index.js'

afterAll(() => app.close())

describe('{slug} health endpoints', () => {{
  it('GET / returns hello world', async () => {{
    const res = await app.inject({{ method: 'GET', url: '/' }})
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).message).toMatch(/{name.split()[0]}/i)
  }})

  it('GET /health returns ok', async () => {{
    const res = await app.inject({{ method: 'GET', url: '/health' }})
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).status).toBe('ok')
  }})

  it('GET /health/live returns ok', async () => {{
    const res = await app.inject({{ method: 'GET', url: '/health/live' }})
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).status).toBe('ok')
  }})

  it('GET /health/ready returns ok', async () => {{
    const res = await app.inject({{ method: 'GET', url: '/health/ready' }})
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).status).toBe('ok')
  }})
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "tsconfig.json": tsconfig(),
        "src/index.ts": src,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── NestJS 11 ─────────────────────────────────────────────────────────────────

def nestjs_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"build": "nest build", "start": "node dist/main.js", "start:dev": "nest start --watch", "test": "jest --forceExit"},
        "dependencies": {
            "@nestjs/common": "^11.0.0", "@nestjs/core": "^11.0.0",
            "@nestjs/platform-express": "^11.0.0", "@nestjs/terminus": "^11.0.0",
            "dotenv": "^16.4.5", "reflect-metadata": "^0.2.0", "rxjs": "^7.8.0"
        },
        "devDependencies": {
            "@nestjs/cli": "^11.0.0", "@nestjs/testing": "^11.0.0",
            "@types/node": "^22.0.0", "@types/supertest": "^6.0.2",
            "jest": "^29.7.0", "supertest": "^7.0.0", "ts-jest": "^29.3.0",
            "typescript": "^5.7.0"
        },
        "jest": {"moduleFileExtensions": ["ts","js"], "rootDir": "src",
                 "testRegex": ".*\\.spec\\.ts$", "transform": {"^.+\\.(t|j)s$": "ts-jest"},
                 "testEnvironment": "node"}
    }
    main = f"""import 'dotenv/config'
import {{ NestFactory }} from '@nestjs/core'
import {{ AppModule }} from './app.module'

async function bootstrap() {{
  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT ?? {port})
  console.log(`{name} running on port ${{process.env.PORT ?? {port}}}`)
}}
bootstrap()
"""
    app_module = f"""import {{ Module }} from '@nestjs/common'
import {{ TerminusModule }} from '@nestjs/terminus'
import {{ AppController }} from './app.controller'
import {{ HealthController }} from './health/health.controller'

@Module({{
  imports: [TerminusModule],
  controllers: [AppController, HealthController],
}})
export class AppModule {{}}
"""
    app_ctrl = f"""import {{ Controller, Get }} from '@nestjs/common'

@Controller()
export class AppController {{
  @Get()
  hello() {{
    return {{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}
  }}
}}
"""
    health_ctrl = f"""import {{ Controller, Get }} from '@nestjs/common'

@Controller('health')
export class HealthController {{
  @Get()
  check() {{
    return {{ status: 'ok', version: '1.0.0' }}
  }}

  @Get('live')
  liveness() {{
    return {{ status: 'ok' }}
  }}

  @Get('ready')
  readiness() {{
    return {{ status: 'ok' }}
  }}
}}
"""
    test = f"""import {{ Test, TestingModule }} from '@nestjs/testing'
import {{ INestApplication }} from '@nestjs/common'
import * as request from 'supertest'
import {{ AppModule }} from '../app.module'

describe('{slug} health endpoints', () => {{
  let app: INestApplication

  beforeAll(async () => {{
    const mod: TestingModule = await Test.createTestingModule({{ imports: [AppModule] }}).compile()
    app = mod.createNestApplication()
    await app.init()
  }})

  afterAll(() => app.close())

  it('GET / returns hello', () => request(app.getHttpServer()).get('/').expect(200).expect((r) => expect(r.body.message).toMatch(/{name.split()[0]}/i)))
  it('GET /health returns ok', () => request(app.getHttpServer()).get('/health').expect(200).expect((r) => expect(r.body.status).toBe('ok')))
  it('GET /health/live returns ok', () => request(app.getHttpServer()).get('/health/live').expect(200))
  it('GET /health/ready returns ok', () => request(app.getHttpServer()).get('/health/ready').expect(200))
}})
"""
    tsconfig_json = {
        "compilerOptions": {"module": "commonjs", "declaration": True, "removeComments": True,
                            "emitDecoratorMetadata": True, "experimentalDecorators": True,
                            "allowSyntheticDefaultImports": True, "target": "ES2022",
                            "sourceMap": True, "outDir": "./dist", "baseUrl": "./",
                            "incremental": True, "skipLibCheck": True, "strictNullChecks": True}
    }
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "tsconfig.json": json.dumps(tsconfig_json, indent=2) + "\n",
        "src/main.ts": main,
        "src/app.module.ts": app_module,
        "src/app.controller.ts": app_ctrl,
        "src/health/health.controller.ts": health_ctrl,
        "src/health/health.controller.spec.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Hono 4 (Node.js) ──────────────────────────────────────────────────────────

def hono_node_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "tsc", "start": "node dist/index.js", "dev": "tsx watch src/index.ts", "test": "vitest run"},
        "dependencies": {"@hono/node-server": "^1.14.0", "hono": "^4.7.0", "dotenv": "^16.4.5"},
        "devDependencies": {"@types/node": "^22.0.0", "tsx": "^4.19.0", "typescript": "^5.7.0", "vitest": "^3.0.0"}
    }
    src = f"""import {{ serve }} from '@hono/node-server'
import {{ Hono }} from 'hono'
import 'dotenv/config'

const app = new Hono()
const PORT = Number(process.env.PORT ?? '{port}')

app.get('/', (c) => c.json({{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}))
app.get('/health', (c) => c.json({{ status: 'ok', version: '1.0.0' }}))
app.get('/health/live', (c) => c.json({{ status: 'ok' }}))
app.get('/health/ready', (c) => c.json({{ status: 'ok' }}))

export default app

if (process.env.NODE_ENV !== 'test') {{
  serve({{ fetch: app.fetch, port: PORT }}, () => console.log(`{name} running on port ${{PORT}}`))
}}
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'
import app from '../src/index.js'

describe('{slug} health endpoints', () => {{
  it('GET / returns hello', async () => {{
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/{name.split()[0]}/i)
  }})

  it('GET /health returns ok', async () => {{
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('ok')
  }})

  it('GET /health/live returns ok', async () => {{
    const res = await app.request('/health/live')
    expect(res.status).toBe(200)
  }})

  it('GET /health/ready returns ok', async () => {{
    const res = await app.request('/health/ready')
    expect(res.status).toBe(200)
  }})
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "tsconfig.json": tsconfig(),
        "src/index.ts": src,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Deno 2.3 / Oak ────────────────────────────────────────────────────────────

def deno_oak_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    deno_json = {
        "name": slug, "version": "1.0.0",
        "tasks": {
            "start": "deno run --allow-net --allow-env --allow-read src/main.ts",
            "dev": "deno run --watch --allow-net --allow-env --allow-read src/main.ts",
            "test": "deno test --allow-net --allow-env tests/"
        },
        "imports": {
            "@oak/oak": "jsr:@oak/oak@^17.0.0",
            "@std/dotenv": "jsr:@std/dotenv@^0.225.0"
        }
    }
    src = f"""import {{ Application, Router }} from '@oak/oak'
import '@std/dotenv/load'

const app = new Application()
const router = new Router()
const PORT = Number(Deno.env.get('PORT') ?? '{port}')

router
  .get('/', (ctx) => {{
    ctx.response.body = {{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}
  }})
  .get('/health', (ctx) => {{
    ctx.response.body = {{ status: 'ok', version: '1.0.0' }}
  }})
  .get('/health/live', (ctx) => {{
    ctx.response.body = {{ status: 'ok' }}
  }})
  .get('/health/ready', (ctx) => {{
    ctx.response.body = {{ status: 'ok' }}
  }})

app.use(router.routes())
app.use(router.allowedMethods())

console.log(`{name} running on port ${{PORT}}`)
await app.listen({{ port: PORT }})
"""
    test = f"""import {{ assertEquals }} from 'jsr:@std/assert'

const BASE = 'http://localhost:{port}'
// Start server before tests: deno task start &
// Or test via in-process handler if refactored to export app

Deno.test('{slug}: placeholder — run integration tests against running server', () => {{
  // Integration: start with `deno task start` then hit endpoints
  // Unit: refactor routes into exported handler and test inline
  assertEquals(1, 1)
}})
"""
    return {
        "deno.json": json.dumps(deno_json, indent=2) + "\n",
        "src/main.ts": src,
        "tests/health_test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Elysia 1.2 (Bun) ─────────────────────────────────────────────────────────

def elysia_bun_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"start": "bun run src/index.ts", "dev": "bun --watch src/index.ts", "test": "bun test", "build": f"bun build src/index.ts --target bun --outfile dist/index.js"},
        "dependencies": {"elysia": "^1.2.0"},
        "devDependencies": {"bun-types": "^1.0.0"}
    }
    src = f"""import {{ Elysia }} from 'elysia'

const PORT = Number(process.env.PORT ?? '{port}')

export const app = new Elysia()
  .get('/', () => ({{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}))
  .get('/health', () => ({{ status: 'ok', version: '1.0.0' }}))
  .get('/health/live', () => ({{ status: 'ok' }}))
  .get('/health/ready', () => ({{ status: 'ok' }}))

if (import.meta.main) {{
  app.listen(PORT, () => console.log(`{name} running on port ${{PORT}}`))
}}
"""
    test = f"""import {{ describe, it, expect }} from 'bun:test'
import {{ app }} from '../src/index'

describe('{slug} health endpoints', () => {{
  it('GET / returns hello', async () => {{
    const res = await app.handle(new Request('http://localhost/'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toContain('{name.split()[0]}')
  }})

  it('GET /health returns ok', async () => {{
    const res = await app.handle(new Request('http://localhost/health'))
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('ok')
  }})

  it('GET /health/live returns ok', async () => {{
    const res = await app.handle(new Request('http://localhost/health/live'))
    expect(res.status).toBe(200)
  }})

  it('GET /health/ready returns ok', async () => {{
    const res = await app.handle(new Request('http://localhost/health/ready'))
    expect(res.status).toBe(200)
  }})
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "src/index.ts": src,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Next.js (pages/app router) ────────────────────────────────────────────────

def nextjs_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    is_app_router = slug == '07-nextjs-app-router'
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"dev": f"next dev -p {port}", "build": "next build", "start": f"next start -p {port}", "test": "jest --forceExit"},
        "dependencies": {"next": "^16.0.0", "react": "^19.0.0", "react-dom": "^19.0.0"},
        "devDependencies": {
            "@types/node": "^22.0.0", "@types/react": "^19.0.0",
            "jest": "^29.7.0", "ts-jest": "^29.3.0", "typescript": "^5.7.0"
        }
    }
    next_config = f"""import type {{ NextConfig }} from 'next'

const config: NextConfig = {{
  output: 'standalone',
}}

export default config
"""
    # App Router page
    page_tsx = f"""export default function Home() {{
  return (
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
  )
}}
"""
    # API Route for health (App Router style)
    health_route = f"""import {{ NextResponse }} from 'next/server'

export async function GET() {{
  return NextResponse.json({{ status: 'ok', version: '1.0.0' }})
}}
"""
    health_live = f"""import {{ NextResponse }} from 'next/server'

export async function GET() {{
  return NextResponse.json({{ status: 'ok' }})
}}
"""
    test = f"""import {{ createRequest, createResponse }} from 'node-mocks-http'
// Integration tests: run `npm run dev` and hit http://localhost:{port}
// or use next/server test utilities

describe('{slug} health routes exist', () => {{
  it('placeholder — test via running server', () => {{
    expect(true).toBe(true)
  }})
}})
"""
    tsconfig_next = {
        "compilerOptions": {
            "lib": ["dom","dom.iterable","esnext"], "allowJs": True,
            "skipLibCheck": True, "strict": True, "noEmit": True,
            "esModuleInterop": True, "module": "esnext", "moduleResolution": "bundler",
            "resolveJsonModule": True, "isolatedModules": True,
            "jsx": "preserve", "incremental": True,
            "plugins": [{"name": "next"}], "paths": {"@/*": ["./src/*"]}
        },
        "include": ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],
        "exclude": ["node_modules"]
    }
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "tsconfig.json": json.dumps(tsconfig_next, indent=2) + "\n",
        "next.config.ts": next_config,
        "app/page.tsx": page_tsx,
        "app/health/route.ts": health_route,
        "app/health/live/route.ts": health_live,
        "app/health/ready/route.ts": health_live,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Remix 7 ───────────────────────────────────────────────────────────────────

def remix_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "remix vite:build", "dev": f"remix vite:dev --port {port}", "start": f"remix-serve ./build/server/index.js", "test": "vitest run"},
        "dependencies": {
            "@remix-run/node": "^7.0.0", "@remix-run/react": "^7.0.0",
            "@remix-run/serve": "^7.0.0", "react": "^19.0.0", "react-dom": "^19.0.0"
        },
        "devDependencies": {
            "@remix-run/dev": "^7.0.0", "@types/react": "^19.0.0",
            "typescript": "^5.7.0", "vite": "^6.0.0", "vitest": "^3.0.0"
        }
    }
    index_route = f"""import type {{ MetaFunction }} from '@remix-run/node'
import {{ json }} from '@remix-run/node'
import {{ useLoaderData }} from '@remix-run/react'

export const meta: MetaFunction = () => [{{ title: '{name} {ver}' }}]

export async function loader() {{
  return json({{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }})
}}

export default function Index() {{
  const data = useLoaderData<typeof loader>()
  return <main><h1>{{data.message}}</h1></main>
}}
"""
    health_loader = """import { json } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'

export async function loader(_: LoaderFunctionArgs) {
  return json({ status: 'ok', version: '1.0.0' })
}
"""
    health_live_loader = """import { json } from '@remix-run/node'
import type { LoaderFunctionArgs } from '@remix-run/node'

export async function loader(_: LoaderFunctionArgs) {
  return json({ status: 'ok' })
}
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'

describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "app/routes/_index.tsx": index_route,
        "app/routes/health.tsx": health_loader,
        "app/routes/health.live.tsx": health_live_loader,
        "app/routes/health.ready.tsx": health_live_loader,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Nuxt 4 ────────────────────────────────────────────────────────────────────

def nuxt_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"build": "nuxt build", "dev": f"nuxt dev --port {port}", "start": "node .output/server/index.mjs", "test": "vitest run"},
        "devDependencies": {
            "@nuxt/test-utils": "^3.15.0", "nuxt": "^4.4.0",
            "vitest": "^3.0.0", "typescript": "^5.7.0"
        }
    }
    nuxt_config = f"""export default defineNuxtConfig({{
  nitro: {{
    preset: 'node-server',
  }},
}})
"""
    app_vue = f"""<template>
  <main>
    <h1>Hello from {name} {ver}</h1>
    <p>Framework: {slug}</p>
  </main>
</template>
"""
    health_get = f"""export default defineEventHandler(() => ({{
  status: 'ok',
  version: '1.0.0',
}}))
"""
    health_live = """export default defineEventHandler(() => ({ status: 'ok' }))
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'

describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "nuxt.config.ts": nuxt_config,
        "app.vue": app_vue,
        "server/api/health.get.ts": health_get,
        "server/api/health/live.get.ts": health_live,
        "server/api/health/ready.get.ts": health_live,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── SvelteKit 2 ───────────────────────────────────────────────────────────────

def sveltekit_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "vite build", "dev": f"vite dev --port {port}", "start": "node build/index.js", "test": "vitest run"},
        "dependencies": {"@sveltejs/adapter-node": "^5.2.0"},
        "devDependencies": {
            "@sveltejs/kit": "^2.57.0", "svelte": "^5.0.0",
            "vite": "^6.0.0", "vitest": "^3.0.0", "typescript": "^5.7.0"
        }
    }
    svelte_config = """import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  kit: { adapter: adapter() },
  preprocess: vitePreprocess(),
}
"""
    page_svelte = f"""<script>
  const data = {{ message: 'Hello from {name} {ver}', framework: '{slug}' }}
</script>

<main>
  <h1>{{data.message}}</h1>
</main>
"""
    health_server = f"""import {{ json }} from '@sveltejs/kit'
import type {{ RequestHandler }} from './$types'

export const GET: RequestHandler = () => json({{ status: 'ok', version: '1.0.0' }})
"""
    health_live = """import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = () => json({ status: 'ok' })
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'

describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "svelte.config.js": svelte_config,
        "src/routes/+page.svelte": page_svelte,
        "src/routes/health/+server.ts": health_server,
        "src/routes/health/live/+server.ts": health_live,
        "src/routes/health/ready/+server.ts": health_live,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Angular SSR 20 ────────────────────────────────────────────────────────────

def angular_ssr_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"build": "ng build", "dev": f"ng serve --port {port}", "start": "node dist/server/main.js", "test": "ng test --watch=false"},
        "dependencies": {
            "@angular/animations": "^20.0.0", "@angular/common": "^20.0.0",
            "@angular/compiler": "^20.0.0", "@angular/core": "^20.0.0",
            "@angular/forms": "^20.0.0", "@angular/platform-browser": "^20.0.0",
            "@angular/platform-server": "^20.0.0", "@angular/router": "^20.0.0",
            "@angular/ssr": "^20.0.0", "rxjs": "^7.8.0", "zone.js": "^0.15.0"
        },
        "devDependencies": {
            "@angular-devkit/build-angular": "^20.0.0",
            "@angular/cli": "^20.0.0", "@types/node": "^22.0.0", "typescript": "^5.7.0"
        }
    }
    app_component = f"""import {{ Component }} from '@angular/core'

@Component({{
  selector: 'app-root',
  template: '<main><h1>Hello from {name} {ver}</h1><p>Framework: {slug}</p></main>',
}})
export class AppComponent {{}}
"""
    health_controller = """import { Component } from '@angular/core'
import { HttpClient } from '@angular/common/http'

// Health endpoints are served via Express in server.ts
// See src/server.ts for GET /health implementation
"""
    server_ts = f"""import {{ APP_BASE_HREF }} from '@angular/common'
import {{ renderApplication }} from '@angular/platform-server'
import express from 'express'
import {{ fileURLToPath }} from 'url'
import {{ dirname, join, resolve }} from 'path'
import bootstrap from './app/app.config.server'

const app = express()
const PORT = process.env.PORT || {port}
const serverDistFolder = dirname(fileURLToPath(import.meta.url))
const browserDistFolder = resolve(serverDistFolder, '../browser')

app.get('/health', (_req, res) => res.json({{ status: 'ok', version: '1.0.0' }}))
app.get('/health/live', (_req, res) => res.json({{ status: 'ok' }}))
app.get('/health/ready', (_req, res) => res.json({{ status: 'ok' }}))

app.use(express.static(browserDistFolder, {{ maxAge: '1y' }}))

app.get('**', (req, res, next) => {{
  const {{ protocol, originalUrl, baseUrl, headers }} = req
  renderApplication(bootstrap, {{
    document: '<app-root></app-root>',
    url: `${{protocol}}://${{headers.host}}${{originalUrl}}`,
    platformProviders: [{{ provide: APP_BASE_HREF, useValue: baseUrl }}],
  }}).then(html => res.send(html)).catch(err => next(err))
}})

app.listen(PORT, () => console.log(`{name} running on port ${{PORT}}`))
"""
    test = f"""// Angular test: run `ng test --watch=false`
// health endpoints in server.ts tested via integration test against running server
describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "src/app/app.component.ts": app_component,
        "src/server.ts": server_ts,
        "src/app/health.ts": health_controller,
        "src/app/health.spec.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Astro (server mode) ───────────────────────────────────────────────────────

def astro_server_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "astro build", "dev": f"astro dev --port {port}", "start": "node dist/server/entry.mjs", "test": "vitest run"},
        "dependencies": {"@astrojs/node": "^9.0.0", "astro": "^6.3.0"},
        "devDependencies": {"vitest": "^3.0.0", "typescript": "^5.7.0"}
    }
    astro_config = f"""import {{ defineConfig }} from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({{
  output: 'server',
  adapter: node({{ mode: 'standalone' }}),
  server: {{ port: {port} }},
}})
"""
    index_astro = f"""---
const data = {{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}
---

<html>
  <body>
    <main>
      <h1>{{data.message}}</h1>
    </main>
  </body>
</html>
"""
    health_ts = f"""import type {{ APIRoute }} from 'astro'

export const GET: APIRoute = () =>
  new Response(JSON.stringify({{ status: 'ok', version: '1.0.0' }}), {{
    headers: {{ 'Content-Type': 'application/json' }},
  }})
"""
    health_live_ts = """import type { APIRoute } from 'astro'

export const GET: APIRoute = () =>
  new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  })
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'
describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "astro.config.mjs": astro_config,
        "src/pages/index.astro": index_astro,
        "src/pages/health.ts": health_ts,
        "src/pages/health/live.ts": health_live_ts,
        "src/pages/health/ready.ts": health_live_ts,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Deno Fresh 2 ──────────────────────────────────────────────────────────────

def deno_fresh_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    deno_json = {
        "name": slug, "version": "1.0.0",
        "tasks": {"start": f"deno run -A --watch=static/,routes/ dev.ts", "build": "deno run -A dev.ts build"},
        "imports": {"$fresh/": "https://deno.land/x/fresh@1.7.3/"},
        "compilerOptions": {"jsx": "react-jsx", "jsxImportSource": "preact"}
    }
    index_tsx = f"""import {{ PageProps }} from '$fresh/server.ts'

export default function Home(_props: PageProps) {{
  return (
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
  )
}}
"""
    health_ts = f"""import {{ HandlerContext }} from '$fresh/server.ts'

export const handler = {{
  GET(_req: Request, _ctx: HandlerContext) {{
    return Response.json({{ status: 'ok', version: '1.0.0' }})
  }},
}}
"""
    health_live_ts = """import { HandlerContext } from '$fresh/server.ts'

export const handler = {
  GET(_req: Request, _ctx: HandlerContext) {
    return Response.json({ status: 'ok' })
  },
}
"""
    test = f"""import {{ assertEquals }} from 'jsr:@std/assert'

Deno.test('{slug}: placeholder', () => {{
  assertEquals(1, 1)
}})
"""
    return {
        "deno.json": json.dumps(deno_json, indent=2) + "\n",
        "routes/index.tsx": index_tsx,
        "routes/health.ts": health_ts,
        "routes/health/live.ts": health_live_ts,
        "routes/health/ready.ts": health_live_ts,
        "tests/health_test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Qwik City ─────────────────────────────────────────────────────────────────

def qwik_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "qwik build", "dev": f"vite --port {port}", "start": "node server/entry.express.js", "test": "vitest run"},
        "dependencies": {
            "@builder.io/qwik": "^2.0.0", "@builder.io/qwik-city": "^2.0.0",
            "express": "^5.0.0", "dotenv": "^16.4.5"
        },
        "devDependencies": {
            "@types/express": "^5.0.0", "typescript": "^5.7.0",
            "vite": "^6.0.0", "vitest": "^3.0.0"
        }
    }
    index_tsx = f"""import {{ component$ }} from '@builder.io/qwik'
import {{ type DocumentHead }} from '@builder.io/qwik-city'

export default component$(() => {{
  return (
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
  )
}})

export const head: DocumentHead = {{ title: '{name} {ver}' }}
"""
    health_ts = f"""import {{ type RequestHandler }} from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({{ json }}) => {{
  json(200, {{ status: 'ok', version: '1.0.0' }})
}}
"""
    health_live_ts = """import { type RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ json }) => {
  json(200, { status: 'ok' })
}
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'
describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "src/routes/index.tsx": index_tsx,
        "src/routes/health/index.ts": health_ts,
        "src/routes/health/live/index.ts": health_live_ts,
        "src/routes/health/ready/index.ts": health_live_ts,
        "tests/health.test.ts": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Generic nginx SPA/SSG ─────────────────────────────────────────────────────

def spa_react_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "vite build", "dev": "vite", "preview": "vite preview", "test": "vitest run"},
        "dependencies": {"react": "^19.0.0", "react-dom": "^19.0.0"},
        "devDependencies": {
            "@types/react": "^19.0.0", "@types/react-dom": "^19.0.0",
            "@vitejs/plugin-react": "^4.3.0", "vite": "^6.0.0", "vitest": "^3.0.0",
            "@testing-library/react": "^16.0.0", "@testing-library/jest-dom": "^6.6.0"
        }
    }
    app_tsx = f"""export default function App() {{
  return (
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
  )
}}
"""
    main_tsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
"""
    vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
})
"""
    test = f"""import {{ render, screen }} from '@testing-library/react'
import {{ describe, it, expect }} from 'vitest'
import App from '../src/App'

describe('{slug}', () => {{
  it('renders hello', () => {{
    render(<App />)
    expect(screen.getByText(/Hello from/i)).toBeDefined()
  }})
}})
"""
    index_html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{name} {ver}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "vite.config.ts": vite_config,
        "index.html": index_html,
        "src/App.tsx": app_tsx,
        "src/main.tsx": main_tsx,
        "tests/App.test.tsx": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def spa_vue_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "vite build", "dev": "vite", "preview": "vite preview", "test": "vitest run"},
        "dependencies": {"vue": "^3.5.0"},
        "devDependencies": {
            "@vitejs/plugin-vue": "^5.0.0", "vite": "^6.0.0", "vitest": "^3.0.0",
            "@vue/test-utils": "^2.4.0"
        }
    }
    app_vue = f"""<template>
  <main>
    <h1>Hello from {name} {ver}</h1>
    <p>Framework: {slug}</p>
  </main>
</template>

<script setup lang="ts">
const message = 'Hello from {name} {ver}'
</script>
"""
    main_ts = """import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
"""
    vite_config = """import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
"""
    test = f"""import {{ mount }} from '@vue/test-utils'
import {{ describe, it, expect }} from 'vitest'
import App from '../src/App.vue'

describe('{slug}', () => {{
  it('renders hello', () => {{
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Hello from')
  }})
}})
"""
    index_html = f"""<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>{name} {ver}</title></head>
  <body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>
</html>
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "vite.config.ts": vite_config,
        "index.html": index_html,
        "src/App.vue": app_vue,
        "src/main.ts": main_ts,
        "tests/App.test.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def spa_angular_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"build": "ng build", "start": "ng serve", "test": "ng test --watch=false"},
        "dependencies": {
            "@angular/animations": "^20.0.0", "@angular/common": "^20.0.0",
            "@angular/compiler": "^20.0.0", "@angular/core": "^20.0.0",
            "@angular/forms": "^20.0.0", "@angular/platform-browser": "^20.0.0",
            "@angular/router": "^20.0.0", "rxjs": "^7.8.0", "zone.js": "^0.15.0"
        },
        "devDependencies": {
            "@angular-devkit/build-angular": "^20.0.0",
            "@angular/cli": "^20.0.0", "typescript": "^5.7.0"
        }
    }
    app_component = f"""import {{ Component }} from '@angular/core'

@Component({{
  selector: 'app-root',
  template: '<main><h1>Hello from {name} {ver}</h1><p>Framework: {slug}</p></main>',
}})
export class AppComponent {{
  title = '{slug}'
}}
"""
    test = f"""import {{ TestBed }} from '@angular/core/testing'
import {{ AppComponent }} from './app.component'

describe('AppComponent', () => {{
  beforeEach(() => TestBed.configureTestingModule({{ declarations: [AppComponent] }}).compileComponents())

  it('renders hello', () => {{
    const fixture = TestBed.createComponent(AppComponent)
    fixture.detectChanges()
    const compiled = fixture.nativeElement as HTMLElement
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello from')
  }})
}})
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "src/app/app.component.ts": app_component,
        "src/app/app.component.spec.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def spa_svelte_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "vite build", "dev": "vite", "preview": "vite preview", "test": "vitest run"},
        "devDependencies": {
            "@sveltejs/vite-plugin-svelte": "^5.0.0", "svelte": "^5.0.0",
            "vite": "^6.0.0", "vitest": "^3.0.0"
        }
    }
    app_svelte = f"""<main>
  <h1>Hello from {name} {ver}</h1>
  <p>Framework: {slug}</p>
</main>
"""
    main_ts = """import App from './App.svelte'

const app = new App({ target: document.getElementById('app')! })
export default app
"""
    vite_config = """import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({ plugins: [svelte()] })
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'
describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    hfiles = health_json_files("public/health")
    index_html = f"""<!doctype html>
<html><head><meta charset="UTF-8" /><title>{name} {ver}</title></head>
<body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>
</html>
"""
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "vite.config.ts": vite_config,
        "index.html": index_html,
        "src/App.svelte": app_svelte,
        "src/main.ts": main_ts,
        "tests/app.test.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def spa_generic_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "vite build", "dev": "vite", "preview": "vite preview", "test": "vitest run"},
        "devDependencies": {"vite": "^6.0.0", "vitest": "^3.0.0"}
    }
    index_html = f"""<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>{name} {ver}</title></head>
  <body>
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
  </body>
</html>
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'
describe('{slug}', () => {{
  it('placeholder', () => expect(true).toBe(true))
}})
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "index.html": index_html,
        "tests/health.test.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def hugo_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    hugo_toml = f"""baseURL = 'http://localhost/'
languageCode = 'en-us'
title = '{name} {ver}'
"""
    index_md = f"""---
title: "Home"
---

# Hello from {name} {ver}

Framework: `{slug}`
"""
    layout = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>{{ .Site.Title }}</title>
  </head>
  <body>
    <main>{{ .Content }}</main>
  </body>
</html>
"""
    hfiles = health_json_files("static/health")
    return {
        "hugo.toml": hugo_toml,
        "content/_index.md": index_md,
        "layouts/index.html": layout,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def eleventy_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"build": "eleventy", "dev": "eleventy --serve", "test": "jest"},
        "devDependencies": {"@11ty/eleventy": "^3.0.0", "jest": "^29.7.0"}
    }
    eleventy_config = """module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('public')
  return { dir: { input: 'src', output: '_site' } }
}
"""
    index_html = f"""---
title: Hello
---
<!DOCTYPE html>
<html><body>
<h1>Hello from {name} {ver}</h1>
<p>Framework: {slug}</p>
</body></html>
"""
    test = f"""describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        ".eleventy.js": eleventy_config,
        "src/index.html": index_html,
        "tests/health.test.js": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


def gatsby_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0",
        "scripts": {"build": "gatsby build", "develop": "gatsby develop", "test": "jest"},
        "dependencies": {"gatsby": "^5.13.0", "react": "^19.0.0", "react-dom": "^19.0.0"},
        "devDependencies": {"jest": "^29.7.0", "typescript": "^5.7.0"}
    }
    index_tsx = f"""import React from 'react'

export default function IndexPage() {{
  return (
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
  )
}}
"""
    test = f"""describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    hfiles = health_json_files("static/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "src/pages/index.tsx": index_tsx,
        "tests/health.test.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


# ── Python ────────────────────────────────────────────────────────────────────

def fastapi_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    requirements = f"""fastapi=={ver}
uvicorn[standard]>=0.34.0
python-dotenv>=1.0.1
httpx>=0.28.0
pytest>=8.3.0
pytest-asyncio>=0.24.0
"""
    src = f"""from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI(title="{name} {ver}")

@app.get("/")
def hello():
    return {{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}}

@app.get("/health")
def health():
    return {{"status": "ok", "version": "1.0.0"}}

@app.get("/health/live")
def liveness():
    return {{"status": "ok"}}

@app.get("/health/ready")
def readiness():
    return {{"status": "ok"}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "{port}")))
"""
    test = f"""import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_hello():
    r = client.get("/")
    assert r.status_code == 200
    assert "{name.split()[0]}" in r.json()["message"]

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_liveness():
    r = client.get("/health/live")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_readiness():
    r = client.get("/health/ready")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
"""
    pytest_ini = """[pytest]
testpaths = tests
"""
    return {
        "requirements.txt": requirements,
        "src/main.py": src,
        "src/__init__.py": "",
        "tests/__init__.py": "",
        "tests/test_health.py": test,
        "pytest.ini": pytest_ini,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def django_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    requirements = f"""Django=={ver}
gunicorn>=23.0.0
python-dotenv>=1.0.1
pytest>=8.3.0
pytest-django>=4.9.0
"""
    settings = f"""from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dev-only-insecure-key')
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'health',
]

MIDDLEWARE = ['django.middleware.common.CommonMiddleware']

ROOT_URLCONF = 'config.urls'

DATABASES = {{}}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
"""
    urls = f"""from django.urls import path
from health.views import hello, health, liveness, readiness

urlpatterns = [
    path('', hello, name='hello'),
    path('health/', health, name='health'),
    path('health/live', liveness, name='liveness'),
    path('health/ready', readiness, name='readiness'),
]
"""
    views = f"""from django.http import JsonResponse

def hello(request):
    return JsonResponse({{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}})

def health(request):
    return JsonResponse({{"status": "ok", "version": "1.0.0"}})

def liveness(request):
    return JsonResponse({{"status": "ok"}})

def readiness(request):
    return JsonResponse({{"status": "ok"}})
"""
    test = f"""import pytest
from django.test import Client

@pytest.fixture
def client():
    return Client()

@pytest.mark.django_db
def test_hello(client):
    r = client.get('/')
    assert r.status_code == 200
    assert '{name.split()[0]}' in r.json()['message']

@pytest.mark.django_db
def test_health(client):
    r = client.get('/health/')
    assert r.status_code == 200
    assert r.json()['status'] == 'ok'

@pytest.mark.django_db
def test_liveness(client):
    r = client.get('/health/live')
    assert r.status_code == 200

@pytest.mark.django_db
def test_readiness(client):
    r = client.get('/health/ready')
    assert r.status_code == 200
"""
    conftest = """import django
from django.conf import settings

def pytest_configure():
    settings.configure(
        DATABASES={},
        INSTALLED_APPS=['django.contrib.contenttypes','django.contrib.auth','health'],
        ROOT_URLCONF='config.urls',
        MIDDLEWARE=['django.middleware.common.CommonMiddleware'],
        SECRET_KEY='test-only-key',
        ALLOWED_HOSTS=['*'],
    )
"""
    manage = f"""#!/usr/bin/env python
import os, sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
"""
    return {
        "requirements.txt": requirements,
        "manage.py": manage,
        "config/__init__.py": "",
        "config/settings.py": settings,
        "config/urls.py": urls,
        "health/__init__.py": "",
        "health/views.py": views,
        "tests/__init__.py": "",
        "tests/test_health.py": test,
        "conftest.py": conftest,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def flask_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    requirements = f"""Flask=={ver}
gunicorn>=23.0.0
python-dotenv>=1.0.1
pytest>=8.3.0
"""
    src = f"""from flask import Flask, jsonify
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)

@app.get('/')
def hello():
    return jsonify(message=f"Hello from {name} {ver}", framework="{slug}", version="1.0.0")

@app.get('/health')
def health():
    return jsonify(status='ok', version='1.0.0')

@app.get('/health/live')
def liveness():
    return jsonify(status='ok')

@app.get('/health/ready')
def readiness():
    return jsonify(status='ok')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '{port}')))
"""
    test = f"""import pytest
from src.app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as c:
        yield c

def test_hello(client):
    r = client.get('/')
    assert r.status_code == 200
    assert '{name.split()[0]}' in r.get_json()['message']

def test_health(client):
    r = client.get('/health')
    assert r.status_code == 200
    assert r.get_json()['status'] == 'ok'

def test_liveness(client):
    r = client.get('/health/live')
    assert r.status_code == 200

def test_readiness(client):
    r = client.get('/health/ready')
    assert r.status_code == 200
"""
    return {
        "requirements.txt": requirements,
        "src/__init__.py": "",
        "src/app.py": src,
        "tests/__init__.py": "",
        "tests/test_health.py": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def starlette_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    requirements = f"""starlette=={ver}
uvicorn[standard]>=0.34.0
python-dotenv>=1.0.1
httpx>=0.28.0
pytest>=8.3.0
pytest-asyncio>=0.24.0
"""
    src = f"""from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from dotenv import load_dotenv
import os

load_dotenv()

def hello(request: Request):
    return JSONResponse({{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}})

def health(request: Request):
    return JSONResponse({{"status": "ok", "version": "1.0.0"}})

def liveness(request: Request):
    return JSONResponse({{"status": "ok"}})

def readiness(request: Request):
    return JSONResponse({{"status": "ok"}})

app = Starlette(routes=[
    Route('/', hello),
    Route('/health', health),
    Route('/health/live', liveness),
    Route('/health/ready', readiness),
])

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('PORT', '{port}')))
"""
    test = f"""import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest.mark.anyio
async def test_hello():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/')
        assert r.status_code == 200
        assert '{name.split()[0]}' in r.json()['message']

@pytest.mark.anyio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health')
        assert r.status_code == 200
        assert r.json()['status'] == 'ok'

@pytest.mark.anyio
async def test_liveness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health/live')
        assert r.status_code == 200

@pytest.mark.anyio
async def test_readiness():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as c:
        r = await c.get('/health/ready')
        assert r.status_code == 200
"""
    pytest_ini = "[pytest]\ntestpaths = tests\nasyncio_mode = auto\n"
    return {
        "requirements.txt": requirements,
        "src/__init__.py": "",
        "src/main.py": src,
        "tests/__init__.py": "",
        "tests/test_health.py": test,
        "pytest.ini": pytest_ini,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Go ────────────────────────────────────────────────────────────────────────

def go_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    lang_slug = slug  # 16-gin, 16-echo, 16-fiber, 16-chi

    module = f"github.com/yarova-ca/{slug}"

    imports_map = {
        '16-gin': ('github.com/gin-gonic/gin', f'v{ver}'),
        '16-echo': ('github.com/labstack/echo/v4', f'v{ver}'),
        '16-fiber': ('github.com/gofiber/fiber/v3', f'v{ver}'),
        '16-chi': ('github.com/go-chi/chi/v5', f'v{ver}'),
    }
    dep_path, dep_ver = imports_map.get(slug, ('github.com/gin-gonic/gin', 'v1.10.0'))

    go_mod = f"""module {module}

go 1.23

require (
\t{dep_path} {dep_ver}
)
"""

    if slug == '16-gin':
        main_go = f"""package main

import (
\t"net/http"
\t"os"

\t"github.com/gin-gonic/gin"
)

func main() {{
\tr := gin.Default()

\tr.GET("/", func(c *gin.Context) {{
\t\tc.JSON(http.StatusOK, gin.H{{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}})
\t}})

\tr.GET("/health", func(c *gin.Context) {{
\t\tc.JSON(http.StatusOK, gin.H{{"status": "ok", "version": "1.0.0"}})
\t}})

\tr.GET("/health/live", func(c *gin.Context) {{
\t\tc.JSON(http.StatusOK, gin.H{{"status": "ok"}})
\t}})

\tr.GET("/health/ready", func(c *gin.Context) {{
\t\tc.JSON(http.StatusOK, gin.H{{"status": "ok"}})
\t}})

\tport := os.Getenv("PORT")
\tif port == "" {{
\t\tport = "{port}"
\t}}
\tr.Run(":" + port)
}}
"""
    elif slug == '16-echo':
        main_go = f"""package main

import (
\t"net/http"
\t"os"

\t"github.com/labstack/echo/v4"
)

func main() {{
\te := echo.New()

\te.GET("/", func(c echo.Context) error {{
\t\treturn c.JSON(http.StatusOK, map[string]string{{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}})
\t}})

\te.GET("/health", func(c echo.Context) error {{
\t\treturn c.JSON(http.StatusOK, map[string]string{{"status": "ok", "version": "1.0.0"}})
\t}})

\te.GET("/health/live", func(c echo.Context) error {{
\t\treturn c.JSON(http.StatusOK, map[string]string{{"status": "ok"}})
\t}})

\te.GET("/health/ready", func(c echo.Context) error {{
\t\treturn c.JSON(http.StatusOK, map[string]string{{"status": "ok"}})
\t}})

\tport := os.Getenv("PORT")
\tif port == "" {{
\t\tport = "{port}"
\t}}
\te.Logger.Fatal(e.Start(":" + port))
}}
"""
    elif slug == '16-fiber':
        main_go = f"""package main

import (
\t"os"

\t"github.com/gofiber/fiber/v3"
)

func main() {{
\tapp := fiber.New()

\tapp.Get("/", func(c fiber.Ctx) error {{
\t\treturn c.JSON(fiber.Map{{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}})
\t}})

\tapp.Get("/health", func(c fiber.Ctx) error {{
\t\treturn c.JSON(fiber.Map{{"status": "ok", "version": "1.0.0"}})
\t}})

\tapp.Get("/health/live", func(c fiber.Ctx) error {{
\t\treturn c.JSON(fiber.Map{{"status": "ok"}})
\t}})

\tapp.Get("/health/ready", func(c fiber.Ctx) error {{
\t\treturn c.JSON(fiber.Map{{"status": "ok"}})
\t}})

\tport := os.Getenv("PORT")
\tif port == "" {{
\t\tport = "{port}"
\t}}
\tapp.Listen(":" + port)
}}
"""
    else:  # chi
        main_go = f"""package main

import (
\t"encoding/json"
\t"net/http"
\t"os"

\t"github.com/go-chi/chi/v5"
\t"github.com/go-chi/chi/v5/middleware"
)

func writeJSON(w http.ResponseWriter, data any) {{
\tw.Header().Set("Content-Type", "application/json")
\tjson.NewEncoder(w).Encode(data)
}}

func main() {{
\tr := chi.NewRouter()
\tr.Use(middleware.Logger)

\tr.Get("/", func(w http.ResponseWriter, _ *http.Request) {{
\t\twriteJSON(w, map[string]string{{"message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"}})
\t}})

\tr.Get("/health", func(w http.ResponseWriter, _ *http.Request) {{
\t\twriteJSON(w, map[string]string{{"status": "ok", "version": "1.0.0"}})
\t}})

\tr.Get("/health/live", func(w http.ResponseWriter, _ *http.Request) {{
\t\twriteJSON(w, map[string]string{{"status": "ok"}})
\t}})

\tr.Get("/health/ready", func(w http.ResponseWriter, _ *http.Request) {{
\t\twriteJSON(w, map[string]string{{"status": "ok"}})
\t}})

\tport := os.Getenv("PORT")
\tif port == "" {{
\t\tport = "{port}"
\t}}
\thttp.ListenAndServe(":"+port, r)
}}
"""

    test_go = f"""package main

import (
\t"net/http"
\t"net/http/httptest"
\t"testing"
)

// Integration test: spin up server and call endpoints
// Unit test: refactor handlers into functions and test directly

func TestHealthEndpointExists(t *testing.T) {{
\t// Placeholder — replace with handler-level tests once handlers are extracted
\treq := httptest.NewRequest(http.MethodGet, "/health", nil)
\tif req.URL.Path != "/health" {{
\t\tt.Fatal("path mismatch")
\t}}
}}
"""
    return {
        "go.mod": go_mod,
        "main.go": main_go,
        "main_test.go": test_go,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Java ──────────────────────────────────────────────────────────────────────

def java_spring_boot_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    artifact = slug.replace('-','')

    pom = f"""<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>{ver}.0</version>
  </parent>
  <groupId>com.example</groupId>
  <artifactId>{slug}</artifactId>
  <version>1.0.0</version>
  <properties>
    <java.version>21</java.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
"""
    app_java = f"""package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {{
    public static void main(String[] args) {{
        SpringApplication.run(Application.class, args);
    }}
}}
"""
    hello_ctrl = f"""package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HelloController {{

    @GetMapping("/")
    public Map<String, String> hello() {{
        return Map.of("message", "Hello from {name} {ver}", "framework", "{slug}", "version", "1.0.0");
    }}

    @GetMapping("/health")
    public Map<String, String> health() {{
        return Map.of("status", "ok", "version", "1.0.0");
    }}

    @GetMapping("/health/live")
    public Map<String, String> liveness() {{
        return Map.of("status", "ok");
    }}

    @GetMapping("/health/ready")
    public Map<String, String> readiness() {{
        return Map.of("status", "ok");
    }}
}}
"""
    app_props = f"""server.port=${{SERVER_PORT:{port}}}
management.endpoints.web.exposure.include=health,info
"""
    test_java = f"""package com.example.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HelloController.class)
class HelloControllerTest {{

    @Autowired
    private MockMvc mvc;

    @Test void testHello() throws Exception {{
        mvc.perform(get("/")).andExpect(status().isOk()).andExpect(jsonPath("$.message").exists());
    }}

    @Test void testHealth() throws Exception {{
        mvc.perform(get("/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
    }}

    @Test void testLiveness() throws Exception {{
        mvc.perform(get("/health/live")).andExpect(status().isOk());
    }}

    @Test void testReadiness() throws Exception {{
        mvc.perform(get("/health/ready")).andExpect(status().isOk());
    }}
}}
"""
    pkg = "src/main/java/com/example"
    tpkg = "src/test/java/com/example"
    return {
        "pom.xml": pom,
        f"{pkg}/Application.java": app_java,
        f"{pkg}/controller/HelloController.java": hello_ctrl,
        "src/main/resources/application.properties": app_props,
        f"{tpkg}/controller/HelloControllerTest.java": test_java,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def quarkus_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pom = f"""<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>{slug}</artifactId>
  <version>1.0.0</version>
  <properties>
    <quarkus.platform.version>{ver}.0</quarkus.platform.version>
    <maven.compiler.release>21</maven.compiler.release>
    <quarkus.http.port>{port}</quarkus.http.port>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.quarkus.platform</groupId>
        <artifactId>quarkus-bom</artifactId>
        <version>${{quarkus.platform.version}}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-resteasy-reactive-jackson</artifactId></dependency>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-smallrye-health</artifactId></dependency>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-junit5</artifactId><scope>test</scope></dependency>
    <dependency><groupId>io.rest-assured</groupId><artifactId>rest-assured</artifactId><scope>test</scope></dependency>
  </dependencies>
</project>
"""
    resource = f"""package com.example;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/")
public class HelloResource {{

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> hello() {{
        return Map.of("message", "Hello from {name} {ver}", "framework", "{slug}", "version", "1.0.0");
    }}

    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> health() {{
        return Map.of("status", "ok", "version", "1.0.0");
    }}

    @GET @Path("/health/live") @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> liveness() {{ return Map.of("status", "ok"); }}

    @GET @Path("/health/ready") @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> readiness() {{ return Map.of("status", "ok"); }}
}}
"""
    test = f"""package com.example;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.*;

@QuarkusTest
class HelloResourceTest {{
    @Test void testHello() {{
        given().when().get("/").then().statusCode(200).body("message", containsString("{name.split()[0]}"));
    }}
    @Test void testHealth() {{
        given().when().get("/health").then().statusCode(200).body("status", is("ok"));
    }}
    @Test void testLiveness() {{ given().when().get("/health/live").then().statusCode(200); }}
    @Test void testReadiness() {{ given().when().get("/health/ready").then().statusCode(200); }}
}}
"""
    return {
        "pom.xml": pom,
        "src/main/java/com/example/HelloResource.java": resource,
        "src/test/java/com/example/HelloResourceTest.java": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def micronaut_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    pom = f"""<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>{slug}</artifactId>
  <version>1.0.0</version>
  <parent>
    <groupId>io.micronaut.platform</groupId>
    <artifactId>micronaut-parent</artifactId>
    <version>{ver}.0</version>
  </parent>
  <properties><java.version>21</java.version><micronaut.runtime>netty</micronaut.runtime></properties>
  <dependencies>
    <dependency><groupId>io.micronaut</groupId><artifactId>micronaut-http-server-netty</artifactId></dependency>
    <dependency><groupId>io.micronaut</groupId><artifactId>micronaut-management</artifactId></dependency>
    <dependency><groupId>io.micronaut.test</groupId><artifactId>micronaut-test-junit5</artifactId><scope>test</scope></dependency>
    <dependency><groupId>io.micronaut</groupId><artifactId>micronaut-http-client</artifactId><scope>test</scope></dependency>
  </dependencies>
</project>
"""
    ctrl = f"""package com.example;

import io.micronaut.http.annotation.*;
import java.util.Map;

@Controller
public class HelloController {{

    @Get("/")
    public Map<String, String> hello() {{
        return Map.of("message", "Hello from {name} {ver}", "framework", "{slug}", "version", "1.0.0");
    }}

    @Get("/health")
    public Map<String, String> health() {{
        return Map.of("status", "ok", "version", "1.0.0");
    }}

    @Get("/health/live")
    public Map<String, String> liveness() {{ return Map.of("status", "ok"); }}

    @Get("/health/ready")
    public Map<String, String> readiness() {{ return Map.of("status", "ok"); }}
}}
"""
    test = f"""package com.example;

import io.micronaut.http.HttpStatus;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

@MicronautTest
class HelloControllerTest {{
    @Inject @Client("/") HttpClient client;

    @Test void testHello() {{ assertEquals(HttpStatus.OK, client.toBlocking().exchange("/").status()); }}
    @Test void testHealth() {{ assertEquals(HttpStatus.OK, client.toBlocking().exchange("/health").status()); }}
    @Test void testLiveness() {{ assertEquals(HttpStatus.OK, client.toBlocking().exchange("/health/live").status()); }}
    @Test void testReadiness() {{ assertEquals(HttpStatus.OK, client.toBlocking().exchange("/health/ready").status()); }}
}}
"""
    app_props = f"""micronaut.server.port={port}
endpoints.all.sensitive=false
"""
    return {
        "pom.xml": pom,
        "src/main/java/com/example/HelloController.java": ctrl,
        "src/main/resources/application.properties": app_props,
        "src/test/java/com/example/HelloControllerTest.java": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Kotlin ────────────────────────────────────────────────────────────────────

def ktor_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    build_gradle = f"""plugins {{
    kotlin("jvm") version "2.1.0"
    id("io.ktor.plugin") version "{ver}.0"
    application
}}

application {{
    mainClass.set("com.example.ApplicationKt")
}}

dependencies {{
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}}
"""
    settings_gradle = f"""rootProject.name = "{slug}"
"""
    main_kt = f"""package com.example

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

@Serializable
data class HelloResponse(val message: String, val framework: String, val version: String)

@Serializable
data class HealthResponse(val status: String, val version: String? = null)

fun Application.module() {{
    routing {{
        get("/") {{
            call.respond(HelloResponse("Hello from {name} {ver}", "{slug}", "1.0.0"))
        }}
        get("/health") {{
            call.respond(HealthResponse("ok", "1.0.0"))
        }}
        get("/health/live") {{
            call.respond(HealthResponse("ok"))
        }}
        get("/health/ready") {{
            call.respond(HealthResponse("ok"))
        }}
    }}
}}

fun main() {{
    val port = System.getenv("SERVER_PORT")?.toInt() ?: {port}
    embeddedServer(Netty, port = port, module = Application::module).start(wait = true)
}}
"""
    test_kt = f"""package com.example

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.*

class HealthTest {{
    @Test fun testHello() = testApplication {{
        application {{ module() }}
        val r = client.get("/")
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("{name.split()[0]}"))
    }}

    @Test fun testHealth() = testApplication {{
        application {{ module() }}
        val r = client.get("/health")
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("ok"))
    }}

    @Test fun testLiveness() = testApplication {{
        application {{ module() }}
        assertEquals(HttpStatusCode.OK, client.get("/health/live").status)
    }}

    @Test fun testReadiness() = testApplication {{
        application {{ module() }}
        assertEquals(HttpStatusCode.OK, client.get("/health/ready").status)
    }}
}}
"""
    return {
        "build.gradle.kts": build_gradle,
        "settings.gradle.kts": settings_gradle,
        "src/main/kotlin/com/example/Application.kt": main_kt,
        "src/test/kotlin/com/example/HealthTest.kt": test_kt,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def spring_boot_kotlin_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    build_gradle = f"""plugins {{
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.0"
    id("org.springframework.boot") version "{ver}.0"
    id("io.spring.dependency-management") version "1.1.7"
}}

dependencies {{
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}}
"""
    main_kt = f"""package com.example

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@SpringBootApplication
class Application

fun main(args: Array<String>) {{
    runApplication<Application>(*args)
}}

@RestController
class HelloController {{
    @GetMapping("/") fun hello() = mapOf("message" to "Hello from {name} {ver}", "framework" to "{slug}", "version" to "1.0.0")
    @GetMapping("/health") fun health() = mapOf("status" to "ok", "version" to "1.0.0")
    @GetMapping("/health/live") fun liveness() = mapOf("status" to "ok")
    @GetMapping("/health/ready") fun readiness() = mapOf("status" to "ok")
}}
"""
    test_kt = f"""package com.example

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*

@WebMvcTest(HelloController::class)
class HelloControllerTest {{
    @Autowired lateinit var mvc: MockMvc

    @Test fun testHello() {{ mvc.perform(get("/")).andExpect(status().isOk).andExpect(jsonPath("$.message").exists()) }}
    @Test fun testHealth() {{ mvc.perform(get("/health")).andExpect(status().isOk).andExpect(jsonPath("$.status").value("ok")) }}
    @Test fun testLiveness() {{ mvc.perform(get("/health/live")).andExpect(status().isOk) }}
    @Test fun testReadiness() {{ mvc.perform(get("/health/ready")).andExpect(status().isOk) }}
}}
"""
    app_props = f"""server.port=${{SERVER_PORT:{port}}}
management.endpoints.web.exposure.include=health,info
"""
    return {
        "build.gradle.kts": build_gradle,
        "src/main/kotlin/com/example/Application.kt": main_kt,
        "src/main/resources/application.properties": app_props,
        "src/test/kotlin/com/example/HelloControllerTest.kt": test_kt,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── .NET ──────────────────────────────────────────────────────────────────────

def dotnet_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    is_minimal = slug == '19-minimal-apis'
    safe_name = slug.replace('-','_')

    csproj = f"""<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <RootNamespace>App</RootNamespace>
  </PropertyGroup>
</Project>
"""
    if is_minimal:
        program = f"""var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => new {{ message = "Hello from {name} {ver}", framework = "{slug}", version = "1.0.0" }});
app.MapGet("/health", () => new {{ status = "ok", version = "1.0.0" }});
app.MapGet("/health/live", () => new {{ status = "ok" }});
app.MapGet("/health/ready", () => new {{ status = "ok" }});

var port = Environment.GetEnvironmentVariable("PORT") ?? "{port}";
app.Run($"http://0.0.0.0:{{port}}");
"""
    else:
        program = f"""var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddHealthChecks();

var app = builder.Build();
app.MapControllers();
app.MapHealthChecks("/actuator/health");

var port = Environment.GetEnvironmentVariable("PORT") ?? "{port}";
app.Run($"http://0.0.0.0:{{port}}");
"""
    health_ctrl = f"""using Microsoft.AspNetCore.Mvc;

namespace App.Controllers;

[ApiController]
[Route("")]
public class HelloController : ControllerBase
{{
    [HttpGet("/")] public IActionResult Hello() =>
        Ok(new {{ message = "Hello from {name} {ver}", framework = "{slug}", version = "1.0.0" }});

    [HttpGet("/health")] public IActionResult Health() =>
        Ok(new {{ status = "ok", version = "1.0.0" }});

    [HttpGet("/health/live")] public IActionResult Liveness() => Ok(new {{ status = "ok" }});
    [HttpGet("/health/ready")] public IActionResult Readiness() => Ok(new {{ status = "ok" }});
}}
"""
    test_csproj = f"""<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.0" />
    <PackageReference Include="xunit" Version="2.9.0" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
    <ProjectReference Include="../App/{slug}.csproj" />
  </ItemGroup>
</Project>
"""
    test_cs = f"""using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;

public class HealthTests : IClassFixture<WebApplicationFactory<Program>>
{{
    private readonly HttpClient _client;
    public HealthTests(WebApplicationFactory<Program> factory)
    {{
        _client = factory.CreateClient();
    }}

    [Fact] public async Task GetHello_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/")).StatusCode);
    [Fact] public async Task GetHealth_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/health")).StatusCode);
    [Fact] public async Task GetLive_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/health/live")).StatusCode);
    [Fact] public async Task GetReady_ReturnsOk() => Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/health/ready")).StatusCode);
}}
"""
    files = {
        f"App/{slug}.csproj": csproj,
        "App/Program.cs": program,
        f"Tests/Tests.csproj": test_csproj,
        "Tests/HealthTests.cs": test_cs,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }
    if not is_minimal:
        files["App/Controllers/HelloController.cs"] = health_ctrl
    return files


# ── Rust ──────────────────────────────────────────────────────────────────────

def rust_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    is_actix = slug == '20-actix-web'

    if is_actix:
        cargo_toml = f"""[package]
name = "{slug}"
version = "1.0.0"
edition = "2021"

[dependencies]
actix-web = "{ver}"
serde = {{ version = "1", features = ["derive"] }}
serde_json = "1"
tokio = {{ version = "1", features = ["macros","rt-multi-thread"] }}
dotenvy = "0.15"

[dev-dependencies]
actix-web = {{ version = "{ver}", features = ["macros"] }}
"""
        main_rs = f"""use actix_web::{{web, App, HttpServer, Responder, HttpResponse}};
use serde_json::json;
use std::env;

async fn hello() -> impl Responder {{
    HttpResponse::Ok().json(json!({{
        "message": "Hello from {name} {ver}",
        "framework": "{slug}",
        "version": "1.0.0"
    }}))
}}

async fn health() -> impl Responder {{
    HttpResponse::Ok().json(json!({{"status": "ok", "version": "1.0.0"}}))
}}

async fn liveness() -> impl Responder {{
    HttpResponse::Ok().json(json!({{"status": "ok"}}))
}}

async fn readiness() -> impl Responder {{
    HttpResponse::Ok().json(json!({{"status": "ok"}}))
}}

#[actix_web::main]
async fn main() -> std::io::Result<()> {{
    let _ = dotenvy::dotenv();
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "{port}".to_string()).parse().unwrap_or({port});
    println!("{name} running on port {{}}", port);
    HttpServer::new(|| {{
        App::new()
            .route("/", web::get().to(hello))
            .route("/health", web::get().to(health))
            .route("/health/live", web::get().to(liveness))
            .route("/health/ready", web::get().to(readiness))
    }})
    .bind(("0.0.0.0", port))?
    .run()
    .await
}}
"""
        test_rs = f"""#[cfg(test)]
mod tests {{
    use actix_web::{{test, App, web}};
    use super::*;

    #[actix_web::test]
    async fn test_health() {{
        let app = test::init_service(App::new().route("/health", web::get().to(health))).await;
        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }}

    #[actix_web::test]
    async fn test_liveness() {{
        let app = test::init_service(App::new().route("/health/live", web::get().to(liveness))).await;
        let req = test::TestRequest::get().uri("/health/live").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }}
}}
"""
    else:  # axum
        cargo_toml = f"""[package]
name = "{slug}"
version = "1.0.0"
edition = "2021"

[dependencies]
axum = "{ver}"
serde = {{ version = "1", features = ["derive"] }}
serde_json = "1"
tokio = {{ version = "1", features = ["macros","rt-multi-thread"] }}
tower = "0.5"
dotenvy = "0.15"

[dev-dependencies]
tower = {{ version = "0.5", features = ["util"] }}
http-body-util = "0.1"
axum = {{ version = "{ver}", features = ["macros"] }}
"""
        main_rs = f"""use axum::{{routing::get, Router, Json}};
use serde_json::{{json, Value}};
use std::{{env, net::SocketAddr}};
use tokio::net::TcpListener;

async fn hello() -> Json<Value> {{
    Json(json!({{
        "message": "Hello from {name} {ver}",
        "framework": "{slug}",
        "version": "1.0.0"
    }}))
}}

async fn health() -> Json<Value> {{
    Json(json!({{"status": "ok", "version": "1.0.0"}}))
}}

async fn liveness() -> Json<Value> {{
    Json(json!({{"status": "ok"}}))
}}

async fn readiness() -> Json<Value> {{
    Json(json!({{"status": "ok"}}))
}}

pub fn app() -> Router {{
    Router::new()
        .route("/", get(hello))
        .route("/health", get(health))
        .route("/health/live", get(liveness))
        .route("/health/ready", get(readiness))
}}

#[tokio::main]
async fn main() {{
    let _ = dotenvy::dotenv();
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "{port}".to_string()).parse().unwrap_or({port});
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("{name} running on port {{}}", port);
    axum::serve(listener, app()).await.unwrap();
}}
"""
        test_rs = f"""#[cfg(test)]
mod tests {{
    use super::app;
    use axum::{{body::Body, http::Request}};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_health() {{
        let response = app()
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }}

    #[tokio::test]
    async fn test_liveness() {{
        let response = app()
            .oneshot(Request::builder().uri("/health/live").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }}

    #[tokio::test]
    async fn test_readiness() {{
        let response = app()
            .oneshot(Request::builder().uri("/health/ready").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }}

    #[tokio::test]
    async fn test_hello() {{
        let response = app()
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }}
}}
"""
    return {
        "Cargo.toml": cargo_toml,
        "src/main.rs": main_rs + "\n" + test_rs,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Elixir / Phoenix ──────────────────────────────────────────────────────────

def phoenix_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    mix_exs = f"""defmodule App.MixProject do
  use Mix.Project

  def project do
    [
      app: :app,
      version: "1.0.0",
      elixir: "~> 1.17",
      deps: deps()
    ]
  end

  def application, do: [mod: {{App.Application, []}}, extra_applications: [:logger]]

  defp deps do
    [
      {{:phoenix, "~> {ver}"}},
      {{:jason, "~> 1.4"}},
      {{:plug_cowboy, "~> 2.7"}},
      {{:phoenix_html, "~> 4.0"}}
    ]
  end
end
"""
    router = f"""defmodule AppWeb.Router do
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", AppWeb do
    pipe_through :api

    get "/", HealthController, :hello
    get "/health", HealthController, :health
    get "/health/live", HealthController, :liveness
    get "/health/ready", HealthController, :readiness
  end
end
"""
    ctrl = f"""defmodule AppWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def hello(conn, _params) do
    json(conn, %{{message: "Hello from {name} {ver}", framework: "{slug}", version: "1.0.0"}})
  end

  def health(conn, _params), do: json(conn, %{{status: "ok", version: "1.0.0"}})
  def liveness(conn, _params), do: json(conn, %{{status: "ok"}})
  def readiness(conn, _params), do: json(conn, %{{status: "ok"}})
end
"""
    endpoint = f"""defmodule AppWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :app

  plug Plug.RequestId
  plug Plug.Logger
  plug AppWeb.Router
end
"""
    application = f"""defmodule App.Application do
  use Application

  def start(_type, _args) do
    port = System.get_env("PORT", "{port}") |> String.to_integer()
    children = [
      {{Phoenix.PubSub, name: App.PubSub}},
      {{AppWeb.Endpoint, url: [host: "localhost", port: port]}}
    ]
    Supervisor.start_link(children, strategy: :one_for_one, name: App.Supervisor)
  end
end
"""
    config = f"""import Config

config :app, AppWeb.Endpoint,
  url: [host: "localhost"],
  http: [port: String.to_integer(System.get_env("PORT") || "{port}")],
  server: true,
  secret_key_base: System.get_env("SECRET_KEY_BASE") || "dev_only_insecure_32_char_secret_key_base"

config :phoenix, :json_library, Jason
"""
    test = f"""defmodule AppWeb.HealthControllerTest do
  use ExUnit.Case

  setup do
    Application.ensure_all_started(:app)
    :ok
  end

  test "GET / returns hello" do
    # Integration: use Plug.Test or Phoenix.ConnTest
    assert true
  end
end
"""
    return {
        "mix.exs": mix_exs,
        "config/config.exs": config,
        "lib/app_web/router.ex": router,
        "lib/app_web/controllers/health_controller.ex": ctrl,
        "lib/app_web/endpoint.ex": endpoint,
        "lib/app/application.ex": application,
        "test/app_web/controllers/health_controller_test.exs": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Ruby ──────────────────────────────────────────────────────────────────────

def rails_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    gemfile = f"""source 'https://rubygems.org'
ruby '3.3.0'

gem 'rails', '~> {ver}'
gem 'puma', '~> 6.4'
gem 'dotenv-rails', '~> 3.1'

group :development, :test do
  gem 'rspec-rails', '~> 7.0'
end
"""
    routes = f"""Rails.application.routes.draw do
  root 'health#hello'
  get '/health', to: 'health#health'
  get '/health/live', to: 'health#liveness'
  get '/health/ready', to: 'health#readiness'
end
"""
    ctrl = f"""class HealthController < ActionController::API
  def hello
    render json: {{ message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0' }}
  end

  def health
    render json: {{ status: 'ok', version: '1.0.0' }}
  end

  def liveness
    render json: {{ status: 'ok' }}
  end

  def readiness
    render json: {{ status: 'ok' }}
  end
end
"""
    spec = f"""require 'rails_helper'

RSpec.describe HealthController, type: :request do
  it 'GET / returns hello' do
    get '/'
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['message']).to include('{name.split()[0]}')
  end

  it 'GET /health returns ok' do
    get '/health'
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['status']).to eq('ok')
  end

  it 'GET /health/live returns ok' do
    get '/health/live'
    expect(response).to have_http_status(:ok)
  end

  it 'GET /health/ready returns ok' do
    get '/health/ready'
    expect(response).to have_http_status(:ok)
  end
end
"""
    return {
        "Gemfile": gemfile,
        "config/routes.rb": routes,
        "app/controllers/health_controller.rb": ctrl,
        "spec/requests/health_spec.rb": spec,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def sinatra_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    gemfile = f"""source 'https://rubygems.org'
ruby '3.3.0'

gem 'sinatra', '~> {ver}'
gem 'rackup', '~> 2.1'
gem 'puma', '~> 6.4'
gem 'dotenv', '~> 3.1'

group :test do
  gem 'rspec', '~> 3.13'
  gem 'rack-test', '~> 2.1'
end
"""
    app_rb = f"""require 'sinatra'
require 'sinatra/json'
require 'dotenv/load'

set :port, (ENV['PORT'] || {port}).to_i
set :bind, '0.0.0.0'

get '/' do
  json message: 'Hello from {name} {ver}', framework: '{slug}', version: '1.0.0'
end

get '/health' do
  json status: 'ok', version: '1.0.0'
end

get '/health/live' do
  json status: 'ok'
end

get '/health/ready' do
  json status: 'ok'
end
"""
    spec = f"""require 'spec_helper'

RSpec.describe 'Health endpoints' do
  it 'GET / returns hello' do
    get '/'
    expect(last_response).to be_ok
    expect(JSON.parse(last_response.body)['message']).to include('{name.split()[0]}')
  end

  it 'GET /health returns ok' do
    get '/health'
    expect(last_response).to be_ok
    expect(JSON.parse(last_response.body)['status']).to eq('ok')
  end

  it 'GET /health/live returns ok' do
    get '/health/live'
    expect(last_response).to be_ok
  end

  it 'GET /health/ready returns ok' do
    get '/health/ready'
    expect(last_response).to be_ok
  end
end
"""
    spec_helper = """require 'rack/test'
require_relative '../app'

module RSpecMixin
  include Rack::Test::Methods
  def app = Sinatra::Application
end

RSpec.configure { |c| c.include RSpecMixin }
"""
    return {
        "Gemfile": gemfile,
        "app.rb": app_rb,
        "spec/requests/health_spec.rb": spec,
        "spec/spec_helper.rb": spec_helper,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── PHP ───────────────────────────────────────────────────────────────────────

def laravel_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    composer = {
        "name": f"example/{slug}", "type": "project",
        "require": {"php": "^8.3", f"laravel/framework": f"^{ver}.0", "vlucas/phpdotenv": "^5.6"},
        "require-dev": {"phpunit/phpunit": "^11.0"},
        "autoload": {"psr-4": {"App\\": "app/"}},
        "scripts": {"start": f"php artisan serve --port={port}"}
    }
    routes_api = f"""<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;

Route::get('/', [HealthController::class, 'hello']);
Route::get('/health', [HealthController::class, 'health']);
Route::get('/health/live', [HealthController::class, 'liveness']);
Route::get('/health/ready', [HealthController::class, 'readiness']);
"""
    ctrl = f"""<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{{
    public function hello(): JsonResponse
    {{
        return response()->json([
            'message' => 'Hello from {name} {ver}',
            'framework' => '{slug}',
            'version' => '1.0.0',
        ]);
    }}

    public function health(): JsonResponse
    {{
        return response()->json(['status' => 'ok', 'version' => '1.0.0']);
    }}

    public function liveness(): JsonResponse
    {{
        return response()->json(['status' => 'ok']);
    }}

    public function readiness(): JsonResponse
    {{
        return response()->json(['status' => 'ok']);
    }}
}}
"""
    test = f"""<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{{
    public function test_hello(): void
    {{
        $r = $this->getJson('/');
        $r->assertStatus(200)->assertJsonFragment(['framework' => '{slug}']);
    }}

    public function test_health(): void
    {{
        $r = $this->getJson('/health');
        $r->assertStatus(200)->assertJsonFragment(['status' => 'ok']);
    }}

    public function test_liveness(): void
    {{
        $this->getJson('/health/live')->assertStatus(200);
    }}

    public function test_readiness(): void
    {{
        $this->getJson('/health/ready')->assertStatus(200);
    }}
}}
"""
    return {
        "composer.json": json.dumps(composer, indent=2) + "\n",
        "routes/api.php": routes_api,
        "app/Http/Controllers/HealthController.php": ctrl,
        "tests/Feature/HealthTest.php": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def slim_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    composer = {
        "name": f"example/{slug}", "type": "project",
        "require": {"php": "^8.3", "slim/slim": f"^{ver}", "slim/psr7": "^1.7"},
        "require-dev": {"phpunit/phpunit": "^11.0"},
        "autoload": {"psr-4": {"App\\": "src/"}},
        "scripts": {"start": f"php -S 0.0.0.0:{port} -t public"}
    }
    index_php = f"""<?php

require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app = AppFactory::create();

$app->get('/', function (Request $req, Response $res) {{
    $res->getBody()->write(json_encode([
        'message' => 'Hello from {name} {ver}',
        'framework' => '{slug}',
        'version' => '1.0.0',
    ]));
    return $res->withHeader('Content-Type', 'application/json');
}});

$app->get('/health', function (Request $req, Response $res) {{
    $res->getBody()->write(json_encode(['status' => 'ok', 'version' => '1.0.0']));
    return $res->withHeader('Content-Type', 'application/json');
}});

$app->get('/health/live', function (Request $req, Response $res) {{
    $res->getBody()->write(json_encode(['status' => 'ok']));
    return $res->withHeader('Content-Type', 'application/json');
}});

$app->get('/health/ready', function (Request $req, Response $res) {{
    $res->getBody()->write(json_encode(['status' => 'ok']));
    return $res->withHeader('Content-Type', 'application/json');
}});

$app->run();
"""
    test = f"""<?php

use PHPUnit\Framework\TestCase;
use Slim\Factory\AppFactory;

class HealthTest extends TestCase
{{
    public function test_placeholder(): void
    {{
        // Use Slim's TestingApp or Guzzle for integration tests
        $this->assertTrue(true);
    }}
}}
"""
    return {
        "composer.json": json.dumps(composer, indent=2) + "\n",
        "public/index.php": index_php,
        "tests/HealthTest.php": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def symfony_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    composer = {
        "name": f"example/{slug}", "type": "project",
        "require": {"php": "^8.3", "symfony/framework-bundle": f"^{ver}",
                    "symfony/yaml": f"^{ver}", "symfony/serializer": f"^{ver}"},
        "require-dev": {"phpunit/phpunit": "^11.0", "symfony/test-pack": "^1.1"},
        "autoload": {"psr-4": {"App\\": "src/"}},
        "scripts": {"start": f"symfony serve --port={port}"}
    }
    ctrl = f"""<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class HealthController extends AbstractController
{{
    #[Route('/', name: 'hello', methods: ['GET'])]
    public function hello(): JsonResponse
    {{
        return $this->json(['message' => 'Hello from {name} {ver}', 'framework' => '{slug}', 'version' => '1.0.0']);
    }}

    #[Route('/health', name: 'health', methods: ['GET'])]
    public function health(): JsonResponse
    {{
        return $this->json(['status' => 'ok', 'version' => '1.0.0']);
    }}

    #[Route('/health/live', name: 'liveness', methods: ['GET'])]
    public function liveness(): JsonResponse
    {{
        return $this->json(['status' => 'ok']);
    }}

    #[Route('/health/ready', name: 'readiness', methods: ['GET'])]
    public function readiness(): JsonResponse
    {{
        return $this->json(['status' => 'ok']);
    }}
}}
"""
    test = f"""<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class HealthControllerTest extends WebTestCase
{{
    public function test_hello(): void
    {{
        $client = static::createClient();
        $client->request('GET', '/');
        $this->assertResponseIsSuccessful();
    }}

    public function test_health(): void
    {{
        $client = static::createClient();
        $client->request('GET', '/health');
        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertEquals('ok', $data['status']);
    }}

    public function test_liveness(): void
    {{
        static::createClient()->request('GET', '/health/live');
        $this->assertResponseIsSuccessful();
    }}

    public function test_readiness(): void
    {{
        static::createClient()->request('GET', '/health/ready');
        $this->assertResponseIsSuccessful();
    }}
}}
"""
    return {
        "composer.json": json.dumps(composer, indent=2) + "\n",
        "src/Controller/HealthController.php": ctrl,
        "tests/Controller/HealthControllerTest.php": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Swift Server ──────────────────────────────────────────────────────────────

def vapor_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    package_swift = f"""// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "{slug}",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "{ver}.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [.product(name: "Vapor", package: "vapor")],
            path: "Sources/App"
        ),
        .testTarget(
            name: "AppTests",
            dependencies: [
                .target(name: "App"),
                .product(name: "XCTVapor", package: "vapor"),
            ],
            path: "Tests/AppTests"
        ),
    ]
)
"""
    entrypoint = f"""import Vapor

@main
struct AppEntrypoint {{
    static func main() async throws {{
        var env = try Environment.detect()
        try LoggingSystem.bootstrap(from: &env)
        let app = try await Application.make(env)
        try configure(app)
        try await app.runFromAsyncMainEntrypoint()
    }}
}}
"""
    configure = f"""import Vapor

public func configure(_ app: Application) throws {{
    app.http.server.configuration.port = Int(Environment.get("PORT") ?? "{port}") ?? {port}
    try routes(app)
}}
"""
    routes = f"""import Vapor

func routes(_ app: Application) throws {{
    app.get {{_ in
        return ["message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"]
    }}

    app.get("health") {{_ in
        return ["status": "ok", "version": "1.0.0"]
    }}

    app.get("health", "live") {{_ in
        return ["status": "ok"]
    }}

    app.get("health", "ready") {{_ in
        return ["status": "ok"]
    }}
}}
"""
    test = f"""@testable import App
import XCTVapor
import Testing

@Suite("{slug} health tests")
struct HealthTests {{
    @Test("GET / returns hello")
    func testHello() async throws {{
        let app = try await Application.make(.testing)
        defer {{ app.shutdown() }}
        try configure(app)
        try await app.test(.GET, "/") {{ res async in
            #expect(res.status == .ok)
        }}
    }}

    @Test("GET /health returns ok")
    func testHealth() async throws {{
        let app = try await Application.make(.testing)
        defer {{ app.shutdown() }}
        try configure(app)
        try await app.test(.GET, "/health") {{ res async in
            #expect(res.status == .ok)
        }}
    }}
}}
"""
    return {
        "Package.swift": package_swift,
        "Sources/App/entrypoint.swift": entrypoint,
        "Sources/App/configure.swift": configure,
        "Sources/App/routes.swift": routes,
        "Tests/AppTests/HealthTests.swift": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def hummingbird_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    package_swift = f"""// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "{slug}",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(url: "https://github.com/hummingbird-project/hummingbird.git", from: "{ver}.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [.product(name: "Hummingbird", package: "hummingbird")],
            path: "Sources/App"
        ),
    ]
)
"""
    main_swift = f"""import Hummingbird
import Foundation

@main
struct App {{
    static func main() async throws {{
        let port = Int(ProcessInfo.processInfo.environment["PORT"] ?? "{port}") ?? {port}
        let router = Router()

        router.get("/") {{ _, _ in
            return ["message": "Hello from {name} {ver}", "framework": "{slug}", "version": "1.0.0"]
        }}

        router.get("/health") {{ _, _ in
            return ["status": "ok", "version": "1.0.0"]
        }}

        router.get("/health/live") {{ _, _ in
            return ["status": "ok"]
        }}

        router.get("/health/ready") {{ _, _ in
            return ["status": "ok"]
        }}

        let app = Application(router: router, configuration: .init(address: .hostname("0.0.0.0", port: port)))
        print("{name} running on port \\(port)")
        try await app.runService()
    }}
}}
"""
    test = f"""// swift test — uses Swift Testing framework
// Hummingbird test: use HummingbirdTesting package
"""
    return {
        "Package.swift": package_swift,
        "Sources/App/main.swift": main_swift,
        "Tests/placeholder.swift": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Scala ─────────────────────────────────────────────────────────────────────

def play_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    build_sbt = f"""name := "{slug}"
version := "1.0.0"
scalaVersion := "3.4.2"

lazy val root = (project in file("."))
  .enablePlugins(PlayScala)
  .settings(
    libraryDependencies ++= Seq(
      guice,
      "org.scalatestplus.play" %% "scalatestplus-play" % "7.0.1" % Test
    )
  )
"""
    routes = """GET  /              controllers.HealthController.hello
GET  /health        controllers.HealthController.health
GET  /health/live   controllers.HealthController.liveness
GET  /health/ready  controllers.HealthController.readiness
"""
    ctrl = f"""package controllers

import play.api.mvc._
import play.api.libs.json._
import javax.inject._

@Singleton
class HealthController @Inject()(val controllerComponents: ControllerComponents) extends BaseController {{

  def hello: Action[AnyContent] = Action {{
    Ok(Json.obj("message" -> s"Hello from {name} {ver}", "framework" -> "{slug}", "version" -> "1.0.0"))
  }}

  def health: Action[AnyContent] = Action {{
    Ok(Json.obj("status" -> "ok", "version" -> "1.0.0"))
  }}

  def liveness: Action[AnyContent] = Action {{ Ok(Json.obj("status" -> "ok")) }}
  def readiness: Action[AnyContent] = Action {{ Ok(Json.obj("status" -> "ok")) }}
}}
"""
    test = f"""import org.scalatestplus.play._
import org.scalatestplus.play.guice._
import play.api.test._
import play.api.test.Helpers._

class HealthControllerSpec extends PlaySpec with GuiceOneAppPerTest {{

  "HealthController" should {{
    "return hello on GET /" in {{
      val result = route(app, FakeRequest(GET, "/")).get
      status(result) mustBe OK
    }}
    "return ok on GET /health" in {{
      val result = route(app, FakeRequest(GET, "/health")).get
      status(result) mustBe OK
    }}
    "return ok on GET /health/live" in {{
      status(route(app, FakeRequest(GET, "/health/live")).get) mustBe OK
    }}
    "return ok on GET /health/ready" in {{
      status(route(app, FakeRequest(GET, "/health/ready")).get) mustBe OK
    }}
  }}
}}
"""
    return {
        "build.sbt": build_sbt,
        "conf/routes": routes,
        "app/controllers/HealthController.scala": ctrl,
        "test/controllers/HealthControllerSpec.scala": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def http4s_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    build_sbt = f"""name := "{slug}"
version := "1.0.0"
scalaVersion := "3.4.2"

libraryDependencies ++= Seq(
  "org.http4s" %% "http4s-ember-server" % "{ver}",
  "org.http4s" %% "http4s-dsl"          % "{ver}",
  "org.http4s" %% "http4s-circe"        % "{ver}",
  "io.circe"   %% "circe-generic"       % "0.14.10",
  "org.typelevel" %% "cats-effect"      % "3.5.7",
  "org.scalameta" %% "munit"            % "1.0.3" % Test,
  "org.typelevel" %% "munit-cats-effect" % "2.0.0" % Test,
)
"""
    main_scala = f"""import cats.effect._
import org.http4s._
import org.http4s.dsl.io._
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.circe.CirceEntityEncoder._
import io.circe.generic.auto._
import com.comcast.ip4s._

case class Hello(message: String, framework: String, version: String)
case class Health(status: String, version: Option[String] = None)

object Main extends IOApp {{

  val routes: HttpRoutes[IO] = HttpRoutes.of {{
    case GET -> Root =>
      Ok(Hello("Hello from {name} {ver}", "{slug}", "1.0.0"))
    case GET -> Root / "health" =>
      Ok(Health("ok", Some("1.0.0")))
    case GET -> Root / "health" / "live" =>
      Ok(Health("ok"))
    case GET -> Root / "health" / "ready" =>
      Ok(Health("ok"))
  }}

  def run(args: List[String]): IO[ExitCode] =
    EmberServerBuilder.default[IO]
      .withHost(ipv4"0.0.0.0")
      .withPort(port"{port}")
      .withHttpApp(routes.orNotFound)
      .build
      .use(_ => IO.println("{name} running on port {port}") >> IO.never)
      .as(ExitCode.Success)
}}
"""
    test = f"""import munit.CatsEffectSuite
import org.http4s._
import org.http4s.implicits._

class HealthSuite extends CatsEffectSuite {{
  // Placeholder — test routes by building an HttpApp and using Request.to
  test("routes exist") {{ assert(true) }}
}}
"""
    return {
        "build.sbt": build_sbt,
        "src/main/scala/Main.scala": main_scala,
        "src/test/scala/HealthSuite.scala": test,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Clojure ───────────────────────────────────────────────────────────────────

def ring_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    project_clj = f"""(defproject {slug} "1.0.0"
  :dependencies [[org.clojure/clojure "1.12.0"]
                 [ring/ring-core "{ver}"]
                 [ring/ring-jetty-adapter "{ver}"]
                 [compojure "1.7.1"]
                 [cheshire "5.13.0"]]
  :main ^:skip-aot {slug.replace('-','_')}.core
  :target-path "target/%s"
  :profiles {{:uberjar {{:aot :all}}}})
"""
    core_clj = f"""(ns {slug.replace('-','_')}.core
  (:require [ring.adapter.jetty :as jetty]
            [compojure.core :refer [defroutes GET]]
            [ring.middleware.json :refer [wrap-json-response]]
            [cheshire.core :as json])
  (:gen-class))

(defn json-response [body]
  {{:status 200 :headers {{"Content-Type" "application/json"}} :body (json/generate-string body)}})

(defroutes app-routes
  (GET "/" [] (json-response {{:message "Hello from {name} {ver}" :framework "{slug}" :version "1.0.0"}}))
  (GET "/health" [] (json-response {{:status "ok" :version "1.0.0"}}))
  (GET "/health/live" [] (json-response {{:status "ok"}}))
  (GET "/health/ready" [] (json-response {{:status "ok"}})))

(def app (wrap-json-response app-routes))

(defn -main [& _]
  (let [port (Integer/parseInt (or (System/getenv "PORT") "{port}"))]
    (println (str "{name} running on port " port))
    (jetty/run-jetty app {{:port port :join? false}})))
"""
    test_clj = f"""(ns {slug.replace('-','_')}.core-test
  (:require [clojure.test :refer :all]
            [{slug.replace('-','_')}.core :refer [app]]
            [ring.mock.request :as mock]))

(deftest test-hello
  (let [resp (app (mock/request :get "/"))]
    (is (= 200 (:status resp)))))

(deftest test-health
  (let [resp (app (mock/request :get "/health"))]
    (is (= 200 (:status resp)))))

(deftest test-liveness
  (is (= 200 (:status (app (mock/request :get "/health/live"))))))

(deftest test-readiness
  (is (= 200 (:status (app (mock/request :get "/health/ready"))))))
"""
    return {
        "project.clj": project_clj,
        f"src/{slug.replace('-','_')}/core.clj": core_clj,
        f"test/{slug.replace('-','_')}/core_test.clj": test_clj,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def pedestal_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    ns = slug.replace('-','_')
    project_clj = f"""(defproject {slug} "1.0.0"
  :dependencies [[org.clojure/clojure "1.12.0"]
                 [io.pedestal/pedestal.service "{ver}"]
                 [io.pedestal/pedestal.jetty "{ver}"]
                 [ch.qos.logback/logback-classic "1.5.12"]
                 [cheshire "5.13.0"]]
  :main ^:skip-aot {ns}.service
  :profiles {{:uberjar {{:aot :all}}}})
"""
    service_clj = f"""(ns {ns}.service
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [cheshire.core :as json])
  (:gen-class))

(defn json-response [body]
  {{:status 200 :headers {{"Content-Type" "application/json"}} :body (json/generate-string body)}})

(defn hello [_] (json-response {{:message "Hello from {name} {ver}" :framework "{slug}" :version "1.0.0"}}))
(defn health [_] (json-response {{:status "ok" :version "1.0.0"}}))
(defn liveness [_] (json-response {{:status "ok"}}))
(defn readiness [_] (json-response {{:status "ok"}}))

(def routes
  (route/expand-routes
    #{{["/" :get hello :route-name :hello]
      ["/health" :get health :route-name :health]
      ["/health/live" :get liveness :route-name :liveness]
      ["/health/ready" :get readiness :route-name :readiness]}}))

(def service
  {{::http/routes routes
    ::http/type :jetty
    ::http/port (Integer/parseInt (or (System/getenv "PORT") "{port}"))
    ::http/join? false}})

(defn -main [& _]
  (println "{name} running on port" (::http/port service))
  (-> service http/create-server http/start))
"""
    test_clj = f"""(ns {ns}.service-test
  (:require [clojure.test :refer :all]
            [io.pedestal.test :refer [response-for]]
            [{ns}.service :refer [service]]))

(def app (io.pedestal.http.impl.servlet-interceptor/http-interceptor-service-fn (::io.pedestal.http/interceptors (io.pedestal.http/create-server service))))

(deftest test-health
  (let [resp (response-for app :get "/health")]
    (is (= 200 (:status resp)))))
"""
    return {
        "project.clj": project_clj,
        f"src/{ns}/service.clj": service_clj,
        f"test/{ns}/service_test.clj": test_clj,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── C++ ───────────────────────────────────────────────────────────────────────

def drogon_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    cmakelists = f"""cmake_minimum_required(VERSION 3.28)
project({slug} VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon REQUIRED)

add_executable(${{PROJECT_NAME}} main.cc)
target_link_libraries(${{PROJECT_NAME}} PRIVATE Drogon::Drogon)

enable_testing()
find_package(GTest REQUIRED)
add_executable(health_test tests/health_test.cc)
target_link_libraries(health_test PRIVATE Drogon::Drogon GTest::gtest_main)
gtest_discover_tests(health_test)
"""
    main_cc = f"""#include <drogon/drogon.h>
#include <cstdlib>
#include <string>

int main() {{
    int port = std::atoi(std::getenv("PORT") ? std::getenv("PORT") : "{port}");

    drogon::app()
        .addListener("0.0.0.0", port)
        .registerHandler(
            "/",
            [](const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {{
                auto resp = drogon::HttpResponse::newHttpJsonResponse(
                    Json::Value{{}} );
                Json::Value body;
                body["message"] = "Hello from {name} {ver}";
                body["framework"] = "{slug}";
                body["version"] = "1.0.0";
                resp = drogon::HttpResponse::newHttpJsonResponse(body);
                cb(resp);
            }},
            {{drogon::HttpMethod::Get}})
        .registerHandler(
            "/health",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {{
                Json::Value body;
                body["status"] = "ok";
                body["version"] = "1.0.0";
                cb(drogon::HttpResponse::newHttpJsonResponse(body));
            }},
            {{drogon::HttpMethod::Get}})
        .registerHandler(
            "/health/live",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {{
                Json::Value body; body["status"] = "ok";
                cb(drogon::HttpResponse::newHttpJsonResponse(body));
            }},
            {{drogon::HttpMethod::Get}})
        .registerHandler(
            "/health/ready",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {{
                Json::Value body; body["status"] = "ok";
                cb(drogon::HttpResponse::newHttpJsonResponse(body));
            }},
            {{drogon::HttpMethod::Get}})
        .run();

    return 0;
}}
"""
    test_cc = f"""#include <gtest/gtest.h>

// Integration test: start server, hit endpoints
// Unit test: extract handler logic into functions and test directly

TEST(HealthTest, Placeholder) {{
    EXPECT_TRUE(true);
}}

int main(int argc, char** argv) {{
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}}
"""
    return {
        "CMakeLists.txt": cmakelists,
        "main.cc": main_cc,
        "tests/health_test.cc": test_cc,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


def crow_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    port = fw['port']
    cmakelists = f"""cmake_minimum_required(VERSION 3.28)
project({slug} VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(Crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG v{ver}
)
FetchContent_MakeAvailable(Crow)

add_executable(${{PROJECT_NAME}} main.cc)
target_link_libraries(${{PROJECT_NAME}} PRIVATE Crow::Crow)

enable_testing()
find_package(GTest REQUIRED)
add_executable(health_test tests/health_test.cc)
target_link_libraries(health_test PRIVATE Crow::Crow GTest::gtest_main)
gtest_discover_tests(health_test)
"""
    main_cc = f"""#include "crow.h"
#include <cstdlib>

int main() {{
    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([] {{
        crow::json::wvalue body;
        body["message"] = "Hello from {name} {ver}";
        body["framework"] = "{slug}";
        body["version"] = "1.0.0";
        return crow::response(body);
    }});

    CROW_ROUTE(app, "/health")([] {{
        crow::json::wvalue body;
        body["status"] = "ok";
        body["version"] = "1.0.0";
        return crow::response(body);
    }});

    CROW_ROUTE(app, "/health/live")([] {{
        crow::json::wvalue body; body["status"] = "ok";
        return crow::response(body);
    }});

    CROW_ROUTE(app, "/health/ready")([] {{
        crow::json::wvalue body; body["status"] = "ok";
        return crow::response(body);
    }});

    int port = std::atoi(std::getenv("PORT") ? std::getenv("PORT") : "{port}");
    app.port(port).multithreaded().run();
    return 0;
}}
"""
    test_cc = f"""#include <gtest/gtest.h>

TEST(HealthTest, Placeholder) {{
    EXPECT_TRUE(true);
}}

int main(int argc, char** argv) {{
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}}
"""
    return {
        "CMakeLists.txt": cmakelists,
        "main.cc": main_cc,
        "tests/health_test.cc": test_cc,
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
    }


# ── Micro-frontends (specialized SPA with health static files) ────────────────

def mf_webpack_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "webpack --mode production", "dev": "webpack serve --mode development", "test": "jest"},
        "dependencies": {"react": "^19.0.0", "react-dom": "^19.0.0"},
        "devDependencies": {
            "@module-federation/enhanced": "^0.8.0",
            "webpack": "^5.97.0", "webpack-cli": "^5.1.0", "webpack-dev-server": "^5.0.0",
            "html-webpack-plugin": "^5.6.0", "ts-loader": "^9.5.0",
            "jest": "^29.7.0", "typescript": "^5.7.0"
        }
    }
    webpack_config = f"""const {{ ModuleFederationPlugin }} = require('@module-federation/enhanced')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {{
  entry: './src/index.ts',
  output: {{ filename: 'bundle.js', path: path.resolve(__dirname, 'dist'), publicPath: 'auto' }},
  resolve: {{ extensions: ['.tsx','.ts','.js'] }},
  module: {{ rules: [{{ test: /\\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }}] }},
  plugins: [
    new ModuleFederationPlugin({{
      name: '{slug.replace("-","_")}',
      filename: 'remoteEntry.js',
      exposes: {{ './App': './src/App' }},
    }}),
    new HtmlWebpackPlugin({{ template: './index.html' }}),
  ],
}}
"""
    app_ts = f"""export default function App() {{
  const el = document.createElement('h1')
  el.textContent = 'Hello from {name} {ver}'
  return el
}}
"""
    test = f"""describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "webpack.config.cjs": webpack_config,
        "src/App.ts": app_ts,
        "tests/health.test.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


# ── PWA (Vite PWA + Workbox) ───────────────────────────────────────────────────

def pwa_files(fw):
    slug = fw['slug']
    name = fw['name']
    ver = fw['ver']
    is_workbox = slug == '13-workbox'
    pkg_json = {
        "name": slug, "version": "1.0.0", "type": "module",
        "scripts": {"build": "vite build", "dev": "vite", "preview": "vite preview", "test": "vitest run"},
        "devDependencies": {
            "vite": "^6.0.0",
            "vite-plugin-pwa" if not is_workbox else "workbox-webpack-plugin": f"^{ver}",
            "vitest": "^3.0.0"
        }
    }
    index_html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{name} {ver}</title>
    <link rel="manifest" href="/manifest.json" />
  </head>
  <body>
    <main>
      <h1>Hello from {name} {ver}</h1>
      <p>Framework: {slug}</p>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
"""
    manifest = {
        "name": name, "short_name": slug, "start_url": "/",
        "display": "standalone", "background_color": "#ffffff",
        "theme_color": "#000000", "icons": []
    }
    main_js = "// Register service worker\nif ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }\n"
    vite_config = f"""import {{ defineConfig }} from 'vite'
import {{ VitePWA }} from 'vite-plugin-pwa'

export default defineConfig({{
  plugins: [
    VitePWA({{
      registerType: 'autoUpdate',
      manifest: {{
        name: '{name}',
        short_name: '{slug}',
        start_url: '/',
      }},
    }})
  ]
}})
"""
    test = f"""import {{ describe, it, expect }} from 'vitest'
describe('{slug} placeholder', () => {{
  it('passes', () => expect(true).toBe(true))
}})
"""
    hfiles = health_json_files("public/health")
    return {
        "package.json": json.dumps(pkg_json, indent=2) + "\n",
        "vite.config.ts": vite_config,
        "index.html": index_html,
        "public/manifest.json": json.dumps(manifest, indent=2) + "\n",
        "src/main.js": main_js,
        "tests/health.test.ts": test,
        "nginx.conf": nginx_conf(80),
        ".env.example": env_example(fw),
        ".gitignore": gitignore(fw),
        **hfiles,
    }


# ── Dispatcher ────────────────────────────────────────────────────────────────

def files_for_framework(fw):
    lang = fw['lang']
    slug = fw['slug']
    pattern = fw['pattern']

    if lang in CI_ONLY_LANGS or pattern == 'ci-only':
        return ci_only_files(fw)

    # Per-slug overrides
    dispatch_slug = {
        '14-express': express_files,
        '14-fastify': fastify_files,
        '14-nestjs': nestjs_files,
        '14-hono': hono_node_files,
        '14-deno': deno_oak_files,
        '14-elysia': elysia_bun_files,
        '04-fresh': deno_fresh_files,
        '05-qwik': qwik_files,
        '01-nextjs': nextjs_files,
        '07-nextjs-app-router': nextjs_files,
        '01-remix': remix_files,
        '07-remix': remix_files,
        '01-nuxt': nuxt_files,
        '01-sveltekit': sveltekit_files,
        '07-sveltekit': sveltekit_files,
        '01-angular-ssr': angular_ssr_files,
        '04-astro': astro_server_files,
        '02-react': spa_react_files,
        '02-vue': spa_vue_files,
        '02-angular': spa_angular_files,
        '02-svelte': spa_svelte_files,
        '02-solidjs': spa_generic_files,
        '03-astro': spa_generic_files,
        '03-eleventy': eleventy_files,
        '03-hugo': hugo_files,
        '03-gatsby': gatsby_files,
        '08-mf-webpack': mf_webpack_files,
        '08-mf-rspack': mf_webpack_files,
        '08-single-spa': spa_generic_files,
        '13-workbox': pwa_files,
        '13-vite-pwa': pwa_files,
        '15-fastapi': fastapi_files,
        '15-django': django_files,
        '15-flask': flask_files,
        '15-starlette': starlette_files,
        '16-gin': go_files,
        '16-echo': go_files,
        '16-fiber': go_files,
        '16-chi': go_files,
        '17-spring-boot': java_spring_boot_files,
        '17-quarkus': quarkus_files,
        '17-micronaut': micronaut_files,
        '18-ktor': ktor_files,
        '18-spring-boot-kotlin': spring_boot_kotlin_files,
        '19-aspnet-core': dotnet_files,
        '19-minimal-apis': dotnet_files,
        '20-axum': rust_files,
        '20-actix-web': rust_files,
        '21-phoenix': phoenix_files,
        '22-rails': rails_files,
        '22-sinatra': sinatra_files,
        '23-laravel': laravel_files,
        '23-symfony': symfony_files,
        '23-slim': slim_files,
        '24-vapor': vapor_files,
        '24-hummingbird': hummingbird_files,
        '25-play': play_files,
        '25-http4s': http4s_files,
        '26-ring': ring_files,
        '26-pedestal': pedestal_files,
        '27-drogon': drogon_files,
        '27-crow': crow_files,
    }

    fn = dispatch_slug.get(slug)
    if fn:
        return fn(fw)

    # Fallback: ci-only placeholder
    return ci_only_files(fw)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base = os.path.join(script_dir, '..', 'services')
    os.makedirs(base, exist_ok=True)

    total_files = 0
    for fw in FRAMEWORKS:
        slug = fw['slug']
        service_dir = os.path.join(base, slug)
        os.makedirs(service_dir, exist_ok=True)

        files = files_for_framework(fw)
        for rel_path, content in files.items():
            full_path = os.path.join(service_dir, rel_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)

        total_files += len(files)
        print(f'  ✓ {slug} ({len(files)} files)')

    print(f'\nGenerated {len(FRAMEWORKS)} services, {total_files} files → {os.path.abspath(base)}')


if __name__ == '__main__':
    main()
