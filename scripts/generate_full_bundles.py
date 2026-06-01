#!/usr/bin/env python3
"""
generate_full_bundles.py

Generates the full service bundle for all 106 services in services/.

Per service generates:
  .github/workflows/   (for services that don't have them yet)
  helm/                Chart.yaml + values.yaml + templates/
  kustomize/           base/ + overlays/dev + staging + prod
  catalog-info.yaml    Backstage component registration
  compliance/          fips.yaml hipaa.yaml pipeda.yaml pci.yaml fedramp.yaml
  docker-compose.yml   (backend/SSR/protocol services only)

Usage:
  cd /path/to/pipeline-studio
  python3 scripts/generate_full_bundles.py
  python3 scripts/generate_full_bundles.py --dry-run
  python3 scripts/generate_full_bundles.py --only catalog
  python3 scripts/generate_full_bundles.py --service 14-express
"""

import os
import sys
import shutil
import argparse
from pathlib import Path

# ── Repo root ──────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
SERVICES = ROOT / "services"
WORKFLOW_TEMPLATES = ROOT / "workflow-templates"

# ── Service metadata ───────────────────────────────────────────────────────
# pattern:
#   backend      HTTP API — full bundle (helm, kustomize, docker-compose, auth, ORM)
#   ssr          Server-side rendering — Docker + CI, helm, kustomize
#   spa          Single-page app — CI only, nginx deployment
#   edge         Cloudflare Workers / edge runtime — Wrangler deploy, no Docker
#   pwa          Progressive web app — CI only, static
#   mobile-rn    React Native / Expo / Ionic
#   mobile-ios   iOS native
#   mobile-android  Android native
#   mobile-cross    Flutter / KMP / MAUI
#   mf           Micro-frontend — CI only
#   grpc         gRPC service — backend pattern
#   graphql      GraphQL server — backend pattern
#   websocket    WebSocket server — backend pattern
#
# workflow_source: slug of an existing workflow-templates/ directory to copy from
#   None = already has workflows in services/XX/.github/workflows/

