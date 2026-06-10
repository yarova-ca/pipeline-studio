// Dockerfile generator — ported from v1 index.html CONFIG_FILES['Dockerfile']
// Logic source: lines 7122-7385 of index.html

import type { PipelineConfig } from '../lib/types';

// ── Tool version constants (mirrors TOOL_VERSIONS in v1) ─────────────────────

// These are the v1 pinned versions — update here to update everywhere.
const NODE_BUILDER   = 'node:22-alpine';
const NODE_DISTROLESS = 'gcr.io/distroless/nodejs22-debian12:nonroot';
const PYTHON_BUILDER = 'python:3.12-slim';

// ── Pkg-manager helpers ───────────────────────────────────────────────────────

interface PkgManagerMeta {
  installCmd: string;
  dockerSetup: string;
  dockerCopy:  string;
}

const PKG_MANAGERS: Record<string, PkgManagerMeta> = {
  npm:     { installCmd: 'npm ci --ignore-scripts',                         dockerSetup: '',                                                           dockerCopy: 'COPY package*.json ./' },
  pnpm:    { installCmd: 'pnpm install --frozen-lockfile',                   dockerSetup: 'RUN corepack enable pnpm',                                   dockerCopy: 'COPY package.json pnpm-lock.yaml ./' },
  yarn:    { installCmd: 'yarn install --frozen-lockfile',                   dockerSetup: 'RUN corepack enable yarn',                                   dockerCopy: 'COPY package.json yarn.lock ./' },
  bun:     { installCmd: 'bun install --frozen-lockfile',                    dockerSetup: 'COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun', dockerCopy: 'COPY package.json bun.lockb ./' },
  pip:     { installCmd: 'pip install --no-cache-dir -r requirements.txt',  dockerSetup: '',                                                           dockerCopy: 'COPY requirements.txt ./' },
  poetry:  { installCmd: 'poetry install --no-dev --no-interaction',        dockerSetup: 'RUN pip install poetry==1.8.3 && poetry config virtualenvs.create false', dockerCopy: 'COPY pyproject.toml poetry.lock ./' },
  uv:      { installCmd: 'uv sync --frozen --no-dev',                       dockerSetup: 'RUN pip install uv',                                         dockerCopy: 'COPY pyproject.toml uv.lock ./' },
  maven:   { installCmd: 'mvn dependency:resolve -q',                       dockerSetup: '',                                                           dockerCopy: 'COPY pom.xml ./' },
  gradle:  { installCmd: './gradlew dependencies --no-daemon',               dockerSetup: '',                                                           dockerCopy: 'COPY build.gradle settings.gradle ./\nCOPY gradle ./gradle' },
  go:      { installCmd: 'go mod download',                                 dockerSetup: '',                                                           dockerCopy: 'COPY go.mod go.sum ./' },
  cargo:   { installCmd: 'cargo fetch',                                     dockerSetup: '',                                                           dockerCopy: 'COPY Cargo.toml Cargo.lock ./' },
  bundler: { installCmd: 'bundle install --without development',             dockerSetup: '',                                                           dockerCopy: 'COPY Gemfile Gemfile.lock ./' },
  composer:{ installCmd: 'composer install --no-dev --optimize-autoloader', dockerSetup: '',                                                           dockerCopy: 'COPY composer.json composer.lock ./' },
  dotnet:  { installCmd: 'dotnet restore',                                  dockerSetup: '',                                                           dockerCopy: 'COPY *.csproj ./' },
};

// ── Stack metadata (minimal subset needed for Dockerfile generation) ──────────

interface StackMeta {
  label:        string;
  builder?:     string;
  runtime?:     string;
  buildCmd?:    string;
  staticOutput?: boolean;
  outputDir?:   string;
  port?:        string;
  healthPath?:  string;
  startCmd?:    string;
}

