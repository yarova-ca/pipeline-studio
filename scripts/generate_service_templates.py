#!/usr/bin/env python3
"""
Generate 75 GitHub issue templates for service-starters repo.
One template per framework — covers file structure, routes,
dependencies, build output, tests, .env.example, and checklist.

Output: .github/ISSUE_TEMPLATE/service-scaffold/{slug}.md
"""

import os

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

def get_health_impl(fw):
    lang = fw['lang']
    pattern = fw['pattern']
    port = fw['port'] or 'N/A'

    if pattern == 'ci-only':
        return "No HTTP health endpoints — CI-only artifact output. No server runs."

    if lang in ('nodejs-nginx', 'hugo'):
        return f"""\
Static JSON files (nginx serves them directly — no server-side routing in SPA/SSG):

```
public/
  health          → {{"status":"ok","version":"1.0.0"}}
  health/live     → {{"status":"ok"}}
  health/ready    → {{"status":"ok"}}
```

nginx config: `location /health {{ try_files $uri $uri/ =404; }}`"""

    if lang == 'nodejs-node' or lang in ('deno', 'bun'):
        return f"""\
HTTP route handlers in the app:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","framework":"{fw['slug']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok","version":"1.0.0","uptime":<seconds>}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'python':
        return f"""\
Python route handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","framework":"{fw['slug']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok","version":"1.0.0"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'go':
        return f"""\
Go HTTP handlers (net/http or framework router):

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang in ('java', 'kotlin', 'scala', 'clojure'):
        return f"""\
JVM HTTP handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |

Note: Spring Boot and Quarkus expose `/actuator/health` and `/q/health` — add `/health` alias route."""

    if lang == 'dotnet':
        return f"""\
.NET health check middleware:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"Healthy"}}` |
| `GET /health/live` | `{{"status":"Healthy"}}` |
| `GET /health/ready` | `{{"status":"Healthy"}}` |

Use `app.MapHealthChecks("/health")` with `AddHealthChecks()` in Program.cs."""

    if lang == 'rust':
        return f"""\
Rust async HTTP handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'elixir':
        return f"""\
Elixir/Phoenix route handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'ruby':
        return f"""\
Ruby HTTP route handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'php':
        return f"""\
PHP route handlers (returned as JSON):

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'swift-server':
        return f"""\
Swift HTTP route handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    if lang == 'cpp':
        return f"""\
C++ HTTP route handlers:

| Route | Response |
|---|---|
| `GET /` | `{{"message":"Hello from {fw['name']} {fw['ver']}","version":"1.0.0"}}` |
| `GET /health` | `{{"status":"ok"}}` |
| `GET /health/live` | `{{"status":"ok"}}` |
| `GET /health/ready` | `{{"status":"ok"}}` |"""

    # mobile/flutter/ios
    return "No HTTP health endpoints — native mobile app. No server."


def get_test_section(fw):
    lang = fw['lang']
    pattern = fw['pattern']
    test_runner = fw.get('test') or 'N/A'

    if pattern == 'ci-only' or lang in ('mobile-js', 'flutter', 'dotnet-mobile', 'android-native', 'ios-native', 'edge'):
        return f"""\
**Test runner:** {test_runner}

Unit tests for core business logic.
Integration tests verify build output is valid.
No HTTP health route tests — no server."""

    if lang in ('nodejs-node', 'nodejs-nginx', 'hugo', 'deno', 'bun'):
        runner = fw.get('test', 'vitest')
        return f"""\
**Test runner:** {runner}

File: `src/__tests__/health.test.ts` (or `.spec.ts`)

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body.message` exists |
| `GET /health` | status 200, `body.status === "ok"` |
| `GET /health/live` | status 200, `body.status === "ok"` |
| `GET /health/ready` | status 200, `body.status === "ok"` |

Run: `{fw.get('test','npm test')}`"""

    if lang == 'python':
        return f"""\
**Test runner:** pytest

File: `tests/test_health.py`

| Test | Assertion |
|---|---|
| `GET /` | status 200, `body["message"]` exists |
| `GET /health` | status 200, `body["status"] == "ok"` |
| `GET /health/live` | status 200, `body["status"] == "ok"` |
| `GET /health/ready` | status 200, `body["status"] == "ok"` |

Run: `pytest tests/`"""

    if lang == 'go':
        return f"""\
**Test runner:** Go built-in `testing` package

File: `internal/health/health_test.go`

| Test | Assertion |
|---|---|
| `GET /` | status 200, body contains `message` |
| `GET /health` | status 200, body contains `status: ok` |
| `GET /health/live` | status 200, body contains `status: ok` |
| `GET /health/ready` | status 200, body contains `status: ok` |

Run: `go test ./...`"""

    if lang in ('java', 'kotlin'):
        runner = 'JUnit 5'
        return f"""\
**Test runner:** {runner}

File: `src/test/java/.../HealthControllerTest.java`