SERVICES_META = [
  # ── 01 SSR / Hybrid ───────────────────────────────────────────────────────
  {"slug":"01-angular-ssr",    "name":"Angular SSR",          "lang":"typescript","port":4000,"pattern":"ssr",     "tier":2,"wf":None},
  {"slug":"01-nextjs",         "name":"Next.js",              "lang":"typescript","port":3000,"pattern":"ssr",     "tier":1,"wf":None},
  {"slug":"01-nuxt",           "name":"Nuxt 3",               "lang":"typescript","port":3000,"pattern":"ssr",     "tier":1,"wf":None},
  {"slug":"01-remix",          "name":"Remix",                "lang":"typescript","port":3000,"pattern":"ssr",     "tier":2,"wf":None},
  {"slug":"01-solid-start",    "name":"SolidStart",           "lang":"typescript","port":3000,"pattern":"ssr",     "tier":2,"wf":"01-sveltekit"},
  {"slug":"01-sveltekit",      "name":"SvelteKit",            "lang":"typescript","port":3000,"pattern":"ssr",     "tier":1,"wf":None},
  # ── 02 SPA ────────────────────────────────────────────────────────────────
  {"slug":"02-angular",        "name":"Angular",              "lang":"typescript","port":80,  "pattern":"spa",     "tier":1,"wf":None},
  {"slug":"02-lit",            "name":"Lit",                  "lang":"javascript","port":80,  "pattern":"spa",     "tier":2,"wf":"02-svelte"},
  {"slug":"02-preact",         "name":"Preact",               "lang":"javascript","port":80,  "pattern":"spa",     "tier":2,"wf":"02-react"},
  {"slug":"02-react",          "name":"React",                "lang":"typescript","port":80,  "pattern":"spa",     "tier":1,"wf":None},
  {"slug":"02-solidjs",        "name":"SolidJS",              "lang":"typescript","port":80,  "pattern":"spa",     "tier":2,"wf":None},
  {"slug":"02-svelte",         "name":"Svelte",               "lang":"typescript","port":80,  "pattern":"spa",     "tier":2,"wf":None},
  {"slug":"02-vue",            "name":"Vue 3",                "lang":"typescript","port":80,  "pattern":"spa",     "tier":1,"wf":None},
  # ── 03 Static site ────────────────────────────────────────────────────────
  {"slug":"03-astro",          "name":"Astro (static)",       "lang":"typescript","port":80,  "pattern":"spa",     "tier":2,"wf":None},
  {"slug":"03-eleventy",       "name":"Eleventy",             "lang":"javascript","port":80,  "pattern":"spa",     "tier":2,"wf":None},
  {"slug":"03-gatsby",         "name":"Gatsby",               "lang":"javascript","port":80,  "pattern":"spa",     "tier":2,"wf":None},
  {"slug":"03-hugo",           "name":"Hugo",                 "lang":"go",        "port":80,  "pattern":"spa",     "tier":2,"wf":None},
  # ── 04 Island architecture ────────────────────────────────────────────────
  {"slug":"04-astro",          "name":"Astro (islands)",      "lang":"typescript","port":3000,"pattern":"ssr",     "tier":2,"wf":None},
  {"slug":"04-fresh",          "name":"Fresh (Deno)",         "lang":"typescript","port":8000,"pattern":"ssr",     "tier":2,"wf":None},
  # ── 05 Resumable ──────────────────────────────────────────────────────────
  {"slug":"05-qwik",           "name":"Qwik",                 "lang":"typescript","port":3000,"pattern":"ssr",     "tier":2,"wf":None},
  # ── 06 Edge ───────────────────────────────────────────────────────────────
  {"slug":"06-hono-edge",      "name":"Hono (Edge)",          "lang":"typescript","port":8787,"pattern":"edge",    "tier":2,"wf":None},
  {"slug":"06-nextjs-edge",    "name":"Next.js Edge",         "lang":"typescript","port":3000,"pattern":"edge",    "tier":2,"wf":None},
  {"slug":"06-remix-cloudflare","name":"Remix Cloudflare",    "lang":"typescript","port":3000,"pattern":"edge",    "tier":2,"wf":None},
  # ── 07 Advanced patterns ──────────────────────────────────────────────────
  {"slug":"07-nextjs-app-router","name":"Next.js App Router", "lang":"typescript","port":3000,"pattern":"ssr",     "tier":1,"wf":None},
  {"slug":"07-remix",          "name":"Remix (advanced)",     "lang":"typescript","port":3000,"pattern":"ssr",     "tier":2,"wf":None},
  {"slug":"07-sveltekit",      "name":"SvelteKit (advanced)", "lang":"typescript","port":3000,"pattern":"ssr",     "tier":2,"wf":None},
  # ── 08 Micro-frontends ────────────────────────────────────────────────────
  {"slug":"08-mf-rspack",      "name":"MF RSpack",            "lang":"typescript","port":80,  "pattern":"mf",      "tier":2,"wf":None},
  {"slug":"08-mf-webpack",     "name":"MF Webpack",           "lang":"typescript","port":80,  "pattern":"mf",      "tier":2,"wf":None},
  {"slug":"08-single-spa",     "name":"Single SPA",           "lang":"typescript","port":80,  "pattern":"mf",      "tier":2,"wf":None},
  # ── 09 Mobile cross-platform ──────────────────────────────────────────────
  {"slug":"09-expo",           "name":"Expo",                 "lang":"typescript","port":None,"pattern":"mobile-rn","tier":1,"wf":None},
  {"slug":"09-ionic",          "name":"Ionic",                "lang":"typescript","port":None,"pattern":"mobile-rn","tier":2,"wf":None},
  {"slug":"09-react-native",   "name":"React Native",         "lang":"typescript","port":None,"pattern":"mobile-rn","tier":1,"wf":None},
  # ── 10 Mobile cross-platform 2 ────────────────────────────────────────────
  {"slug":"10-dotnet-maui",    "name":".NET MAUI",            "lang":"csharp",    "port":None,"pattern":"mobile-cross","tier":2,"wf":None},
  {"slug":"10-flutter",        "name":"Flutter",              "lang":"dart",      "port":None,"pattern":"mobile-cross","tier":1,"wf":None},
  {"slug":"10-kmp",            "name":"Kotlin Multiplatform", "lang":"kotlin",    "port":None,"pattern":"mobile-cross","tier":2,"wf":None},
  # ── 11 iOS native ─────────────────────────────────────────────────────────
  {"slug":"11-objc-uikit",     "name":"ObjC UIKit",           "lang":"objc",      "port":None,"pattern":"mobile-ios","tier":2,"wf":None},
  {"slug":"11-swift-swiftui",  "name":"SwiftUI",              "lang":"swift",     "port":None,"pattern":"mobile-ios","tier":1,"wf":None},
  # ── 12 Android native ─────────────────────────────────────────────────────
  {"slug":"12-java-android",   "name":"Java Android",         "lang":"java",      "port":None,"pattern":"mobile-android","tier":2,"wf":None},
  {"slug":"12-kotlin-jetpack", "name":"Kotlin Jetpack",       "lang":"kotlin",    "port":None,"pattern":"mobile-android","tier":1,"wf":None},
  # ── 13 PWA ────────────────────────────────────────────────────────────────
  {"slug":"13-vite-pwa",       "name":"Vite PWA",             "lang":"typescript","port":80,  "pattern":"pwa",     "tier":2,"wf":None},
  {"slug":"13-workbox",        "name":"Workbox PWA",          "lang":"javascript","port":80,  "pattern":"pwa",     "tier":2,"wf":None},
  # ── 14 Node/Deno/Bun ──────────────────────────────────────────────────────
  {"slug":"14-bun",            "name":"Bun",                  "lang":"typescript","port":3000,"pattern":"backend", "tier":1,"wf":"14-express"},
  {"slug":"14-deno",           "name":"Deno / Oak",           "lang":"typescript","port":8000,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"14-elysia",         "name":"Elysia",               "lang":"typescript","port":3000,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"14-express",        "name":"Express 5",            "lang":"typescript","port":3000,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"14-fastify",        "name":"Fastify",              "lang":"typescript","port":3000,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"14-hono",           "name":"Hono",                 "lang":"typescript","port":3000,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"14-nestjs",         "name":"NestJS",               "lang":"typescript","port":3000,"pattern":"backend", "tier":1,"wf":None},
  # ── 15 Python ─────────────────────────────────────────────────────────────
  {"slug":"15-django",         "name":"Django",               "lang":"python",    "port":8080,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"15-fastapi",        "name":"FastAPI",              "lang":"python",    "port":8080,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"15-flask",          "name":"Flask",                "lang":"python",    "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"15-starlette",      "name":"Starlette",            "lang":"python",    "port":8080,"pattern":"backend", "tier":2,"wf":None},
  # ── 16 Go ─────────────────────────────────────────────────────────────────
  {"slug":"16-chi",            "name":"Chi",                  "lang":"go",        "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"16-echo",           "name":"Echo",                 "lang":"go",        "port":8080,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"16-fiber",          "name":"Fiber",                "lang":"go",        "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"16-gin",            "name":"Gin",                  "lang":"go",        "port":8080,"pattern":"backend", "tier":1,"wf":None},
  # ── 17 Java ───────────────────────────────────────────────────────────────
  {"slug":"17-micronaut",      "name":"Micronaut",            "lang":"java",      "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"17-quarkus",        "name":"Quarkus",              "lang":"java",      "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"17-spring-boot",    "name":"Spring Boot",          "lang":"java",      "port":8080,"pattern":"backend", "tier":1,"wf":None},
  # ── 18 Kotlin ─────────────────────────────────────────────────────────────
  {"slug":"18-ktor",           "name":"Ktor",                 "lang":"kotlin",    "port":8080,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"18-spring-boot-kotlin","name":"Spring Boot Kotlin","lang":"kotlin",    "port":8080,"pattern":"backend", "tier":2,"wf":None},
  # ── 19 .NET ───────────────────────────────────────────────────────────────
  {"slug":"19-aspnet-core",    "name":"ASP.NET Core",         "lang":"csharp",    "port":8080,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"19-minimal-apis",   "name":".NET Minimal APIs",    "lang":"csharp",    "port":8080,"pattern":"backend", "tier":1,"wf":None},
  # ── 20 Rust ───────────────────────────────────────────────────────────────
  {"slug":"20-actix-web",      "name":"Actix Web",            "lang":"rust",      "port":8080,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"20-axum",           "name":"Axum",                 "lang":"rust",      "port":8080,"pattern":"backend", "tier":1,"wf":None},
  # ── 21 Elixir ─────────────────────────────────────────────────────────────
  {"slug":"21-phoenix",        "name":"Phoenix",              "lang":"elixir",    "port":4000,"pattern":"backend", "tier":1,"wf":None},
  # ── 22 Ruby ───────────────────────────────────────────────────────────────
  {"slug":"22-rails",          "name":"Rails",                "lang":"ruby",      "port":3000,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"22-sinatra",        "name":"Sinatra",              "lang":"ruby",      "port":3000,"pattern":"backend", "tier":2,"wf":None},
  # ── 23 PHP ────────────────────────────────────────────────────────────────
  {"slug":"23-laravel",        "name":"Laravel",              "lang":"php",       "port":9000,"pattern":"backend", "tier":1,"wf":None},
  {"slug":"23-slim",           "name":"Slim",                 "lang":"php",       "port":9000,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"23-symfony",        "name":"Symfony",              "lang":"php",       "port":9000,"pattern":"backend", "tier":1,"wf":None},
  # ── 24 Swift ──────────────────────────────────────────────────────────────
  {"slug":"24-hummingbird",    "name":"Hummingbird",          "lang":"swift",     "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"24-vapor",          "name":"Vapor",                "lang":"swift",     "port":8080,"pattern":"backend", "tier":2,"wf":None},
  # ── 25 Scala ──────────────────────────────────────────────────────────────
  {"slug":"25-http4s",         "name":"http4s",               "lang":"scala",     "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"25-play",           "name":"Play Framework",       "lang":"scala",     "port":9000,"pattern":"backend", "tier":2,"wf":None},
  # ── 26 Clojure ────────────────────────────────────────────────────────────
  {"slug":"26-pedestal",       "name":"Pedestal",             "lang":"clojure",   "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"26-ring",           "name":"Ring",                 "lang":"clojure",   "port":8080,"pattern":"backend", "tier":2,"wf":None},
  # ── 27 C++ ────────────────────────────────────────────────────────────────
  {"slug":"27-crow",           "name":"Crow",                 "lang":"cpp",       "port":8080,"pattern":"backend", "tier":2,"wf":None},
  {"slug":"27-drogon",         "name":"Drogon",               "lang":"cpp",       "port":8080,"pattern":"backend", "tier":2,"wf":None},
  # ── 28 gRPC ───────────────────────────────────────────────────────────────
  {"slug":"28-dotnet-grpc",    "name":".NET gRPC",            "lang":"csharp",    "port":5000,"pattern":"grpc",    "tier":1,"wf":"19-aspnet-core"},
  {"slug":"28-go-grpc",        "name":"Go gRPC",              "lang":"go",        "port":50051,"pattern":"grpc",   "tier":1,"wf":"16-gin"},
  {"slug":"28-java-grpc",      "name":"Java gRPC",            "lang":"java",      "port":50051,"pattern":"grpc",   "tier":1,"wf":"17-spring-boot"},
  {"slug":"28-kotlin-grpc",    "name":"Kotlin gRPC",          "lang":"kotlin",    "port":50051,"pattern":"grpc",   "tier":2,"wf":"18-ktor"},
  {"slug":"28-node-grpc",      "name":"Node gRPC",            "lang":"typescript","port":50051,"pattern":"grpc",   "tier":1,"wf":"14-express"},
  {"slug":"28-php-grpc",       "name":"PHP gRPC",             "lang":"php",       "port":50051,"pattern":"grpc",   "tier":2,"wf":"23-laravel"},
  {"slug":"28-python-grpc",    "name":"Python gRPC",          "lang":"python",    "port":50051,"pattern":"grpc",   "tier":1,"wf":"15-fastapi"},
  {"slug":"28-ruby-grpc",      "name":"Ruby gRPC",            "lang":"ruby",      "port":50051,"pattern":"grpc",   "tier":2,"wf":"22-rails"},
  {"slug":"28-rust-grpc",      "name":"Rust gRPC",            "lang":"rust",      "port":50051,"pattern":"grpc",   "tier":1,"wf":"20-axum"},
  {"slug":"28-swift-grpc",     "name":"Swift gRPC",           "lang":"swift",     "port":50051,"pattern":"grpc",   "tier":2,"wf":"24-vapor"},
  # ── 29 GraphQL ────────────────────────────────────────────────────────────
  {"slug":"29-apollo",         "name":"Apollo GraphQL",       "lang":"typescript","port":4000,"pattern":"graphql", "tier":1,"wf":"14-express"},
  {"slug":"29-async-graphql",  "name":"Async-GraphQL (Rust)", "lang":"rust",      "port":8080,"pattern":"graphql", "tier":2,"wf":"20-axum"},
  {"slug":"29-gqlgen",         "name":"gqlgen (Go)",          "lang":"go",        "port":8080,"pattern":"graphql", "tier":1,"wf":"16-gin"},
  {"slug":"29-graphql-ruby",   "name":"GraphQL Ruby",         "lang":"ruby",      "port":3000,"pattern":"graphql", "tier":2,"wf":"22-rails"},
  {"slug":"29-graphql-yoga",   "name":"GraphQL Yoga",         "lang":"typescript","port":4000,"pattern":"graphql", "tier":1,"wf":"14-express"},
  {"slug":"29-hot-chocolate",  "name":"Hot Chocolate (.NET)", "lang":"csharp",    "port":8080,"pattern":"graphql", "tier":2,"wf":"19-aspnet-core"},
  {"slug":"29-spring-graphql", "name":"Spring GraphQL",       "lang":"java",      "port":8080,"pattern":"graphql", "tier":2,"wf":"17-spring-boot"},
  {"slug":"29-strawberry",     "name":"Strawberry (Python)",  "lang":"python",    "port":8080,"pattern":"graphql", "tier":2,"wf":"15-fastapi"},
  # ── 30 WebSocket ──────────────────────────────────────────────────────────
  {"slug":"30-ws-dotnet",      "name":"SignalR (.NET)",       "lang":"csharp",    "port":8080,"pattern":"websocket","tier":2,"wf":"19-aspnet-core"},
  {"slug":"30-ws-elixir",      "name":"Phoenix Channels",     "lang":"elixir",    "port":4000,"pattern":"websocket","tier":1,"wf":"21-phoenix"},
  {"slug":"30-ws-go",          "name":"Gorilla WS (Go)",      "lang":"go",        "port":8080,"pattern":"websocket","tier":2,"wf":"16-gin"},
  {"slug":"30-ws-java",        "name":"Spring WebSocket",     "lang":"java",      "port":8080,"pattern":"websocket","tier":2,"wf":"17-spring-boot"},
  {"slug":"30-ws-node",        "name":"ws (Node)",            "lang":"typescript","port":3000,"pattern":"websocket","tier":1,"wf":"14-express"},
  {"slug":"30-ws-python",      "name":"FastAPI WS",           "lang":"python",    "port":8080,"pattern":"websocket","tier":2,"wf":"15-fastapi"},
  {"slug":"30-ws-ruby",        "name":"Action Cable",         "lang":"ruby",      "port":3000,"pattern":"websocket","tier":2,"wf":"22-rails"},
  {"slug":"30-ws-rust",        "name":"tokio-tungstenite",    "lang":"rust",      "port":8080,"pattern":"websocket","tier":2,"wf":"20-axum"},
]

DEPLOYABLE = {"backend","ssr","grpc","graphql","websocket"}
MOBILE = {"mobile-rn","mobile-ios","mobile-android","mobile-cross"}

# ── Helm templates ─────────────────────────────────────────────────────────

def helm_chart(svc):
    return f"""\
apiVersion: v2
name: {svc['slug']}
description: {svc['name']} service — platform-studio
type: application
version: 0.1.0
appVersion: "1.0.0"
"""

def helm_values(svc):
    port = svc["port"] or 8080
    return f"""\
replicaCount: 1

image:
  repository: ""   # set in CI: ghcr.io/yarova-ca/{svc['slug']}
  pullPolicy: IfNotPresent
  tag: "latest"

nameOverride: ""
fullnameOverride: "{svc['slug']}"

serviceAccount:
  create: true
  name: "{svc['slug']}"

service:
  type: ClusterIP
  port: {port}

ingress:
  enabled: false
  className: "nginx"
  annotations: {{}}
  hosts:
    - host: {svc['slug']}.local
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70

env: {{}}

envFrom: []

livenessProbe:
  httpGet:
    path: /health/live
    port: {port}
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: {port}
  initialDelaySeconds: 5
  periodSeconds: 5
"""

def helm_values_dev(svc):
    return f"""\
replicaCount: 1
image:
  tag: "dev"
resources:
  limits:
    cpu: 200m
    memory: 128Mi
  requests:
    cpu: 50m
    memory: 64Mi
ingress:
  enabled: true
  hosts:
    - host: {svc['slug']}.dev.local
      paths:
        - path: /
          pathType: Prefix
"""

def helm_values_staging(svc):
    return f"""\
replicaCount: 2
image:
  tag: "staging"
resources:
  limits:
    cpu: 500m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
ingress:
  enabled: true
  hosts:
    - host: {svc['slug']}.staging.yarova.ca
      paths:
        - path: /
          pathType: Prefix
"""

def helm_values_prod(svc):
    return f"""\
replicaCount: 3
image:
  tag: "latest"
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 200m
    memory: 256Mi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
ingress:
  enabled: true
  hosts:
    - host: {svc['slug']}.yarova.ca
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: {svc['slug']}-tls
      hosts:
        - {svc['slug']}.yarova.ca
"""

def helm_deployment(svc):
    port = svc["port"] or 8080
    return f"""\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{{{ include "{svc['slug']}.fullname" . }}}}
  labels:
    {{{{- include "{svc['slug']}.labels" . | nindent 4 }}}}
spec:
  {{{{- if not .Values.autoscaling.enabled }}}}
  replicas: {{{{ .Values.replicaCount }}}}
  {{{{- end }}}}
  selector:
    matchLabels:
      {{{{- include "{svc['slug']}.selectorLabels" . | nindent 6 }}}}
  template:
    metadata:
      labels:
        {{{{- include "{svc['slug']}.selectorLabels" . | nindent 8 }}}}
    spec:
      serviceAccountName: {{{{ include "{svc['slug']}.serviceAccountName" . }}}}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: {{{{ .Chart.Name }}}}
          image: "{{{{ .Values.image.repository }}}}:{{{{ .Values.image.tag | default .Chart.AppVersion }}}}"
          imagePullPolicy: {{{{ .Values.image.pullPolicy }}}}
          ports:
            - name: http
              containerPort: {port}
              protocol: TCP
          livenessProbe:
            {{{{- toYaml .Values.livenessProbe | nindent 12 }}}}
          readinessProbe:
            {{{{- toYaml .Values.readinessProbe | nindent 12 }}}}
          resources:
            {{{{- toYaml .Values.resources | nindent 12 }}}}
          {{{{- if .Values.env }}}}
          env:
            {{{{- range $key, $val := .Values.env }}}}
            - name: {{{{ $key }}}}
              value: {{{{ $val | quote }}}}
            {{{{- end }}}}
          {{{{- end }}}}
          {{{{- if .Values.envFrom }}}}
          envFrom:
            {{{{- toYaml .Values.envFrom | nindent 12 }}}}
          {{{{- end }}}}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
"""

def helm_service(svc):
    port = svc["port"] or 8080
    return f"""\
apiVersion: v1
kind: Service
metadata:
  name: {{{{ include "{svc['slug']}.fullname" . }}}}
  labels:
    {{{{- include "{svc['slug']}.labels" . | nindent 4 }}}}
spec:
  type: {{{{ .Values.service.type }}}}
  ports:
    - port: {{{{ .Values.service.port }}}}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{{{- include "{svc['slug']}.selectorLabels" . | nindent 4 }}}}
"""

def helm_ingress(svc):
    return f"""\
{{{{- if .Values.ingress.enabled -}}}}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{{{ include "{svc['slug']}.fullname" . }}}}
  labels:
    {{{{- include "{svc['slug']}.labels" . | nindent 4 }}}}
  {{{{- with .Values.ingress.annotations }}}}
  annotations:
    {{{{- toYaml . | nindent 4 }}}}
  {{{{- end }}}}
spec:
  {{{{- if .Values.ingress.className }}}}
  ingressClassName: {{{{ .Values.ingress.className }}}}
  {{{{- end }}}}
  {{{{- if .Values.ingress.tls }}}}
  tls:
    {{{{- range .Values.ingress.tls }}}}
    - hosts:
        {{{{- range .hosts }}}}
        - {{{{ . | quote }}}}
        {{{{- end }}}}
      secretName: {{{{ .secretName }}}}
    {{{{- end }}}}
  {{{{- end }}}}
  rules:
    {{{{- range .Values.ingress.hosts }}}}
    - host: {{{{ .host | quote }}}}
      http:
        paths:
          {{{{- range .paths }}}}
          - path: {{{{ .path }}}}
            pathType: {{{{ .pathType }}}}
            backend:
              service:
                name: {{{{ include "{svc['slug']}.fullname" $ }}}}
                port:
                  name: http
          {{{{- end }}}}
    {{{{- end }}}}
{{{{- end }}}}
"""

def helm_hpa(svc):
    return f"""\
{{{{- if .Values.autoscaling.enabled }}}}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{{{ include "{svc['slug']}.fullname" . }}}}
  labels:
    {{{{- include "{svc['slug']}.labels" . | nindent 4 }}}}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{{{ include "{svc['slug']}.fullname" . }}}}
  minReplicas: {{{{ .Values.autoscaling.minReplicas }}}}
  maxReplicas: {{{{ .Values.autoscaling.maxReplicas }}}}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{{{ .Values.autoscaling.targetCPUUtilizationPercentage }}}}
{{{{- end }}}}
"""

def helm_helpers(svc):
    return f"""\
{{{{/*
Expand the name of the chart.
*/}}}}
{{{{- define "{svc['slug']}.name" -}}}}
{{{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}}}
{{{{- end }}}}

{{{{- define "{svc['slug']}.fullname" -}}}}
{{{{- if .Values.fullnameOverride }}}}
{{{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}}}
{{{{- else }}}}
{{{{- $name := default .Chart.Name .Values.nameOverride }}}}
{{{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}}}
{{{{- end }}}}
{{{{- end }}}}

{{{{- define "{svc['slug']}.labels" -}}}}
helm.sh/chart: {{{{ include "{svc['slug']}.name" . }}}}-{{{{ .Chart.Version | replace "+" "_" }}}}
{{{{ include "{svc['slug']}.selectorLabels" . }}}}
app.kubernetes.io/version: {{{{ .Chart.AppVersion | quote }}}}
app.kubernetes.io/managed-by: {{{{ .Release.Service }}}}
{{{{- end }}}}

{{{{- define "{svc['slug']}.selectorLabels" -}}}}
app.kubernetes.io/name: {{{{ include "{svc['slug']}.name" . }}}}
app.kubernetes.io/instance: {{{{ .Release.Name }}}}
{{{{- end }}}}

{{{{- define "{svc['slug']}.serviceAccountName" -}}}}
{{{{- if .Values.serviceAccount.create }}}}
{{{{- default (include "{svc['slug']}.fullname" .) .Values.serviceAccount.name }}}}
{{{{- else }}}}
{{{{- default "default" .Values.serviceAccount.name }}}}
{{{{- end }}}}
{{{{- end }}}}
"""

def helm_sa(svc):
    return f"""\
{{{{- if .Values.serviceAccount.create -}}}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{{{ include "{svc['slug']}.serviceAccountName" . }}}}
  labels:
    {{{{- include "{svc['slug']}.labels" . | nindent 4 }}}}
{{{{- end }}}}
"""

# ── Kustomize templates ────────────────────────────────────────────────────

def kust_base_deployment(svc):
    port = svc["port"] or 8080
    return f"""\
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {svc['slug']}
  labels:
    app: {svc['slug']}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: {svc['slug']}
  template:
    metadata:
      labels:
        app: {svc['slug']}
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      containers:
        - name: {svc['slug']}
          image: ghcr.io/yarova-ca/{svc['slug']}:latest
          ports:
            - containerPort: {port}
          livenessProbe:
            httpGet:
              path: /health/live
              port: {port}
          readinessProbe:
            httpGet:
              path: /health/ready
              port: {port}
          resources:
            limits:
              cpu: 500m
              memory: 256Mi
            requests:
              cpu: 100m
              memory: 128Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
"""

def kust_base_service(svc):
    port = svc["port"] or 8080
    return f"""\
apiVersion: v1
kind: Service
metadata:
  name: {svc['slug']}
spec:
  selector:
    app: {svc['slug']}
  ports:
    - port: {port}
      targetPort: {port}
      protocol: TCP
"""

def kust_base_kustomization(svc):
    return f"""\
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
commonLabels:
  app.kubernetes.io/name: {svc['slug']}
  app.kubernetes.io/part-of: pipeline-platform
"""

def kust_overlay(svc, env, replicas, tag, namespace):
    port = svc["port"] or 8080
    return f"""\
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: {namespace}
bases:
  - ../../base
images:
  - name: ghcr.io/yarova-ca/{svc['slug']}
    newTag: "{tag}"
patches:
  - target:
      kind: Deployment
      name: {svc['slug']}
    patch: |-
      - op: replace
        path: /spec/replicas
        value: {replicas}
"""

# ── catalog-info.yaml ──────────────────────────────────────────────────────

LANG_TAGS = {
    "typescript": ["javascript","typescript","node"],
    "javascript": ["javascript","node"],
    "python":     ["python"],
    "go":         ["go","golang"],
    "java":       ["java","jvm"],
    "kotlin":     ["kotlin","jvm"],
    "csharp":     ["csharp","dotnet"],
    "rust":       ["rust"],
    "ruby":       ["ruby"],
    "php":        ["php"],
    "elixir":     ["elixir"],
    "scala":      ["scala","jvm"],
    "clojure":    ["clojure","jvm"],
    "cpp":        ["cpp","c++"],
    "swift":      ["swift"],
    "dart":       ["dart","flutter"],
    "objc":       ["objc","ios"],
}

PATTERN_LIFECYCLE = {
    "backend": "production",
    "ssr": "production",
    "spa": "production",
    "edge": "experimental",
    "pwa": "production",
    "mobile-rn": "production",
    "mobile-ios": "production",
    "mobile-android": "production",
    "mobile-cross": "production",
    "mf": "experimental",
    "grpc": "production",
    "graphql": "production",
    "websocket": "production",
}

def catalog_info(svc):
    tags = LANG_TAGS.get(svc["lang"], [svc["lang"]])
    tags += [svc["pattern"], f"tier-{svc['tier']}"]
    tags_yaml = "\n  - ".join(tags)
    lifecycle = PATTERN_LIFECYCLE.get(svc["pattern"], "experimental")
    tier_status = "maintained" if svc["tier"] == 1 else "stable"
    return f"""\
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: {svc['slug']}
  title: "{svc['name']}"
  description: |
    Runnable service starter for {svc['name']}.
    Includes: health endpoints, Dockerfile (all RUNTIME axes), tests,
    GitHub Actions (6 phases), Helm chart, Kustomize overlays, compliance configs.
  tags:
    - {tags_yaml}
  annotations:
    github.com/project-slug: yarova-ca/pipeline-studio
    backstage.io/source-location: url:https://github.com/yarova-ca/pipeline-studio/tree/main/services/{svc['slug']}
    backstage.io/techdocs-ref: url:https://github.com/yarova-ca/pipeline-studio/tree/main
spec:
  type: service
  lifecycle: {lifecycle}
  owner: platform-team
  system: pipeline-platform
  providesApis: []
  dependsOn: []
  profile:
    displayName: "{svc['name']}"
  metadata:
    tier: {svc['tier']}
    tierStatus: {tier_status}
    language: {svc['lang']}
    pattern: {svc['pattern']}
    port: {svc['port'] or 'N/A'}
"""

# ── compliance/ ────────────────────────────────────────────────────────────

def compliance_fips(svc):
    return f"""\
# FIPS 140-2 / FIPS 140-3 compliance config for {svc['slug']}
#
# Apply: docker build --build-arg RUNTIME=fips -t {svc['slug']}:fips .
# Result: runtime image switches from alpine/slim to UBI9 (ubi9/nodejs-22-minimal
#         or equivalent), which uses OpenSSL with FIPS-validated modules.
#
# FIPS 140-2: US government standard for cryptographic modules.
# ubi9: Red Hat Universal Base Image v9 — ships with FIPS-validated OpenSSL.

build_args:
  RUNTIME: fips

runtime_images:
  node:       registry.access.redhat.com/ubi9/nodejs-22-minimal
  python:     registry.access.redhat.com/ubi9/python-312
  java:       registry.access.redhat.com/ubi9/openjdk-21-runtime
  go:         registry.access.redhat.com/ubi9/go-toolset
  dotnet:     mcr.microsoft.com/dotnet/aspnet:9.0-ubi9
  default:    registry.access.redhat.com/ubi9-minimal

pipeline_additions:
  # Phase 2 — PR Gate
  - step: fips-scan
    tool: openscap
    command: oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_stig ubi9.xml
  # Phase 3 — Main Build
  - step: fips-sbom-tag
    action: add label to SBOM indicating FIPS-validated runtime
"""

def compliance_hipaa(svc):
    return f"""\
# HIPAA compliance config for {svc['slug']}
#
# HIPAA: US Health Insurance Portability and Accountability Act.
# Applies to: healthcare, health tech, any service handling PHI (Protected Health Information).
#
# PHI: Protected Health Information — patient names, dates, SSNs, medical records.

required_controls:
  - audit_logging: true       # log every access to PHI with user, timestamp, action
  - encryption_in_transit: true   # TLS 1.2+ for all PHI data in transit
  - encryption_at_rest: true      # AES-256 for PHI at rest
  - access_control: rbac          # role-based — no implicit PHI access
  - session_timeout: 900          # 15 minutes — HIPAA requires automatic logoff
  - mfa_required: true            # for all PHI-accessing roles

pipeline_additions:
  # Phase 2 — PR Gate
  - step: phi-scan
    tool: semgrep
    ruleset: p/hipaa
    action: block on hardcoded PHI patterns or unencrypted storage
  # Phase 3 — Main Build
  - step: audit-log-check
    action: verify audit logging middleware is present
    check: grep -r "auditLog\\|audit_log\\|AuditLog" src/ || exit 1

dockerfile_additions:
  - ENV AUDIT_LOG_ENABLED=true
  - ENV SESSION_TIMEOUT_SECONDS=900
"""

def compliance_pipeda(svc):
    return f"""\
# PIPEDA compliance config for {svc['slug']}
#
# PIPEDA: Personal Information Protection and Electronic Documents Act (Canada).
# Applies to: any service collecting personal data from Canadian residents.
#
# Personal data under PIPEDA: name, email, IP address, location, device ID.

required_controls:
  - data_residency: canada        # personal data must remain in Canada
  - consent_required: true        # explicit consent before collecting personal data
  - breach_notification: 72h      # notify OPC within 72 hours of a breach
  - retention_policy: defined     # define and enforce data retention periods
  - privacy_by_design: true       # privacy controls built in, not bolted on

kubernetes_labels:
  # Kustomize overlays add these labels to all deployments in Canadian regions
  pipeda.ca/data-residency: "canada"
  pipeda.ca/personal-data: "yes"
  pipeda.ca/retention-days: "365"

pipeline_additions:
  # Phase 2 — PR Gate
  - step: pipeda-scan
    tool: semgrep
    ruleset: p/privacy
    action: block on unprotected PII handling
  # Phase 3 — Main Build
  - step: residency-label
    action: add pipeda.ca/* labels to container image
"""

def compliance_pci(svc):
    return f"""\
# PCI DSS compliance config for {svc['slug']}
#
# PCI DSS: Payment Card Industry Data Security Standard.
# Applies to: any service processing, storing, or transmitting cardholder data.
#
# Cardholder data: card number (PAN), cardholder name, expiration date, CVV.

required_controls:
  - no_pan_storage: true          # never store full PAN — tokenize or truncate
  - network_segmentation: true    # cardholder data environment isolated from other systems
  - waf_required: true            # Web Application Firewall in front of all payment endpoints
  - pen_test_annual: true         # annual penetration test required
  - log_retention: 12_months      # all logs retained for 12 months, 3 months immediately accessible
  - tls_minimum: "1.2"            # TLS 1.0 and 1.1 prohibited

pipeline_additions:
  # Phase 2 — PR Gate
  - step: pci-pan-scan
    tool: trufflehog
    action: block on any PAN-like patterns (16-digit numbers)
  - step: dependency-check
    tool: owasp-dependency-check
    action: block on CVSS score >= 7.0
  # Phase 3 — Main Build
  - step: waf-config-check
    action: verify WAF rules are deployed for payment endpoints
"""

def compliance_fedramp(svc):
    return f"""\
# FedRAMP compliance config for {svc['slug']}
#
# FedRAMP: Federal Risk and Authorization Management Program (US).
# Applies to: cloud services sold to US federal agencies.
# Authorization levels: Low / Moderate / High (based on data sensitivity).
#
# FedRAMP Moderate: most federal agency cloud services.
# FedRAMP High: law enforcement, national security systems.

required_controls:
  - fips_140_validated: true      # all cryptography must use FIPS 140-2/3 validated modules
  - continuous_monitoring: true   # monthly vulnerability scans, annual penetration tests
  - incident_response: defined    # documented IR plan, 1-hour notification to agency
  - data_residency: us_only       # all data must remain in US regions
  - mfa_required: true            # PIV/CAC or software MFA for all privileged access
  - authorization_level: moderate # default — upgrade to High for law enforcement

build_args:
  RUNTIME: fips                   # forces UBI9 runtime with FIPS-validated OpenSSL

pipeline_additions:
  # Phase 1 — Local Dev
  - step: ato-checklist
    action: verify Authorization to Operate checklist is current
  # Phase 2 — PR Gate
  - step: fedramp-sast
    tool: codeql
    ruleset: security-and-quality
    action: block on HIGH or CRITICAL findings
  # Phase 3 — Main Build
  - step: fedramp-sbom
    tool: syft
    format: spdx-json
    action: upload SBOM to agency compliance portal
"""

# ── docker-compose.yml ─────────────────────────────────────────────────────

DB_PER_LANG = {
    "typescript": "postgres:16-alpine",
    "javascript": "postgres:16-alpine",
    "python":     "postgres:16-alpine",
    "go":         "postgres:16-alpine",
    "java":       "postgres:16-alpine",
    "kotlin":     "postgres:16-alpine",
    "csharp":     "postgres:16-alpine",
    "rust":       "postgres:16-alpine",
    "ruby":       "postgres:16-alpine",
    "php":        "mysql:8.0",
    "elixir":     "postgres:16-alpine",
    "scala":      "postgres:16-alpine",
    "clojure":    "postgres:16-alpine",
    "cpp":        "postgres:16-alpine",
    "swift":      "postgres:16-alpine",
}

DB_PORT = {
    "postgres:16-alpine": 5432,
    "mysql:8.0":          3306,
}

DB_ENV_POSTGRES = """\
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: {slug}_dev"""

DB_ENV_MYSQL = """\
      MYSQL_ROOT_PASSWORD: devpassword
      MYSQL_DATABASE: {slug}_dev
      MYSQL_USER: app
      MYSQL_PASSWORD: devpassword"""

def docker_compose(svc):
    port = svc["port"] or 8080
    lang = svc["lang"]
    db_image = DB_PER_LANG.get(lang, "postgres:16-alpine")
    db_port = DB_PORT.get(db_image, 5432)
    db_name = "postgres" if "postgres" in db_image else "mysql"
    db_env = DB_ENV_POSTGRES.format(slug=svc["slug"]) if "postgres" in db_image \
             else DB_ENV_MYSQL.format(slug=svc["slug"])
    db_url_env = f"DATABASE_URL=postgresql://app:devpassword@db:{db_port}/{svc['slug']}_dev" \
                 if "postgres" in db_image \
                 else f"DATABASE_URL=mysql://app:devpassword@db:{db_port}/{svc['slug']}_dev"
    return f"""\
# Local development stack for {svc['name']}
# Usage: docker compose up
# App: http://localhost:{port}

services:
  app:
    build:
      context: .
      target: runtime
      args:
        RUNTIME: alpine
    ports:
      - "{port}:{port}"
    environment:
      NODE_ENV: development
      PORT: "{port}"
      {db_url_env}
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src:ro
    restart: unless-stopped

  db:
    image: {db_image}
    environment:{db_env}
    ports:
      - "{db_port}:{db_port}"
    volumes:
      - db_data:/var/lib/{db_name}/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app" if "postgres" in db_image else "mysqladmin ping -h localhost -u app -pdevpassword"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  db_data:
"""

def docker_compose_edge(svc):
    port = svc["port"] or 8787
    return f"""\
# Local development for {svc['name']} (edge/Wrangler)
# Usage: npx wrangler dev
# No Docker needed — Wrangler runs locally.
# This docker-compose runs only supporting services.

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped
"""

# ── Edge workflow ──────────────────────────────────────────────────────────

EDGE_WORKFLOW_BUILD = """\
name: "03 Deploy — Cloudflare Workers"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Cloudflare Workers
        if: github.ref == 'refs/heads/main'
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
"""

# ── Mobile workflow ────────────────────────────────────────────────────────

MOBILE_RN_WORKFLOW = """\
name: "CI — React Native / Expo"

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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - name: TypeScript check
        run: npx tsc --noEmit

  expo-build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive --no-wait
"""

MOBILE_IOS_WORKFLOW = """\
name: "CI — iOS (SwiftUI/UIKit)"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_16.app
      - name: Build
        run: xcodebuild build -scheme App -destination 'platform=iOS Simulator,OS=17,name=iPhone 15'
      - name: Test
        run: xcodebuild test -scheme App -destination 'platform=iOS Simulator,OS=17,name=iPhone 15'
"""

MOBILE_ANDROID_WORKFLOW = """\
name: "CI — Android (Kotlin Jetpack/Java)"

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
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - uses: gradle/actions/setup-gradle@v3
      - name: Build
        run: ./gradlew assembleDebug
      - name: Test
        run: ./gradlew test
      - name: Lint
        run: ./gradlew lint
"""

MOBILE_CROSS_WORKFLOW = """\
name: "CI — Cross-platform Mobile (Flutter/KMP/MAUI)"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  flutter-build:
    if: contains(github.repository, 'flutter')
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.x'
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk

  kmp-build:
    if: contains(github.repository, 'kmp')
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
      - uses: gradle/actions/setup-gradle@v3
      - run: ./gradlew build
"""

# ── Main generation logic ──────────────────────────────────────────────────

def mkfile(path, content, dry_run=False):
    """Write content to path, creating parent dirs as needed."""
    p = Path(path)
    if dry_run:
        print(f"  [DRY] {p.relative_to(ROOT)}")
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")

def copy_workflows(svc, dry_run=False):
    """Copy workflow templates into services/XX/.github/workflows/."""
    svc_wf_dir = SERVICES / svc["slug"] / ".github" / "workflows"
    if svc_wf_dir.exists():
        return  # already has workflows
    source_slug = svc.get("wf") or svc["slug"]
    source_dir = WORKFLOW_TEMPLATES / source_slug
    if not source_dir.exists():
        print(f"  WARN: no workflow template for {svc['slug']} (tried {source_slug})")
        # Generate minimal workflow
        generate_minimal_workflow(svc, dry_run)
        return
    if dry_run:
        print(f"  [DRY] copy workflows {source_slug} → {svc['slug']}/.github/workflows/")
        return
    svc_wf_dir.mkdir(parents=True, exist_ok=True)
    for wf in source_dir.glob("*.yml"):
        shutil.copy2(wf, svc_wf_dir / wf.name)

def generate_minimal_workflow(svc, dry_run=False):
    """Generate a minimal workflow for services with no template."""
    pattern = svc["pattern"]
    wf_dir = SERVICES / svc["slug"] / ".github" / "workflows"
    if pattern == "edge":
        mkfile(wf_dir / "03-build-pr.yml", EDGE_WORKFLOW_BUILD, dry_run)
    elif pattern == "mobile-rn":
        mkfile(wf_dir / "ci.yml", MOBILE_RN_WORKFLOW, dry_run)
    elif pattern == "mobile-ios":
        mkfile(wf_dir / "ci.yml", MOBILE_IOS_WORKFLOW, dry_run)
    elif pattern == "mobile-android":
        mkfile(wf_dir / "ci.yml", MOBILE_ANDROID_WORKFLOW, dry_run)
    elif pattern == "mobile-cross":
        mkfile(wf_dir / "ci.yml", MOBILE_CROSS_WORKFLOW, dry_run)

def generate_helm(svc, dry_run=False):
    """Generate helm/ directory for deployable services."""
    if svc["pattern"] not in DEPLOYABLE and svc["pattern"] not in {"ssr","spa","pwa","mf"}:
        return
    base = SERVICES / svc["slug"] / "helm"
    mkfile(base / "Chart.yaml",          helm_chart(svc),          dry_run)
    mkfile(base / "values.yaml",         helm_values(svc),         dry_run)
    mkfile(base / "values.dev.yaml",     helm_values_dev(svc),     dry_run)
    mkfile(base / "values.staging.yaml", helm_values_staging(svc), dry_run)
    mkfile(base / "values.prod.yaml",    helm_values_prod(svc),    dry_run)
    tpl = base / "templates"
    mkfile(tpl / "_helpers.tpl",      helm_helpers(svc),    dry_run)
    mkfile(tpl / "deployment.yaml",   helm_deployment(svc), dry_run)
    mkfile(tpl / "service.yaml",      helm_service(svc),    dry_run)
    mkfile(tpl / "ingress.yaml",      helm_ingress(svc),    dry_run)
    mkfile(tpl / "hpa.yaml",          helm_hpa(svc),        dry_run)
    mkfile(tpl / "serviceaccount.yaml", helm_sa(svc),       dry_run)

def generate_kustomize(svc, dry_run=False):
    """Generate kustomize/ directory for deployable services."""
    if svc["pattern"] not in DEPLOYABLE and svc["pattern"] not in {"ssr","spa","pwa"}:
        return
    base = SERVICES / svc["slug"] / "kustomize"
    mkfile(base / "base" / "deployment.yaml",   kust_base_deployment(svc),   dry_run)
    mkfile(base / "base" / "service.yaml",       kust_base_service(svc),      dry_run)
    mkfile(base / "base" / "kustomization.yaml", kust_base_kustomization(svc),dry_run)
    mkfile(base / "overlays" / "dev"     / "kustomization.yaml", kust_overlay(svc,"dev",1,"dev","dev"),           dry_run)
    mkfile(base / "overlays" / "staging" / "kustomization.yaml", kust_overlay(svc,"staging",2,"staging","staging"), dry_run)
    mkfile(base / "overlays" / "prod"    / "kustomization.yaml", kust_overlay(svc,"prod",3,"latest","prod"),      dry_run)

def generate_catalog(svc, dry_run=False):
    """Generate catalog-info.yaml for all services."""
    mkfile(SERVICES / svc["slug"] / "catalog-info.yaml", catalog_info(svc), dry_run)

def generate_compliance(svc, dry_run=False):
    """Generate compliance/ configs for all services."""
    comp = SERVICES / svc["slug"] / "compliance"
    mkfile(comp / "fips.yaml",    compliance_fips(svc),    dry_run)
    mkfile(comp / "hipaa.yaml",   compliance_hipaa(svc),   dry_run)
    mkfile(comp / "pipeda.yaml",  compliance_pipeda(svc),  dry_run)
    mkfile(comp / "pci.yaml",     compliance_pci(svc),     dry_run)
    mkfile(comp / "fedramp.yaml", compliance_fedramp(svc), dry_run)

def generate_docker_compose(svc, dry_run=False):
    """Generate docker-compose.yml for backend/SSR/protocol services."""
    if svc["pattern"] in MOBILE or svc["pattern"] in {"spa","pwa","mf"}:
        return
    if svc["pattern"] == "edge":
        content = docker_compose_edge(svc)
    else:
        content = docker_compose(svc)
    # Fix: clean up conditional in docker-compose health check
    content = content.replace(
        'if "postgres" in db_image else "mysqladmin ping -h localhost -u app -pdevpassword"',
        'pg_isready -U app' if 'postgres' in DB_PER_LANG.get(svc['lang'],'postgres') else 'mysqladmin ping -h localhost -u app -pdevpassword'
    )
    mkfile(SERVICES / svc["slug"] / "docker-compose.yml", content, dry_run)

def generate_env_example(svc, dry_run=False):
    """Generate .env.example for deployable services."""
    if svc["pattern"] in MOBILE:
        return
    port = svc["port"] or 8080
    lang = svc["lang"]
    db_image = DB_PER_LANG.get(lang, "postgres:16-alpine")
    db_port = DB_PORT.get(db_image, 5432)
    db_url = f"postgresql://app:devpassword@localhost:{db_port}/{svc['slug']}_dev" \
             if "postgres" in db_image \
             else f"mysql://app:devpassword@localhost:{db_port}/{svc['slug']}_dev"
    content = f"""\
# {svc['name']} — environment variables
# Copy to .env and fill in values before running.
# NEVER commit .env to version control.

NODE_ENV=development
PORT={port}

# Database — used when ORM layer is enabled
DATABASE_URL={db_url}

# Redis — used for session storage and caching
REDIS_URL=redis://localhost:6379

# Auth — OAuth2 provider config (fill in for auth layer)
AUTH_CLIENT_ID=
AUTH_CLIENT_SECRET=
AUTH_CALLBACK_URL=http://localhost:{port}/auth/callback
JWT_SECRET=change-me-in-production-use-at-least-32-chars

# Registry — set by CI, not needed for local dev
REGISTRY=ghcr.io
IMAGE_NAME=yarova-ca/{svc['slug']}
"""
    mkfile(SERVICES / svc["slug"] / ".env.example", content, dry_run)

# ── Entry point ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate full service bundles")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be created, do not write")
    parser.add_argument("--only", choices=["workflows","helm","kustomize","catalog","compliance","compose","env"], help="Generate only one type")
    parser.add_argument("--service", help="Generate for one service slug only")
    args = parser.parse_args()

    services = SERVICES_META
    if args.service:
        services = [s for s in services if s["slug"] == args.service]
        if not services:
            print(f"ERROR: service '{args.service}' not found in metadata")
            sys.exit(1)

    total = len(services)
    for i, svc in enumerate(services, 1):
        svc_path = SERVICES / svc["slug"]
        if not svc_path.exists():
            print(f"SKIP {svc['slug']} — directory not found in services/")
            continue

        print(f"[{i:3}/{total}] {svc['slug']} ({svc['pattern']}, tier {svc['tier']})")

        only = args.only
        dry = args.dry_run

        if not only or only == "workflows":  copy_workflows(svc, dry)
        if not only or only == "helm":       generate_helm(svc, dry)
        if not only or only == "kustomize":  generate_kustomize(svc, dry)
        if not only or only == "catalog":    generate_catalog(svc, dry)
        if not only or only == "compliance": generate_compliance(svc, dry)
        if not only or only == "compose":    generate_docker_compose(svc, dry)
        if not only or only == "env":        generate_env_example(svc, dry)

    print(f"\nDone — processed {total} services.")
    if args.dry_run:
        print("(dry run — no files written)")

if __name__ == "__main__":
    main()