const FRONTEND_STACKS: Record<string, StackMeta> = {
  nextjs:      { label: 'Next.js 15',        staticOutput: false, outputDir: '.next',   port: '3000', healthPath: '/api/health', buildCmd: 'npm run build' },
  react:       { label: 'React SPA',         staticOutput: true,  outputDir: 'build',   port: '80' },
  vue:         { label: 'Vue 3',             staticOutput: true,  outputDir: 'dist',    port: '80' },
  angular:     { label: 'Angular 18',        staticOutput: true,  outputDir: 'dist/app',port: '80', buildCmd: 'ng build' },
  svelte:      { label: 'SvelteKit',         staticOutput: false, outputDir: 'build',   port: '3000', healthPath: '/api/health' },
  nuxt:        { label: 'Nuxt 3',            staticOutput: false, outputDir: '.output', port: '3000', healthPath: '/api/health' },
  mobile:      { label: 'React Native (bare)',staticOutput: false, outputDir: 'N/A' },
  remix:       { label: 'Remix 2',           staticOutput: false, outputDir: 'build',   port: '3000', healthPath: '/api/health' },
  'react-vite':{ label: 'React + Vite',      staticOutput: true,  outputDir: 'dist',    port: '80' },
  gatsby:      { label: 'Gatsby 5',          staticOutput: true,  outputDir: 'public',  port: '80' },
  'vue-vite':  { label: 'Vue 3 + Vite',      staticOutput: true,  outputDir: 'dist',    port: '80' },
  astro:       { label: 'Astro 4',           staticOutput: true,  outputDir: 'dist',    port: '3000', healthPath: '/' },
  'mobile-expo':{ label: 'Expo (managed)',   staticOutput: false, outputDir: 'N/A' },
  solid:       { label: 'SolidStart',        staticOutput: false, outputDir: '.output', port: '3000', healthPath: '/api/health' },
  'solid-vite':{ label: 'Solid + Vite',      staticOutput: true,  outputDir: 'dist',    port: '80' },
  qwik:        { label: 'Qwik City',         staticOutput: false, outputDir: 'server',  port: '3000', healthPath: '/health' },
  tanstack:    { label: 'TanStack Start',    staticOutput: false, outputDir: '.output', port: '3000', healthPath: '/health' },
  'preact-vite':{ label: 'Preact + Vite',    staticOutput: true,  outputDir: 'dist',    port: '80' },
  lit:         { label: 'Lit (Web Components)',staticOutput: true, outputDir: 'dist',   port: '80',  buildCmd: 'rollup -c' },
  redwood:     { label: 'RedwoodJS',         staticOutput: false, outputDir: 'web/dist',port: '8910', healthPath: '/.redwood/functions/healthz', buildCmd: 'yarn rw build' },
  fresh:       { label: 'Fresh (Deno)',      staticOutput: false, outputDir: '_fresh',  port: '8000', healthPath: '/health' },
};