| Test | Assertion |
|---|---|
| `GET /` | status 200, response body non-empty |
| `GET /health` | status 200, `status` field present |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `{fw.get('test','mvn test')}`"""

    if lang in ('scala', 'clojure'):
        return f"""\
**Test runner:** built-in (`sbt test` / `lein test`)

File: `src/test/.../HealthSpec` or `test/health_test.clj`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `{fw.get('test','sbt test')}`"""

    if lang == 'dotnet':
        return f"""\
**Test runner:** xUnit

File: `Tests/HealthTests.cs`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, `status: Healthy` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `dotnet test`"""

    if lang == 'rust':
        return f"""\
**Test runner:** built-in `#[tokio::test]`

File: `src/tests/health_test.rs`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `cargo test`"""

    if lang == 'elixir':
        return f"""\
**Test runner:** ExUnit

File: `test/app_web/controllers/health_controller_test.exs`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `mix test`"""

    if lang == 'ruby':
        return f"""\
**Test runner:** RSpec

File: `spec/health_spec.rb`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `bundle exec rspec`"""

    if lang == 'php':
        return f"""\
**Test runner:** PHPUnit

File: `tests/Feature/HealthTest.php`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, JSON `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `./vendor/bin/phpunit`"""

    if lang == 'swift-server':
        return f"""\
**Test runner:** Swift Testing / XCTest

File: `Tests/AppTests/HealthTests.swift`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `swift test`"""

    if lang == 'cpp':
        return f"""\
**Test runner:** CTest + GoogleTest

File: `tests/health_test.cpp`

| Test | Assertion |
|---|---|
| `GET /` | status 200 |
| `GET /health` | status 200, body `status: ok` |
| `GET /health/live` | status 200 |
| `GET /health/ready` | status 200 |

Run: `ctest --test-dir build`"""

    return f"**Test runner:** {test_runner}\n\nRun: `{fw.get('test','N/A')}`"


def get_checklist(fw):
    pattern = fw['pattern']
    lang = fw['lang']
    build_out = fw.get('build_out', 'dist/')
    docker_cmd = fw.get('docker_cmd')
    extra = fw.get('extra_setup', '')

    base = [
        f"Dependencies installed (`{fw.get('pkg','pkg')} install` or equivalent)",
        f"Hello world route `GET /` returns `200` with JSON body",
        f"Health route `GET /health` returns `{{\"status\":\"ok\"}}`",
        f"Liveness route `GET /health/live` returns `{{\"status\":\"ok\"}}`",
        f"Readiness route `GET /health/ready` returns `{{\"status\":\"ok\"}}`",
        f"All tests passing (`{fw.get('test','test command')}`)",
        f"`.env.example` present with all required variables",
        f"Build succeeds (`{fw.get('build_cmd','build command')}`)",
        f"Build output exists at `{build_out}`",
        f"Build output path matches Dockerfile `COPY --from=build` instruction",
    ]

    if pattern == 'multi-stage' and docker_cmd:
        base.append(f"Docker CMD `{docker_cmd}` resolves correctly after build")

    if pattern == 'ci-only':
        base = [
            f"Dependencies installed (`{fw.get('pkg','pkg')} install` or equivalent)",
            f"Unit tests passing (`{fw.get('test','test command')}`)",
            f"Build succeeds (`{fw.get('build_cmd','build command')}`)",
            f"Build artifact exists at `{build_out}`",
            f"`.env.example` present",
        ]

    return '\n'.join(f'- [ ] {item}' for item in base)


def generate_template(fw):
    name = fw['name']
    ver = fw['ver']
    cat = fw['cat']
    slug = fw['slug']
    lang = fw['lang']
    pattern = fw['pattern']
    port = fw['port']
    pkg = fw.get('pkg') or 'N/A'
    test_runner = fw.get('test') or 'N/A'
    build_cmd = fw.get('build_cmd', 'N/A')
    build_out = fw.get('build_out', 'dist/')
    docker_cmd = fw.get('docker_cmd') or 'N/A (no server — static or CI-only)'
    extra = fw.get('extra_setup', '')
    runtime_img = fw.get('runtime_img') or 'N/A — CI-only artifact'

    pattern_label = 'Multi-stage Docker' if pattern == 'multi-stage' else 'CI-only (no Docker)'

    local_dev_cmd = build_cmd.replace('--release','').replace('-DskipTests','').replace('--no-dev','').strip()
    if pkg == 'npm': local_dev = 'npm install && npm run dev'
    elif pkg == 'pnpm': local_dev = 'pnpm install && pnpm dev'
    elif pkg == 'deno': local_dev = 'deno task dev'
    elif pkg == 'bun': local_dev = 'bun install && bun run dev'
    elif pkg == 'pip': local_dev = 'pip install -r requirements.txt && uvicorn main:app --reload'
    elif pkg == 'go': local_dev = 'go run ./...'
    elif pkg == 'mvn': local_dev = 'mvn spring-boot:run'
    elif pkg == 'gradle': local_dev = './gradlew run'
    elif pkg == 'dotnet': local_dev = 'dotnet run'
    elif pkg == 'cargo': local_dev = 'cargo run'
    elif pkg == 'mix': local_dev = 'mix phx.server'
    elif pkg == 'bundler': local_dev = 'bundle exec rails server' if 'rails' in slug else 'bundle exec rackup'
    elif pkg == 'composer': local_dev = 'php artisan serve' if 'laravel' in slug else 'php -S localhost:9000 public/index.php'
    elif pkg == 'swift': local_dev = 'swift run'
    elif pkg == 'sbt': local_dev = 'sbt run'
    elif pkg == 'lein': local_dev = 'lein ring server'
    elif pkg == 'cmake': local_dev = 'cmake --build build && ./build/app'
    elif pkg == 'flutter': local_dev = 'flutter run'
    elif pkg == 'xcode': local_dev = 'Open .xcodeproj in Xcode → Run'
    else: local_dev = f'{pkg} run dev'

    env_vars = f'NODE_ENV=development\nPORT={port or 3000}' if lang in ('nodejs-node','nodejs-nginx','bun') else \
               f'APP_ENV=development\nPORT={port or 8080}' if lang == 'python' else \
               f'APP_ENV=development\nPORT={port or 8080}' if lang == 'go' else \
               f'SPRING_PROFILES_ACTIVE=development\nSERVER_PORT={port or 8080}' if lang == 'java' else \
               f'ASPNETCORE_ENVIRONMENT=Development\nASPNETCORE_URLS=http://+:{port or 8080}' if lang == 'dotnet' else \
               f'RUST_LOG=debug\nPORT={port or 8080}' if lang == 'rust' else \
               f'MIX_ENV=dev\nPHX_HOST=localhost\nPORT={port or 4000}' if lang == 'elixir' else \
               f'RAILS_ENV=development\nPORT={port or 3000}' if lang == 'ruby' else \
               f'APP_ENV=development\nPORT={port or 3000}'

    return f"""\
---
name: "[{cat}] {name} {ver} — service scaffold"
about: "Minimal runnable {name} {ver} service with hello world, health/liveness/readiness endpoints, tests, and .env.example. Run alongside pipeline-studio/{slug} issue for the full picture."
labels: service-scaffold
assignees: ''
---

**Framework:** {name} {ver}
**Category:** {cat}
**Slug:** `{slug}`
**Pattern:** {pattern_label}
**Language / Runtime:** {lang}
**Package manager:** {pkg}
**Test runner:** {test_runner}
**Runtime image:** `{runtime_img}`
**Port:** {port or 'N/A'}

---
## Purpose

This issue tracks creating the minimal runnable starter app for `{name} {ver}`.

Companion issue in `pipeline-studio`: `[{cat}] {name} {ver} — pipeline setup`

Both issues together = a complete project: running app + full CI/CD pipeline.

---
## File structure

```
services/{slug}/
├── .env.example
{"├── package.json" if pkg == 'npm' else "├── go.mod + go.sum" if pkg == 'go' else "├── requirements.txt" if pkg == 'pip' else "├── pom.xml" if pkg == 'mvn' else "├── build.gradle.kts" if pkg == 'gradle' else "├── Cargo.toml" if pkg == 'cargo' else "├── mix.exs + mix.lock" if pkg == 'mix' else "├── Gemfile + Gemfile.lock" if pkg == 'bundler' else "├── composer.json" if pkg == 'composer' else "├── Package.swift" if pkg == 'swift' else "├── build.sbt" if pkg == 'sbt' else "├── project.clj" if pkg == 'lein' else "├── CMakeLists.txt" if pkg == 'cmake' else "├── deno.json" if pkg == 'deno' else "├── pubspec.yaml" if pkg == 'flutter' else "├── {name.lower()}.csproj" if pkg == 'dotnet' else "├── build files"}
├── src/ (or equivalent source directory)
│   ├── main entry point
│   ├── GET / — hello world route
│   ├── GET /health
│   ├── GET /health/live
│   └── GET /health/ready
└── tests/ (or __tests__/ or spec/)
    └── health tests — 4 assertions
```

---
## Routes

{get_health_impl(fw)}

---
## Tests

{get_test_section(fw)}

---
## Build

**Command:** `{build_cmd}`

**Output path:** `{build_out}`

**Docker CMD match:** `{docker_cmd}`

{"**Extra setup:** " + extra if extra else ""}

---
## .env.example

```bash
{env_vars}
```

---
## Local dev

```bash
{local_dev}
# → http://localhost:{port or 3000}
```

---
## Checklist

{get_checklist(fw)}
"""


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    out_dir = os.path.join(repo_root, '.github', 'ISSUE_TEMPLATE', 'service-scaffold')
    os.makedirs(out_dir, exist_ok=True)

    count = 0
    for fw in FRAMEWORKS:
        content = generate_template(fw)
        filename = f"{fw['slug']}.md"
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        count += 1
        print(f"  ✓ {filename}")

    print(f"\nGenerated {count} issue templates → {out_dir}")


if __name__ == '__main__':
    main()
