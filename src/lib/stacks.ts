// Stack definitions — frontend and backend frameworks with all build metadata.
// Fields drive: Dockerfile generation, CI install/test/lint commands, health check paths.
// Verified current as of 2026-05-24.

export type RenderMode =
  | 'hybrid'
  | 'csr'
  | 'ssr'
  | 'ssg'
  | 'islands'
  | 'native'
  | 'fullstack'
  | '';

export interface FrontendStackDef {
  label: string;
  group: string;
  builder: string;
  runtime: string;
  testCmd: string;
  lintCmd: string;
  installCmd: string;
  buildCmd?: string;
  pkgMgr: string;
  pkgMgrOpts: string[];
  port: string;
  pkgFile: string;
  renderMode: RenderMode;
  outputDir: string;
  healthPath: string;
  bundler: string;
  staticOutput: boolean;
}

export interface BackendStackDef {
  label: string;
  group: string;
  builder: string;
  runtime: string;
  testCmd: string;
  lintCmd: string;
  installCmd: string;
  buildCmd?: string;
  pkgMgr: string;
  pkgMgrOpts: string[];
  port: string;
  startCmd?: string;
  pkgFile?: string;
  healthPath: string;
}

export const STACKS: {
  frontend: Record<string, FrontendStackDef>;
  backend: Record<string, BackendStackDef>;
} = {
  frontend: {
    // ── Legacy keys (backward compat) ────────────────────────────────────────
    nextjs: {
      label: 'Next.js 15', group: 'React',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'npm test -- --coverage --ci', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'hybrid', outputDir: '.next',
      healthPath: '/api/health', bundler: 'turbopack', staticOutput: false,
    },
    react: {
      label: 'React SPA', group: 'React',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'npm test -- --coverage --ci', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'build',
      healthPath: '/', bundler: 'webpack', staticOutput: true,
    },
    vue: {
      label: 'Vue 3', group: 'Vue',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'npm run test:unit', lintCmd: 'npm run lint',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist',
      healthPath: '/', bundler: 'vite', staticOutput: true,
    },
    angular: {
      label: 'Angular 18', group: 'Angular',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'ng test --watch=false --browsers=ChromeHeadless', lintCmd: 'ng lint',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'ng build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist/app',
      healthPath: '/', bundler: 'esbuild', staticOutput: true,
    },
    svelte: {
      label: 'SvelteKit', group: 'Svelte',
      builder: 'node:22-alpine', runtime: 'node:22-alpine',
      testCmd: 'npm run test', lintCmd: 'npm run lint',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'ssr', outputDir: 'build',
      healthPath: '/api/health', bundler: 'vite', staticOutput: false,
    },
    nuxt: {
      label: 'Nuxt 3', group: 'Vue',
      builder: 'node:22-alpine', runtime: 'node:22-alpine',
      testCmd: 'npm run test', lintCmd: 'npm run lint',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'hybrid', outputDir: '.output',
      healthPath: '/api/health', bundler: 'vite', staticOutput: false,
    },
    mobile: {
      label: 'React Native (bare)', group: 'Mobile',
      builder: 'node:22-alpine', runtime: 'N/A',
      testCmd: 'npm test', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: 'N/A', pkgFile: 'package.json',
      renderMode: 'native', outputDir: 'N/A',
      healthPath: 'N/A', bundler: 'metro', staticOutput: false,
    },
    none: {
      label: 'None', group: '',
      builder: '', runtime: '',
      testCmd: '', lintCmd: '',
      installCmd: '',
      pkgMgr: 'npm', pkgMgrOpts: ['npm'],
      port: '', pkgFile: '',
      renderMode: '', outputDir: '',
      healthPath: '', bundler: '', staticOutput: false,
    },

    // ── Framework-level keys ──────────────────────────────────────────────────
    remix: {
      label: 'Remix 2', group: 'React',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'vitest run --coverage', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'ssr', outputDir: 'build',
      healthPath: '/api/health', bundler: 'vite', staticOutput: false,
    },
    'react-vite': {
      label: 'React + Vite', group: 'React',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'vitest run --coverage', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist',
      healthPath: '/', bundler: 'vite', staticOutput: true,
    },
    gatsby: {
      label: 'Gatsby 5', group: 'React',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'jest --coverage', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'ssg', outputDir: 'public',
      healthPath: '/', bundler: 'webpack', staticOutput: true,
    },
    'vue-vite': {
      label: 'Vue 3 + Vite', group: 'Vue',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'vitest run --coverage', lintCmd: 'eslint .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist',
      healthPath: '/', bundler: 'vite', staticOutput: true,
    },
    astro: {
      label: 'Astro 4', group: 'Meta',
      builder: 'node:22-alpine', runtime: 'node:22-alpine',
      testCmd: 'vitest run', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'islands', outputDir: 'dist',
      healthPath: '/', bundler: 'vite', staticOutput: true,
    },
    'mobile-expo': {
      label: 'Expo (managed)', group: 'Mobile',
      builder: 'node:22-alpine', runtime: 'N/A',
      testCmd: 'jest --coverage', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'eas build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: 'N/A', pkgFile: 'package.json',
      renderMode: 'native', outputDir: 'N/A',
      healthPath: 'N/A', bundler: 'metro', staticOutput: false,
    },

    // ── Expanded coverage ─────────────────────────────────────────────────────
    solid: {
      label: 'SolidStart', group: 'Solid',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'vitest run --coverage', lintCmd: 'eslint .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'ssr', outputDir: '.output',
      healthPath: '/api/health', bundler: 'vite', staticOutput: false,
    },
    'solid-vite': {
      label: 'Solid + Vite', group: 'Solid',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'vitest run --coverage', lintCmd: 'eslint .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist',
      healthPath: '/', bundler: 'vite', staticOutput: true,
    },
    qwik: {
      label: 'Qwik City', group: 'Qwik',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'vitest run', lintCmd: 'eslint .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'ssr', outputDir: 'server',
      healthPath: '/health', bundler: 'vite', staticOutput: false,
    },
    tanstack: {
      label: 'TanStack Start', group: 'React',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'vitest run --coverage', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', pkgFile: 'package.json',
      renderMode: 'ssr', outputDir: '.output',
      healthPath: '/health', bundler: 'vite', staticOutput: false,
    },
    'preact-vite': {
      label: 'Preact + Vite', group: 'React',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'vitest run --coverage', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist',
      healthPath: '/', bundler: 'vite', staticOutput: true,
    },
    lit: {
      label: 'Lit (Web Components)', group: 'WebComponents',
      builder: 'node:22-alpine', runtime: 'nginx:1.27-alpine',
      testCmd: 'wtr "test/**/*.test.js" --node-resolve', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'rollup -c',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '80', pkgFile: 'package.json',
      renderMode: 'csr', outputDir: 'dist',
      healthPath: '/', bundler: 'rollup', staticOutput: true,
    },
    redwood: {
      label: 'RedwoodJS', group: 'React',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'yarn rw test --no-watch', lintCmd: 'yarn rw lint',
      installCmd: 'yarn install --immutable', buildCmd: 'yarn rw build',
      pkgMgr: 'yarn', pkgMgrOpts: ['yarn'],
      port: '8910', pkgFile: 'package.json',
      renderMode: 'fullstack', outputDir: 'web/dist',
      healthPath: '/.redwood/functions/healthz', bundler: 'vite', staticOutput: false,
    },
    fresh: {
      label: 'Fresh (Deno)', group: 'Deno',
      builder: 'denoland/deno:alpine-1.46.3', runtime: 'denoland/deno:alpine-1.46.3',
      testCmd: 'deno test --allow-all', lintCmd: 'deno lint',
      installCmd: 'deno cache main.ts', buildCmd: 'deno task build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm'],
      port: '8000', pkgFile: 'deno.json',
      renderMode: 'islands', outputDir: '_fresh',
      healthPath: '/health', bundler: 'deno', staticOutput: false,
    },
  },

  backend: {
    // ── Legacy keys (backward compat) ────────────────────────────────────────
    none: {
      label: 'None', group: '',
      builder: '', runtime: '',
      testCmd: '', lintCmd: '',
      installCmd: '',
      pkgMgr: 'npm', pkgMgrOpts: ['npm'],
      port: '', pkgFile: '', healthPath: '',
    },
    nodejs: {
      label: 'Node.js', group: 'nodejs',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'npm test', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', startCmd: 'node src/index.js', pkgFile: 'package.json',
      healthPath: '/api/health',
    },
    go: {
      label: 'Go', group: 'go',
      builder: 'golang:1.23-alpine', runtime: 'gcr.io/distroless/static-debian12',
      testCmd: 'go test ./... -race -coverprofile=coverage.out', lintCmd: 'golangci-lint run ./...',
      installCmd: 'go mod download', buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .',
      pkgMgr: 'go', pkgMgrOpts: ['go'],
      port: '8080', startCmd: '/app', pkgFile: 'go.mod', healthPath: '/health',
    },
    python: {
      label: 'Python', group: 'python',
      builder: 'python:3.12-slim', runtime: 'gcr.io/distroless/python3-debian12',
      testCmd: 'pytest --cov --cov-report=xml', lintCmd: 'ruff check .',
      installCmd: 'pip install --no-cache-dir -r requirements.txt',
      pkgMgr: 'pip', pkgMgrOpts: ['pip', 'poetry', 'uv'],
      port: '8000', startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000',
      pkgFile: 'requirements.txt', healthPath: '/health',
    },
    java: {
      label: 'Java (Spring)', group: 'java',
      builder: 'eclipse-temurin:21-jdk-alpine', runtime: 'gcr.io/distroless/java21-debian12',
      testCmd: 'mvn test', lintCmd: 'mvn checkstyle:check',
      installCmd: 'mvn dependency:resolve -q', buildCmd: 'mvn package -DskipTests -q',
      pkgMgr: 'maven', pkgMgrOpts: ['maven', 'gradle'],
      port: '8080', startCmd: 'java -jar target/*.jar', pkgFile: 'pom.xml',
      healthPath: '/actuator/health',
    },
    dotnet: {
      label: '.NET', group: 'dotnet',
      builder: 'mcr.microsoft.com/dotnet/sdk:8.0', runtime: 'mcr.microsoft.com/dotnet/aspnet:8.0-alpine',
      testCmd: 'dotnet test', lintCmd: 'dotnet format --verify-no-changes',
      installCmd: 'dotnet restore', buildCmd: 'dotnet publish -c Release -o out',
      pkgMgr: 'dotnet', pkgMgrOpts: ['dotnet'],
      port: '8080', startCmd: 'dotnet out/App.dll', pkgFile: '*.csproj',
      healthPath: '/health',
    },
    rust: {
      label: 'Rust', group: 'rust',
      builder: 'rust:1.87-alpine', runtime: 'gcr.io/distroless/cc-debian12:nonroot',
      testCmd: 'cargo test', lintCmd: 'cargo clippy -- -D warnings',
      installCmd: 'cargo fetch', buildCmd: 'cargo build --release',
      pkgMgr: 'cargo', pkgMgrOpts: ['cargo'],
      port: '8080', startCmd: '/app', pkgFile: 'Cargo.toml', healthPath: '/health',
    },
    ruby: {
      label: 'Ruby', group: 'ruby',
      builder: 'ruby:3.3-alpine', runtime: 'ruby:3.3-alpine',
      testCmd: 'bundle exec rspec', lintCmd: 'bundle exec rubocop',
      installCmd: 'bundle install --without development',
      pkgMgr: 'bundler', pkgMgrOpts: ['bundler'],
      port: '3000', startCmd: 'bundle exec puma -C config/puma.rb', pkgFile: 'Gemfile',
      healthPath: '/health',
    },
    php: {
      label: 'PHP', group: 'php',
      builder: 'php:8.3-alpine', runtime: 'php:8.3-alpine',
      testCmd: 'vendor/bin/phpunit', lintCmd: 'vendor/bin/phpcs',
      installCmd: 'composer install --no-dev --optimize-autoloader',
      pkgMgr: 'composer', pkgMgrOpts: ['composer'],
      port: '8000', startCmd: 'php -S 0.0.0.0:8000 public/index.php', pkgFile: 'composer.json',
      healthPath: '/health',
    },

    // ── Framework-level keys ──────────────────────────────────────────────────
    'nodejs-express': {
      label: 'Express', group: 'nodejs',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'jest --coverage', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', startCmd: 'node src/index.js', healthPath: '/health',
    },
    'nodejs-fastify': {
      label: 'Fastify', group: 'nodejs',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'node --test', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', startCmd: 'node src/server.js', healthPath: '/health',
    },
    'nodejs-nest': {
      label: 'NestJS', group: 'nodejs',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'jest --coverage', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts', buildCmd: 'npm run build',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', startCmd: 'node dist/main.js', healthPath: '/health',
    },
    'nodejs-hono': {
      label: 'Hono', group: 'nodejs',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'vitest run --coverage', lintCmd: 'npx biome check .',
      installCmd: 'npm ci --ignore-scripts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', startCmd: 'node src/index.js', healthPath: '/health',
    },
    'nodejs-koa': {
      label: 'Koa', group: 'nodejs',
      builder: 'node:22-alpine', runtime: 'gcr.io/distroless/nodejs22-debian12:nonroot',
      testCmd: 'mocha --recursive', lintCmd: 'npx eslint src/',
      installCmd: 'npm ci --ignore-scripts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm', 'pnpm', 'yarn', 'bun'],
      port: '3000', startCmd: 'node src/index.js', healthPath: '/health',
    },
    'bun-elysia': {
      label: 'Elysia (Bun)', group: 'nodejs',
      builder: 'oven/bun:1-alpine', runtime: 'oven/bun:1-alpine',
      testCmd: 'bun test --coverage', lintCmd: 'bunx biome check .',
      installCmd: 'bun install --frozen-lockfile',
      pkgMgr: 'bun', pkgMgrOpts: ['bun'],
      port: '3000', startCmd: 'bun run src/index.ts', healthPath: '/health',
    },
    'deno-fresh-api': {
      label: 'Fresh API (Deno)', group: 'nodejs',
      builder: 'denoland/deno:alpine-1.46.3', runtime: 'denoland/deno:alpine-1.46.3',
      testCmd: 'deno test --allow-all --coverage=cov', lintCmd: 'deno lint',
      installCmd: 'deno cache main.ts',
      pkgMgr: 'npm', pkgMgrOpts: ['npm'],
      port: '8000', startCmd: 'deno run --allow-net --allow-env main.ts', healthPath: '/health',
    },
    'python-fastapi': {
      label: 'FastAPI', group: 'python',
      builder: 'python:3.12-slim', runtime: 'gcr.io/distroless/python3-debian12',
      testCmd: 'pytest --cov --cov-report=xml', lintCmd: 'ruff check .',
      installCmd: 'pip install --no-cache-dir -r requirements.txt',
      pkgMgr: 'pip', pkgMgrOpts: ['pip', 'poetry', 'uv'],
      port: '8000', startCmd: 'uvicorn main:app --host 0.0.0.0 --port 8000', healthPath: '/health',
    },
    'python-django': {
      label: 'Django', group: 'python',
      builder: 'python:3.12-slim', runtime: 'gcr.io/distroless/python3-debian12',
      testCmd: 'python manage.py test', lintCmd: 'ruff check .',
      installCmd: 'pip install --no-cache-dir -r requirements.txt',
      pkgMgr: 'pip', pkgMgrOpts: ['pip', 'poetry', 'uv'],
      port: '8000', startCmd: 'gunicorn myapp.wsgi:application --bind 0.0.0.0:8000',
      healthPath: '/health/',
    },
    'python-flask': {
      label: 'Flask', group: 'python',
      builder: 'python:3.12-slim', runtime: 'gcr.io/distroless/python3-debian12',
      testCmd: 'pytest --cov --cov-report=xml', lintCmd: 'ruff check .',
      installCmd: 'pip install --no-cache-dir -r requirements.txt',
      pkgMgr: 'pip', pkgMgrOpts: ['pip', 'poetry', 'uv'],
      port: '5000', startCmd: 'gunicorn app:app --bind 0.0.0.0:5000', healthPath: '/health',
    },
    'python-litestar': {
      label: 'Litestar', group: 'python',
      builder: 'python:3.12-slim', runtime: 'gcr.io/distroless/python3-debian12',
      testCmd: 'pytest --cov --cov-report=xml', lintCmd: 'ruff check .',
      installCmd: 'pip install --no-cache-dir -r requirements.txt',
      pkgMgr: 'pip', pkgMgrOpts: ['pip', 'poetry', 'uv'],
      port: '8000', startCmd: 'uvicorn app:app --host 0.0.0.0 --port 8000', healthPath: '/health',
    },
    'python-starlette': {
      label: 'Starlette', group: 'python',
      builder: 'python:3.12-slim', runtime: 'gcr.io/distroless/python3-debian12',
      testCmd: 'pytest --cov --cov-report=xml', lintCmd: 'ruff check .',
      installCmd: 'pip install --no-cache-dir -r requirements.txt',
      pkgMgr: 'pip', pkgMgrOpts: ['pip', 'poetry', 'uv'],
      port: '8000', startCmd: 'uvicorn app:app --host 0.0.0.0 --port 8000', healthPath: '/health',
    },
    'java-spring': {
      label: 'Spring Boot 3', group: 'java',
      builder: 'eclipse-temurin:21-jdk-alpine', runtime: 'gcr.io/distroless/java21-debian12',
      testCmd: 'mvn test', lintCmd: 'mvn checkstyle:check',
      installCmd: 'mvn dependency:resolve -q', buildCmd: 'mvn package -DskipTests -q',
      pkgMgr: 'maven', pkgMgrOpts: ['maven', 'gradle'],
      port: '8080', startCmd: 'java -jar target/*.jar', healthPath: '/actuator/health',
    },
    'java-quarkus': {
      label: 'Quarkus', group: 'java',
      builder: 'eclipse-temurin:21-jdk-alpine', runtime: 'gcr.io/distroless/java21-debian12',
      testCmd: 'mvn test', lintCmd: 'mvn checkstyle:check',
      installCmd: 'mvn dependency:resolve -q',
      buildCmd: 'mvn package -DskipTests -Dquarkus.package.type=uber-jar',
      pkgMgr: 'maven', pkgMgrOpts: ['maven', 'gradle'],
      port: '8080', startCmd: 'java -jar target/*-runner.jar', healthPath: '/q/health',
    },
    'java-micronaut': {
      label: 'Micronaut', group: 'java',
      builder: 'eclipse-temurin:21-jdk-alpine', runtime: 'gcr.io/distroless/java21-debian12',
      testCmd: 'mvn test', lintCmd: 'mvn checkstyle:check',
      installCmd: 'mvn dependency:resolve -q', buildCmd: 'mvn package -DskipTests',
      pkgMgr: 'maven', pkgMgrOpts: ['maven', 'gradle'],
      port: '8080', startCmd: 'java -jar target/*.jar', healthPath: '/health',
    },
    'java-javalin': {
      label: 'Javalin', group: 'java',
      builder: 'eclipse-temurin:21-jdk-alpine', runtime: 'gcr.io/distroless/java21-debian12',
      testCmd: 'mvn test', lintCmd: 'mvn checkstyle:check',
      installCmd: 'mvn dependency:resolve -q', buildCmd: 'mvn package -DskipTests -q',
      pkgMgr: 'maven', pkgMgrOpts: ['maven', 'gradle'],
      port: '7070', startCmd: 'java -jar target/*.jar', healthPath: '/health',
    },
    'dotnet-webapi': {
      label: '.NET Web API', group: 'dotnet',
      builder: 'mcr.microsoft.com/dotnet/sdk:8.0', runtime: 'mcr.microsoft.com/dotnet/aspnet:8.0-alpine',
      testCmd: 'dotnet test', lintCmd: 'dotnet format --verify-no-changes',
      installCmd: 'dotnet restore', buildCmd: 'dotnet publish -c Release -o out',
      pkgMgr: 'dotnet', pkgMgrOpts: ['dotnet'],
      port: '8080', startCmd: 'dotnet out/App.dll', healthPath: '/health',
    },
    'dotnet-minimal': {
      label: '.NET Minimal', group: 'dotnet',
      builder: 'mcr.microsoft.com/dotnet/sdk:8.0', runtime: 'mcr.microsoft.com/dotnet/aspnet:8.0-alpine',
      testCmd: 'dotnet test', lintCmd: 'dotnet format --verify-no-changes',
      installCmd: 'dotnet restore', buildCmd: 'dotnet publish -c Release -o out',
      pkgMgr: 'dotnet', pkgMgrOpts: ['dotnet'],
      port: '8080', startCmd: 'dotnet out/App.dll', healthPath: '/health',
    },
    'go-gin': {
      label: 'Go + gin', group: 'go',
      builder: 'golang:1.23-alpine', runtime: 'gcr.io/distroless/static-debian12',
      testCmd: 'go test ./... -race -coverprofile=coverage.out', lintCmd: 'golangci-lint run ./...',
      installCmd: 'go mod download', buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .',
      pkgMgr: 'go', pkgMgrOpts: ['go'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'go-echo': {
      label: 'Go + echo', group: 'go',
      builder: 'golang:1.23-alpine', runtime: 'gcr.io/distroless/static-debian12',
      testCmd: 'go test ./... -race -coverprofile=coverage.out', lintCmd: 'golangci-lint run ./...',
      installCmd: 'go mod download', buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .',
      pkgMgr: 'go', pkgMgrOpts: ['go'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'go-chi': {
      label: 'Go + chi', group: 'go',
      builder: 'golang:1.23-alpine', runtime: 'gcr.io/distroless/static-debian12',
      testCmd: 'go test ./... -race -coverprofile=coverage.out', lintCmd: 'golangci-lint run ./...',
      installCmd: 'go mod download', buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .',
      pkgMgr: 'go', pkgMgrOpts: ['go'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'go-fiber': {
      label: 'Go + fiber', group: 'go',
      builder: 'golang:1.23-alpine', runtime: 'gcr.io/distroless/static-debian12',
      testCmd: 'go test ./... -race -coverprofile=coverage.out', lintCmd: 'golangci-lint run ./...',
      installCmd: 'go mod download', buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .',
      pkgMgr: 'go', pkgMgrOpts: ['go'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'go-stdlib': {
      label: 'Go stdlib', group: 'go',
      builder: 'golang:1.23-alpine', runtime: 'gcr.io/distroless/static-debian12',
      testCmd: 'go test ./... -race -coverprofile=coverage.out', lintCmd: 'golangci-lint run ./...',
      installCmd: 'go mod download', buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .',
      pkgMgr: 'go', pkgMgrOpts: ['go'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'rust-axum': {
      label: 'Axum', group: 'rust',
      builder: 'rust:1.87-alpine', runtime: 'gcr.io/distroless/cc-debian12:nonroot',
      testCmd: 'cargo test', lintCmd: 'cargo clippy -- -D warnings',
      installCmd: 'cargo fetch', buildCmd: 'cargo build --release',
      pkgMgr: 'cargo', pkgMgrOpts: ['cargo'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'rust-actix': {
      label: 'Actix-web', group: 'rust',
      builder: 'rust:1.87-alpine', runtime: 'gcr.io/distroless/cc-debian12:nonroot',
      testCmd: 'cargo test', lintCmd: 'cargo clippy -- -D warnings',
      installCmd: 'cargo fetch', buildCmd: 'cargo build --release',
      pkgMgr: 'cargo', pkgMgrOpts: ['cargo'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'rust-rocket': {
      label: 'Rocket', group: 'rust',
      builder: 'rust:1.87-alpine', runtime: 'gcr.io/distroless/cc-debian12:nonroot',
      testCmd: 'cargo test', lintCmd: 'cargo clippy -- -D warnings',
      installCmd: 'cargo fetch', buildCmd: 'cargo build --release',
      pkgMgr: 'cargo', pkgMgrOpts: ['cargo'],
      port: '8000', startCmd: '/app', healthPath: '/health',
    },
    'rust-warp': {
      label: 'Warp', group: 'rust',
      builder: 'rust:1.87-alpine', runtime: 'gcr.io/distroless/cc-debian12:nonroot',
      testCmd: 'cargo test', lintCmd: 'cargo clippy -- -D warnings',
      installCmd: 'cargo fetch', buildCmd: 'cargo build --release',
      pkgMgr: 'cargo', pkgMgrOpts: ['cargo'],
      port: '8080', startCmd: '/app', healthPath: '/health',
    },
    'ruby-rails': {
      label: 'Rails 7', group: 'ruby',
      builder: 'ruby:3.3-alpine', runtime: 'ruby:3.3-alpine',
      testCmd: 'bundle exec rails test', lintCmd: 'bundle exec rubocop',
      installCmd: 'bundle install --without development',
      buildCmd: 'bundle exec rake assets:precompile',
      pkgMgr: 'bundler', pkgMgrOpts: ['bundler'],
      port: '3000', startCmd: 'bundle exec puma -C config/puma.rb', healthPath: '/health',
    },
    'ruby-sinatra': {
      label: 'Sinatra', group: 'ruby',
      builder: 'ruby:3.3-alpine', runtime: 'ruby:3.3-alpine',
      testCmd: 'bundle exec rspec', lintCmd: 'bundle exec rubocop',
      installCmd: 'bundle install --without development',
      pkgMgr: 'bundler', pkgMgrOpts: ['bundler'],
      port: '4567', startCmd: 'bundle exec ruby app.rb', healthPath: '/health',
    },
    'php-laravel': {
      label: 'Laravel 11', group: 'php',
      builder: 'php:8.3-alpine', runtime: 'php:8.3-alpine',
      testCmd: 'php artisan test', lintCmd: 'vendor/bin/phpcs',
      installCmd: 'composer install --no-dev --optimize-autoloader',
      pkgMgr: 'composer', pkgMgrOpts: ['composer'],
      port: '8000', startCmd: 'php artisan serve --host=0.0.0.0', healthPath: '/health',
    },
    'php-symfony': {
      label: 'Symfony 7', group: 'php',
      builder: 'php:8.3-alpine', runtime: 'php:8.3-alpine',
      testCmd: 'vendor/bin/phpunit', lintCmd: 'vendor/bin/phpcs',
      installCmd: 'composer install --no-dev --optimize-autoloader',
      pkgMgr: 'composer', pkgMgrOpts: ['composer'],
      port: '8000', startCmd: 'php -S 0.0.0.0:8000 public/index.php', healthPath: '/health',
    },
    'php-slim': {
      label: 'Slim 4', group: 'php',
      builder: 'php:8.3-alpine', runtime: 'php:8.3-alpine',
      testCmd: 'vendor/bin/phpunit', lintCmd: 'vendor/bin/phpcs',
      installCmd: 'composer install --no-dev --optimize-autoloader',
      pkgMgr: 'composer', pkgMgrOpts: ['composer'],
      port: '8000', startCmd: 'php -S 0.0.0.0:8000 public/index.php', healthPath: '/health',
    },
    'elixir-phoenix': {
      label: 'Phoenix', group: 'elixir',
      builder: 'elixir:1.17-otp-27-alpine', runtime: 'alpine:3.20',
      testCmd: 'mix test', lintCmd: 'mix credo --strict',
      installCmd: 'mix deps.get --only prod', buildCmd: 'MIX_ENV=prod mix release',
      pkgMgr: 'mix', pkgMgrOpts: ['mix'],
      port: '4000', startCmd: '_build/prod/rel/myapp/bin/myapp start', healthPath: '/health',
    },
    'elixir-live': {
      label: 'Phoenix LiveView', group: 'elixir',
      builder: 'elixir:1.17-otp-27-alpine', runtime: 'alpine:3.20',
      testCmd: 'mix test', lintCmd: 'mix credo --strict',
      installCmd: 'mix deps.get --only prod', buildCmd: 'MIX_ENV=prod mix release',
      pkgMgr: 'mix', pkgMgrOpts: ['mix'],
      port: '4000', startCmd: '_build/prod/rel/myapp/bin/myapp start', healthPath: '/health',
    },
    'kotlin-ktor': {
      label: 'Ktor', group: 'kotlin',
      builder: 'eclipse-temurin:21-jdk-alpine', runtime: 'gcr.io/distroless/java21-debian12',
      testCmd: './gradlew test', lintCmd: './gradlew ktlintCheck',
      installCmd: './gradlew dependencies', buildCmd: './gradlew installShadowDist',
      pkgMgr: 'gradle', pkgMgrOpts: ['gradle'],
      port: '8080', startCmd: 'build/install/myapp-shadow/bin/myapp', healthPath: '/health',
    },
    'swift-vapor': {
      label: 'Vapor (Swift)', group: 'swift',
      builder: 'swift:5.10-jammy', runtime: 'gcr.io/distroless/cc-debian12:nonroot',
      testCmd: 'swift test --enable-code-coverage', lintCmd: 'swiftlint',
      installCmd: 'swift package resolve', buildCmd: 'swift build -c release',
      pkgMgr: 'spm', pkgMgrOpts: ['spm'],
      port: '8080', startCmd: '/app serve --hostname 0.0.0.0 --port 8080', healthPath: '/health',
    },
  },
};