const BACKEND_STACKS: Record<string, StackMeta> = {
  none:           { label: 'None' },
  nodejs:         { label: 'Node.js',         port: '3000', startCmd: 'node src/index.js', healthPath: '/api/health' },
  go:             { label: 'Go',              port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'go build -ldflags="-s -w" -o app ./cmd/...' },
  python:         { label: 'Python',          port: '8000', startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000', healthPath: '/health' },
  java:           { label: 'Java (Spring)',   port: '8080', startCmd: 'java -jar target/*.jar', healthPath: '/actuator/health', buildCmd: 'mvn package -DskipTests -q' },
  dotnet:         { label: '.NET',            port: '8080', startCmd: 'dotnet out/App.dll',     healthPath: '/health',         buildCmd: 'dotnet publish -c Release -o out' },
  rust:           { label: 'Rust',            port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'cargo build --release' },
  ruby:           { label: 'Ruby',            port: '3000', startCmd: 'bundle exec puma',  healthPath: '/health' },
  php:            { label: 'PHP',             port: '8000', startCmd: 'php -S 0.0.0.0:8000 public/index.php', healthPath: '/health' },
  'nodejs-express':{ label: 'Express',        port: '3000', startCmd: 'node src/index.js', healthPath: '/health' },
  'nodejs-fastify':{ label: 'Fastify',        port: '3000', startCmd: 'node src/server.js',healthPath: '/health' },
  'nodejs-nest':  { label: 'NestJS',          port: '3000', startCmd: 'node dist/main.js', healthPath: '/health',    buildCmd: 'npm run build' },
  'nodejs-hono':  { label: 'Hono',            port: '3000', startCmd: 'node src/index.js', healthPath: '/health' },
  'python-fastapi':{ label: 'FastAPI',        port: '8000', startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000', healthPath: '/health' },
  'python-django':{ label: 'Django',          port: '8000', startCmd: 'gunicorn myapp.wsgi:application --bind 0.0.0.0:8000', healthPath: '/health/' },
  'python-flask': { label: 'Flask',           port: '5000', startCmd: 'gunicorn app:app --bind 0.0.0.0:5000', healthPath: '/health' },
  'python-litestar':{ label: 'Litestar',      port: '8000', startCmd: 'uvicorn app:app --host 0.0.0.0 --port 8000', healthPath: '/health' },
  'java-spring':  { label: 'Spring Boot 3',   port: '8080', startCmd: 'java -jar target/*.jar', healthPath: '/actuator/health', buildCmd: 'mvn package -DskipTests -q' },
  'java-quarkus': { label: 'Quarkus',         port: '8080', startCmd: 'java -jar target/*-runner.jar', healthPath: '/q/health', buildCmd: 'mvn package -DskipTests -Dquarkus.package.type=uber-jar' },
  'java-micronaut':{ label: 'Micronaut',      port: '8080', startCmd: 'java -jar target/*.jar', healthPath: '/health',      buildCmd: 'mvn package -DskipTests' },
  'go-gin':       { label: 'Go + gin',        port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  'go-echo':      { label: 'Go + echo',       port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  'go-chi':       { label: 'Go + chi',        port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  'go-stdlib':    { label: 'Go stdlib',       port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  'go-fiber':     { label: 'Go + fiber',      port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  'rust-axum':    { label: 'Axum',            port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'cargo build --release' },
  'rust-actix':   { label: 'Actix-web',       port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'cargo build --release' },
  'rust-rocket':  { label: 'Rocket',          port: '8000', startCmd: '/app',              healthPath: '/health',    buildCmd: 'cargo build --release' },
  'rust-warp':    { label: 'Warp',            port: '8080', startCmd: '/app',              healthPath: '/health',    buildCmd: 'cargo build --release' },
  'ruby-rails':   { label: 'Rails 7',         port: '3000', startCmd: 'bundle exec puma -C config/puma.rb', healthPath: '/health', buildCmd: 'bundle exec rake assets:precompile' },
  'ruby-sinatra': { label: 'Sinatra',         port: '4567', startCmd: 'bundle exec ruby app.rb', healthPath: '/health' },
  'php-laravel':  { label: 'Laravel 11',      port: '8000', startCmd: 'php artisan serve --host=0.0.0.0', healthPath: '/health' },
  'php-symfony':  { label: 'Symfony 7',       port: '8000', startCmd: 'php -S 0.0.0.0:8000 public/index.php', healthPath: '/health' },
  'php-slim':     { label: 'Slim 4',          port: '8000', startCmd: 'php -S 0.0.0.0:8000 public/index.php', healthPath: '/health' },
  'nodejs-koa':   { label: 'Koa',             port: '3000', startCmd: 'node src/index.js', healthPath: '/health' },
  'elixir-phoenix':{ label: 'Phoenix',        port: '4000', startCmd: '_build/prod/rel/myapp/bin/myapp start', healthPath: '/health', buildCmd: 'MIX_ENV=prod mix release' },
  'kotlin-ktor':  { label: 'Ktor',            port: '8080', startCmd: 'build/install/myapp-shadow/bin/myapp', healthPath: '/health', buildCmd: './gradlew installShadowDist' },
  'bun-elysia':   { label: 'Elysia (Bun)',    port: '3000', startCmd: 'bun run src/index.ts', healthPath: '/health' },
  'deno-fresh-api':{ label: 'Fresh API (Deno)',port: '8000', startCmd: 'deno run --allow-net --allow-env main.ts', healthPath: '/health' },
  'python-starlette':{ label: 'Starlette',    port: '8000', startCmd: 'uvicorn app:app --host 0.0.0.0 --port 8000', healthPath: '/health' },
  'java-javalin': { label: 'Javalin',         port: '7070', startCmd: 'java -jar target/*.jar', healthPath: '/health', buildCmd: 'mvn package -DskipTests -q' },
  'swift-vapor':  { label: 'Vapor (Swift)',   port: '8080', startCmd: '/app serve --hostname 0.0.0.0 --port 8080', healthPath: '/health', buildCmd: 'swift build -c release' },
  'elixir-live':  { label: 'Phoenix LiveView',port: '4000', startCmd: '_build/prod/rel/myapp/bin/myapp start', healthPath: '/health', buildCmd: 'MIX_ENV=prod mix release' },
};

// ── beGroup helper ────────────────────────────────────────────────────────────

function beGroupFromKey(beKey: string): string {
  return (beKey.includes('-') ? beKey.split('-')[0] : beKey).toLowerCase();
}

// ── Python CMD builder (same logic as v1 IIFE) ───────────────────────────────

function buildPythonCmd(startCmd: string): string {
  const cmd = startCmd || 'uvicorn main:app --host 0.0.0.0 --port 8000';
  const parts = cmd.split(' ');
  const entry = parts[0];
  const rest = parts.slice(1);
  const moduleMap: Record<string, string> = {
    uvicorn: 'uvicorn', gunicorn: 'gunicorn', hypercorn: 'hypercorn',
    celery: 'celery', flask: 'flask', pytest: 'pytest',
  };
  if (moduleMap[entry]) {
    return `CMD ["-m", "${moduleMap[entry]}", ${rest.map(a => `"${a}"`).join(', ')}]`;
  }
  return `CMD ["${entry}", ${rest.map(a => `"${a}"`).join(', ')}]`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateDockerfile(config: PipelineConfig): string {
  const feKey = config.feKey;
  const beKey = config.beKey;

  const fe = FRONTEND_STACKS[feKey] ?? FRONTEND_STACKS['nextjs'];
  const be = BACKEND_STACKS[beKey]  ?? BACKEND_STACKS['none'];

  const builder      = be.builder ?? fe.builder ?? NODE_BUILDER;
  const runtime      = be.runtime ?? fe.runtime ?? NODE_DISTROLESS;
  const beGroup      = beGroupFromKey(beKey);
  const pm           = PKG_MANAGERS[config.pkgMgr] ?? PKG_MANAGERS['npm'];
  const port         = config.port ?? be.port ?? fe.port ?? '8080';
  const healthPath   = config.healthPath ?? be.healthPath ?? fe.healthPath ?? '/health';
  const startCmd     = be.startCmd ?? '';
  const isNextJS     = feKey === 'nextjs';

  // ── Go ──────────────────────────────────────────────────────────────────────
  if (beGroup === 'go') {
    return `# syntax=docker/dockerfile:1.9
# Go (${be.label ?? 'Go'}) → distroless static

FROM ${builder} AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux ${be.buildCmd ?? 'go build -ldflags="-s -w" -o app ./cmd/...'}

FROM ${runtime}:nonroot AS runtime
COPY --from=builder /app/app /app
USER nonroot
EXPOSE ${port}
CMD ["${startCmd || '/app'}"]`;
  }

  // ── Python ──────────────────────────────────────────────────────────────────
  if (beGroup === 'python') {
    const pkgMgrKey = config.pkgMgr;
    const usePipTarget = pkgMgrKey === 'pip' || !pkgMgrKey;
    const installLayer = usePipTarget
      ? `COPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt --target=/app/deps`
      : `COPY ${pkgMgrKey === 'poetry' ? 'pyproject.toml poetry.lock' : 'pyproject.toml uv.lock'} ./\nRUN ${pm.installCmd || (pkgMgrKey === 'poetry' ? 'poetry install --no-dev' : 'uv sync --frozen --no-dev')}`;
    const runtimeCopy = usePipTarget
      ? `COPY --from=builder /app/deps /app/deps\nCOPY --from=builder /app .\nENV PYTHONPATH=/app/deps`
      : `COPY --from=builder /app .`;

    return `# syntax=docker/dockerfile:1.9
# Python (${be.label ?? 'Python'}) → distroless python3

FROM ${builder || PYTHON_BUILDER} AS builder
WORKDIR /app
${pm.dockerSetup ? pm.dockerSetup + '\n' : ''}${installLayer}

FROM ${runtime}:nonroot AS runtime
WORKDIR /app
${runtimeCopy}
USER nonroot
EXPOSE ${port}
${buildPythonCmd(startCmd)}`;
  }

  // ── Java ────────────────────────────────────────────────────────────────────
  if (beGroup === 'java') {
    return `# syntax=docker/dockerfile:1.9
# Java (${be.label ?? 'Java'}) → distroless java21

FROM ${builder} AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN ${be.buildCmd ?? 'mvn package -DskipTests -q'}

FROM ${runtime}:nonroot AS runtime
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER nonroot
EXPOSE ${port}
CMD ["-jar", "app.jar"]`;
  }

  // ── .NET ─────────────────────────────────────────────────────────────────────
  if (beGroup === 'dotnet') {
    return `# syntax=docker/dockerfile:1.9
# .NET (${be.label ?? '.NET'}) → aspnet runtime

FROM ${builder} AS builder
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN ${be.buildCmd ?? 'dotnet publish -c Release -o out'}

FROM ${runtime} AS runtime
WORKDIR /app
COPY --from=builder /app/out .
USER $APP_UID
EXPOSE ${port}
CMD ["dotnet", "App.dll"]`;
  }

  // ── Rust ─────────────────────────────────────────────────────────────────────
  if (beGroup === 'rust') {
    return `# syntax=docker/dockerfile:1.9
# Rust (${be.label ?? 'Rust'}) → distroless cc

FROM ${builder} AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN cargo fetch
COPY src ./src
RUN ${be.buildCmd ?? 'cargo build --release'}

FROM ${runtime} AS runtime
COPY --from=builder /app/target/release/app /app
USER nonroot
EXPOSE ${port}
CMD ["/app"]`;
  }

  // ── Ruby ─────────────────────────────────────────────────────────────────────
  if (beGroup === 'ruby') {
    const startParts = (startCmd || 'bundle exec puma').split(' ');
    return `# syntax=docker/dockerfile:1.9
# Ruby (${be.label ?? 'Ruby'}) → ruby runtime

FROM ${builder} AS builder
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test
COPY . .
${be.buildCmd ? 'RUN ' + be.buildCmd : ''}

FROM ${runtime} AS runtime
WORKDIR /app
COPY --from=builder /app .
COPY --from=builder /usr/local/bundle /usr/local/bundle
USER nobody
EXPOSE ${port}
CMD ${JSON.stringify(startParts)}`;
  }

  // ── PHP ──────────────────────────────────────────────────────────────────────
  if (beGroup === 'php') {
    const startParts = (startCmd || 'php -S 0.0.0.0:8000 public/index.php').split(' ');
    return `# syntax=docker/dockerfile:1.9
# PHP (${be.label ?? 'PHP'}) → php-fpm runtime
# Non-root via www-data (UID 82 on Alpine PHP) — enforces I-7.

FROM ${builder} AS builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader
COPY . .

FROM ${runtime} AS runtime
WORKDIR /app
COPY --from=builder --chown=www-data:www-data /app .
USER www-data
EXPOSE ${port}
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \\
  CMD wget -qO- http://127.0.0.1:${port}${healthPath} >/dev/null 2>&1 || exit 1
CMD ${JSON.stringify(startParts)}`;
  }

  // ── JavaScript / Node / Frontend ─────────────────────────────────────────────

  // Mobile stacks do not ship containers.
  if (feKey === 'mobile' || feKey === 'mobile-expo') {
    return `# Mobile stack (${fe.label}) does not use containers.
# Build artifact is an APK/IPA via EAS Build or React Native CLI.
# DevSecOps pipeline for mobile must replace S6/S7/S8 with mobile-native steps.`;
  }

  const pmSetup  = pm.dockerSetup ? pm.dockerSetup + '\n' : 'RUN corepack enable 2>/dev/null || true\n';
  const pmCopy   = pm.dockerCopy  ?? 'COPY package*.json ./';
  const outputDir = fe.outputDir ?? 'dist';

  // Branch A — Next.js (standalone output → distroless nodejs)
  if (isNextJS) {
    return `# syntax=docker/dockerfile:1.9
# Next.js 15 → distroless/nodejs22 (standalone build)
# REQUIRED: set output: 'standalone' in next.config.ts/js

FROM ${builder} AS deps
WORKDIR /app
${pmSetup}${pmCopy}
RUN ${pm.installCmd || 'npm ci --ignore-scripts'}

FROM ${builder} AS builder
WORKDIR /app
${pmSetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM ${runtime} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
USER nonroot
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \\
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000${healthPath}').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["server.js"]`;
  }

  // Branch B — Static SPA → nginx
  if (fe.staticOutput === true) {
    return `# syntax=docker/dockerfile:1.9
# ${fe.label} (static SPA) → nginx 1.27-alpine

FROM ${builder} AS deps
WORKDIR /app
${pmSetup}${pmCopy}
RUN ${pm.installCmd || 'npm ci --ignore-scripts'}

FROM ${builder} AS builder
WORKDIR /app
${pmSetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN ${fe.buildCmd ?? 'npm run build'}

FROM nginx:1.27-alpine AS runtime
# Drop privileged ports — nginx unprivileged listens on 8080.
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf \\
 && sed -i 's/listen  \\[::\\]:80;/listen  [::]:8080;/' /etc/nginx/conf.d/default.conf \\
 && chown -R nginx:nginx /var/cache/nginx /var/run /etc/nginx \\
 && sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf \\
 && sed -i '/user.*nginx;/d' /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/${outputDir} /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \\
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]`;
  }

  // Branch C — SSR Node app → distroless/nodejs22:nonroot
  const ssrEntry = feKey === 'remix'  ? 'build/server/index.js'
                 : feKey === 'svelte' ? 'build/index.js'
                 : feKey === 'nuxt'   ? '.output/server/index.mjs'
                 : `${outputDir}/index.js`;
  const ssrPort = fe.port ?? '3000';
  const ssrOutputBase = outputDir.split('/')[0];

  return `# syntax=docker/dockerfile:1.9
# ${fe.label ?? 'App'} (SSR) → distroless/nodejs22

FROM ${builder} AS deps
WORKDIR /app
${pmSetup}${pmCopy}
RUN ${pm.installCmd || 'npm ci --ignore-scripts'}

FROM ${builder} AS builder
WORKDIR /app
${pmSetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN ${fe.buildCmd ?? 'npm run build'}

FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${ssrPort}
ENV HOSTNAME="0.0.0.0"
COPY --from=builder --chown=nonroot:nonroot /app/${ssrOutputBase} ./${ssrOutputBase}
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./package.json
USER nonroot
EXPOSE ${ssrPort}
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \\
  CMD ["node", "-e", "fetch('http://127.0.0.1:${ssrPort}${healthPath}').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["${ssrEntry}"]`;
}
