// studio-v2/src/generators/dockerfile.ts
var NODE_BUILDER = "node:22-alpine";
var NODE_DISTROLESS = "gcr.io/distroless/nodejs22-debian12:nonroot";
var PYTHON_BUILDER = "python:3.12-slim";
var PKG_MANAGERS = {
  npm: { installCmd: "npm ci --ignore-scripts", dockerSetup: "", dockerCopy: "COPY package*.json ./" },
  pnpm: { installCmd: "pnpm install --frozen-lockfile", dockerSetup: "RUN corepack enable pnpm", dockerCopy: "COPY package.json pnpm-lock.yaml ./" },
  yarn: { installCmd: "yarn install --frozen-lockfile", dockerSetup: "RUN corepack enable yarn", dockerCopy: "COPY package.json yarn.lock ./" },
  bun: { installCmd: "bun install --frozen-lockfile", dockerSetup: "COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun", dockerCopy: "COPY package.json bun.lockb ./" },
  pip: { installCmd: "pip install --no-cache-dir -r requirements.txt", dockerSetup: "", dockerCopy: "COPY requirements.txt ./" },
  poetry: { installCmd: "poetry install --no-dev --no-interaction", dockerSetup: "RUN pip install poetry==1.8.3 && poetry config virtualenvs.create false", dockerCopy: "COPY pyproject.toml poetry.lock ./" },
  uv: { installCmd: "uv sync --frozen --no-dev", dockerSetup: "RUN pip install uv", dockerCopy: "COPY pyproject.toml uv.lock ./" },
  maven: { installCmd: "mvn dependency:resolve -q", dockerSetup: "", dockerCopy: "COPY pom.xml ./" },
  gradle: { installCmd: "./gradlew dependencies --no-daemon", dockerSetup: "", dockerCopy: "COPY build.gradle settings.gradle ./\nCOPY gradle ./gradle" },
  go: { installCmd: "go mod download", dockerSetup: "", dockerCopy: "COPY go.mod go.sum ./" },
  cargo: { installCmd: "cargo fetch", dockerSetup: "", dockerCopy: "COPY Cargo.toml Cargo.lock ./" },
  bundler: { installCmd: "bundle install --without development", dockerSetup: "", dockerCopy: "COPY Gemfile Gemfile.lock ./" },
  composer: { installCmd: "composer install --no-dev --optimize-autoloader", dockerSetup: "", dockerCopy: "COPY composer.json composer.lock ./" },
  dotnet: { installCmd: "dotnet restore", dockerSetup: "", dockerCopy: "COPY *.csproj ./" }
};
var FRONTEND_STACKS = {
  nextjs: { label: "Next.js 15", staticOutput: false, outputDir: ".next", port: "3000", healthPath: "/api/health", buildCmd: "npm run build" },
  react: { label: "React SPA", staticOutput: true, outputDir: "build", port: "80" },
  vue: { label: "Vue 3", staticOutput: true, outputDir: "dist", port: "80" },
  angular: { label: "Angular 18", staticOutput: true, outputDir: "dist/app", port: "80", buildCmd: "ng build" },
  svelte: { label: "SvelteKit", staticOutput: false, outputDir: "build", port: "3000", healthPath: "/api/health" },
  nuxt: { label: "Nuxt 3", staticOutput: false, outputDir: ".output", port: "3000", healthPath: "/api/health" },
  mobile: { label: "React Native (bare)", staticOutput: false, outputDir: "N/A" },
  remix: { label: "Remix 2", staticOutput: false, outputDir: "build", port: "3000", healthPath: "/api/health" },
  "react-vite": { label: "React + Vite", staticOutput: true, outputDir: "dist", port: "80" },
  gatsby: { label: "Gatsby 5", staticOutput: true, outputDir: "public", port: "80" },
  "vue-vite": { label: "Vue 3 + Vite", staticOutput: true, outputDir: "dist", port: "80" },
  astro: { label: "Astro 4", staticOutput: true, outputDir: "dist", port: "3000", healthPath: "/" },
  "mobile-expo": { label: "Expo (managed)", staticOutput: false, outputDir: "N/A" },
  solid: { label: "SolidStart", staticOutput: false, outputDir: ".output", port: "3000", healthPath: "/api/health" },
  "solid-vite": { label: "Solid + Vite", staticOutput: true, outputDir: "dist", port: "80" },
  qwik: { label: "Qwik City", staticOutput: false, outputDir: "server", port: "3000", healthPath: "/health" },
  tanstack: { label: "TanStack Start", staticOutput: false, outputDir: ".output", port: "3000", healthPath: "/health" },
  "preact-vite": { label: "Preact + Vite", staticOutput: true, outputDir: "dist", port: "80" },
  lit: { label: "Lit (Web Components)", staticOutput: true, outputDir: "dist", port: "80", buildCmd: "rollup -c" },
  redwood: { label: "RedwoodJS", staticOutput: false, outputDir: "web/dist", port: "8910", healthPath: "/.redwood/functions/healthz", buildCmd: "yarn rw build" },
  fresh: { label: "Fresh (Deno)", staticOutput: false, outputDir: "_fresh", port: "8000", healthPath: "/health" }
};
var BACKEND_STACKS = {
  none: { label: "None" },
  nodejs: { label: "Node.js", port: "3000", startCmd: "node src/index.js", healthPath: "/api/health" },
  go: { label: "Go", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: 'go build -ldflags="-s -w" -o app ./cmd/...' },
  python: { label: "Python", port: "8000", startCmd: "uvicorn main:app --host 0.0.0.0 --port 8000", healthPath: "/health" },
  java: { label: "Java (Spring)", port: "8080", startCmd: "java -jar target/*.jar", healthPath: "/actuator/health", buildCmd: "mvn package -DskipTests -q" },
  dotnet: { label: ".NET", port: "8080", startCmd: "dotnet out/App.dll", healthPath: "/health", buildCmd: "dotnet publish -c Release -o out" },
  rust: { label: "Rust", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: "cargo build --release" },
  ruby: { label: "Ruby", port: "3000", startCmd: "bundle exec puma", healthPath: "/health" },
  php: { label: "PHP", port: "8000", startCmd: "php -S 0.0.0.0:8000 public/index.php", healthPath: "/health" },
  "nodejs-express": { label: "Express", port: "3000", startCmd: "node src/index.js", healthPath: "/health" },
  "nodejs-fastify": { label: "Fastify", port: "3000", startCmd: "node src/server.js", healthPath: "/health" },
  "nodejs-nest": { label: "NestJS", port: "3000", startCmd: "node dist/main.js", healthPath: "/health", buildCmd: "npm run build" },
  "nodejs-hono": { label: "Hono", port: "3000", startCmd: "node src/index.js", healthPath: "/health" },
  "python-fastapi": { label: "FastAPI", port: "8000", startCmd: "uvicorn main:app --host 0.0.0.0 --port 8000", healthPath: "/health" },
  "python-django": { label: "Django", port: "8000", startCmd: "gunicorn myapp.wsgi:application --bind 0.0.0.0:8000", healthPath: "/health/" },
  "python-flask": { label: "Flask", port: "5000", startCmd: "gunicorn app:app --bind 0.0.0.0:5000", healthPath: "/health" },
  "python-litestar": { label: "Litestar", port: "8000", startCmd: "uvicorn app:app --host 0.0.0.0 --port 8000", healthPath: "/health" },
  "java-spring": { label: "Spring Boot 3", port: "8080", startCmd: "java -jar target/*.jar", healthPath: "/actuator/health", buildCmd: "mvn package -DskipTests -q" },
  "java-quarkus": { label: "Quarkus", port: "8080", startCmd: "java -jar target/*-runner.jar", healthPath: "/q/health", buildCmd: "mvn package -DskipTests -Dquarkus.package.type=uber-jar" },
  "java-micronaut": { label: "Micronaut", port: "8080", startCmd: "java -jar target/*.jar", healthPath: "/health", buildCmd: "mvn package -DskipTests" },
  "go-gin": { label: "Go + gin", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  "go-echo": { label: "Go + echo", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  "go-chi": { label: "Go + chi", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  "go-stdlib": { label: "Go stdlib", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  "go-fiber": { label: "Go + fiber", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: 'go build -ldflags="-s -w" -trimpath -o app .' },
  "rust-axum": { label: "Axum", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: "cargo build --release" },
  "rust-actix": { label: "Actix-web", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: "cargo build --release" },
  "rust-rocket": { label: "Rocket", port: "8000", startCmd: "/app", healthPath: "/health", buildCmd: "cargo build --release" },
  "rust-warp": { label: "Warp", port: "8080", startCmd: "/app", healthPath: "/health", buildCmd: "cargo build --release" },
  "ruby-rails": { label: "Rails 7", port: "3000", startCmd: "bundle exec puma -C config/puma.rb", healthPath: "/health", buildCmd: "bundle exec rake assets:precompile" },
  "ruby-sinatra": { label: "Sinatra", port: "4567", startCmd: "bundle exec ruby app.rb", healthPath: "/health" },
  "php-laravel": { label: "Laravel 11", port: "8000", startCmd: "php artisan serve --host=0.0.0.0", healthPath: "/health" },
  "php-symfony": { label: "Symfony 7", port: "8000", startCmd: "php -S 0.0.0.0:8000 public/index.php", healthPath: "/health" },
  "php-slim": { label: "Slim 4", port: "8000", startCmd: "php -S 0.0.0.0:8000 public/index.php", healthPath: "/health" },
  "nodejs-koa": { label: "Koa", port: "3000", startCmd: "node src/index.js", healthPath: "/health" },
  "elixir-phoenix": { label: "Phoenix", port: "4000", startCmd: "_build/prod/rel/myapp/bin/myapp start", healthPath: "/health", buildCmd: "MIX_ENV=prod mix release" },
  "kotlin-ktor": { label: "Ktor", port: "8080", startCmd: "build/install/myapp-shadow/bin/myapp", healthPath: "/health", buildCmd: "./gradlew installShadowDist" },
  "bun-elysia": { label: "Elysia (Bun)", port: "3000", startCmd: "bun run src/index.ts", healthPath: "/health" },
  "deno-fresh-api": { label: "Fresh API (Deno)", port: "8000", startCmd: "deno run --allow-net --allow-env main.ts", healthPath: "/health" },
  "python-starlette": { label: "Starlette", port: "8000", startCmd: "uvicorn app:app --host 0.0.0.0 --port 8000", healthPath: "/health" },
  "java-javalin": { label: "Javalin", port: "7070", startCmd: "java -jar target/*.jar", healthPath: "/health", buildCmd: "mvn package -DskipTests -q" },
  "swift-vapor": { label: "Vapor (Swift)", port: "8080", startCmd: "/app serve --hostname 0.0.0.0 --port 8080", healthPath: "/health", buildCmd: "swift build -c release" },
  "elixir-live": { label: "Phoenix LiveView", port: "4000", startCmd: "_build/prod/rel/myapp/bin/myapp start", healthPath: "/health", buildCmd: "MIX_ENV=prod mix release" }
};
function beGroupFromKey(beKey) {
  return (beKey.includes("-") ? beKey.split("-")[0] : beKey).toLowerCase();
}
function buildPythonCmd(startCmd) {
  const cmd = startCmd || "uvicorn main:app --host 0.0.0.0 --port 8000";
  const parts = cmd.split(" ");
  const entry = parts[0];
  const rest = parts.slice(1);
  const moduleMap = {
    uvicorn: "uvicorn",
    gunicorn: "gunicorn",
    hypercorn: "hypercorn",
    celery: "celery",
    flask: "flask",
    pytest: "pytest"
  };
  if (moduleMap[entry]) {
    return `CMD ["-m", "${moduleMap[entry]}", ${rest.map((a) => `"${a}"`).join(", ")}]`;
  }
  return `CMD ["${entry}", ${rest.map((a) => `"${a}"`).join(", ")}]`;
}
var RUNTIME_BASE = {
  nodejs: {
    alpine: "node:22-alpine",
    slim: "node:22-bookworm-slim",
    distroless: "gcr.io/distroless/nodejs22-debian12:nonroot",
    fips: "registry.access.redhat.com/ubi9/nodejs-22",
    "ubi-minimal": "registry.access.redhat.com/ubi9/nodejs-22-minimal",
    "ubi-micro": "registry.access.redhat.com/ubi9/nodejs-22-minimal",
    wolfi: "cgr.dev/chainguard/node:latest"
  },
  go: {
    scratch: "scratch",
    alpine: "alpine:3.21",
    distroless: "gcr.io/distroless/static-debian12:nonroot",
    fips: "registry.access.redhat.com/ubi9-micro",
    "ubi-micro": "registry.access.redhat.com/ubi9-micro",
    "ubi-minimal": "registry.access.redhat.com/ubi9-minimal",
    wolfi: "cgr.dev/chainguard/static:latest"
  },
  python: {
    slim: "python:3.12-slim",
    alpine: "python:3.12-alpine",
    distroless: "gcr.io/distroless/python3-debian12:nonroot",
    fips: "registry.access.redhat.com/ubi9/python-312",
    "ubi-minimal": "registry.access.redhat.com/ubi9/python-312-minimal",
    wolfi: "cgr.dev/chainguard/python:latest"
  }
};
var BASE_NOTES = {
  fips: "# FIPS base: run on a FIPS-enabled host (fips=1 kernel) for validated crypto",
  "ubi-micro": "# ubi-micro has no language runtime - minimal runtime image used instead"
};
function runtimeFor(group, choice, fallback) {
  if (!choice) return fallback;
  const m = RUNTIME_BASE[group];
  return m && m[choice] ? m[choice] : fallback;
}
function baseNote(group, choice) {
  if (!choice) return "";
  const m = RUNTIME_BASE[group];
  if (m && !m[choice]) return `# note: '${choice}' base not offered for ${group} - platform default kept
`;
  return BASE_NOTES[choice] ? BASE_NOTES[choice] + "\n" : "";
}
function generateDockerfile(config) {
  const feKey = config.feKey;
  const beKey = config.beKey;
  const fe = FRONTEND_STACKS[feKey] ?? FRONTEND_STACKS["nextjs"];
  const be = BACKEND_STACKS[beKey] ?? BACKEND_STACKS["none"];
  const builder = be.builder ?? fe.builder ?? NODE_BUILDER;
  const runtime = be.runtime ?? fe.runtime ?? NODE_DISTROLESS;
  const beGroup = beGroupFromKey(beKey);
  const pm = PKG_MANAGERS[config.pkgMgr] ?? PKG_MANAGERS["npm"];
  const port = config.port ?? be.port ?? fe.port ?? "8080";
  const healthPath = config.healthPath ?? be.healthPath ?? fe.healthPath ?? "/health";
  const startCmd = be.startCmd ?? "";
  const isNextJS = feKey === "nextjs";
  if (beGroup === "go") {
    return `# syntax=docker/dockerfile:1.9
# Go (${be.label ?? "Go"}) \u2192 distroless static

FROM ${builder} AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux ${be.buildCmd ?? 'go build -ldflags="-s -w" -o app ./cmd/...'}

${baseNote("go", config.baseimage)}FROM ${runtimeFor("go", config.baseimage, runtime + ":nonroot")} AS runtime
COPY --from=builder /app/app /app
USER nonroot
EXPOSE ${port}
CMD ["${startCmd || "/app"}"]`;
  }
  if (beGroup === "python") {
    const pkgMgrKey = config.pkgMgr;
    const usePipTarget = pkgMgrKey === "pip" || !pkgMgrKey;
    const installLayer = usePipTarget ? `COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt --target=/app/deps` : `COPY ${pkgMgrKey === "poetry" ? "pyproject.toml poetry.lock" : "pyproject.toml uv.lock"} ./
RUN ${pm.installCmd || (pkgMgrKey === "poetry" ? "poetry install --no-dev" : "uv sync --frozen --no-dev")}`;
    const runtimeCopy = usePipTarget ? `COPY --from=builder /app/deps /app/deps
COPY --from=builder /app .
ENV PYTHONPATH=/app/deps` : `COPY --from=builder /app .`;
    return `# syntax=docker/dockerfile:1.9
# Python (${be.label ?? "Python"}) \u2192 distroless python3

FROM ${builder || PYTHON_BUILDER} AS builder
WORKDIR /app
${pm.dockerSetup ? pm.dockerSetup + "\n" : ""}${installLayer}

${baseNote("python", config.baseimage)}FROM ${runtimeFor("python", config.baseimage, runtime + ":nonroot")} AS runtime
WORKDIR /app
${runtimeCopy}
USER nonroot
EXPOSE ${port}
${buildPythonCmd(startCmd)}`;
  }
  if (beGroup === "java") {
    return `# syntax=docker/dockerfile:1.9
# Java (${be.label ?? "Java"}) \u2192 distroless java21

FROM ${builder} AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN ${be.buildCmd ?? "mvn package -DskipTests -q"}

FROM ${runtime}:nonroot AS runtime
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER nonroot
EXPOSE ${port}
CMD ["-jar", "app.jar"]`;
  }
  if (beGroup === "dotnet") {
    return `# syntax=docker/dockerfile:1.9
# .NET (${be.label ?? ".NET"}) \u2192 aspnet runtime

FROM ${builder} AS builder
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN ${be.buildCmd ?? "dotnet publish -c Release -o out"}

FROM ${runtime} AS runtime
WORKDIR /app
COPY --from=builder /app/out .
USER $APP_UID
EXPOSE ${port}
CMD ["dotnet", "App.dll"]`;
  }
  if (beGroup === "rust") {
    return `# syntax=docker/dockerfile:1.9
# Rust (${be.label ?? "Rust"}) \u2192 distroless cc

FROM ${builder} AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN cargo fetch
COPY src ./src
RUN ${be.buildCmd ?? "cargo build --release"}

FROM ${runtime} AS runtime
COPY --from=builder /app/target/release/app /app
USER nonroot
EXPOSE ${port}
CMD ["/app"]`;
  }
  if (beGroup === "ruby") {
    const startParts = (startCmd || "bundle exec puma").split(" ");
    return `# syntax=docker/dockerfile:1.9
# Ruby (${be.label ?? "Ruby"}) \u2192 ruby runtime

FROM ${builder} AS builder
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test
COPY . .
${be.buildCmd ? "RUN " + be.buildCmd : ""}

FROM ${runtime} AS runtime
WORKDIR /app
COPY --from=builder /app .
COPY --from=builder /usr/local/bundle /usr/local/bundle
USER nobody
EXPOSE ${port}
CMD ${JSON.stringify(startParts)}`;
  }
  if (beGroup === "php") {
    const startParts = (startCmd || "php -S 0.0.0.0:8000 public/index.php").split(" ");
    return `# syntax=docker/dockerfile:1.9
# PHP (${be.label ?? "PHP"}) \u2192 php-fpm runtime
# Non-root via www-data (UID 82 on Alpine PHP) \u2014 enforces I-7.

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
  if (beGroup === "nodejs" || beGroup === "bun" || beGroup === "deno") {
    const nsetup = pm.dockerSetup ? pm.dockerSetup + "\n" : "RUN corepack enable 2>/dev/null || true\n";
    const ncopy = pm.dockerCopy ?? "COPY package*.json ./";
    return `# syntax=docker/dockerfile:1.9
# Node API (${be.label ?? "Node"}) \u2192 distroless/nodejs22:nonroot

FROM ${builder} AS deps
WORKDIR /app
${nsetup}${ncopy}
RUN ${pm.installCmd || "npm ci --ignore-scripts"}

FROM ${builder} AS builder
WORKDIR /app
${nsetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --if-present

${baseNote("nodejs", config.baseimage)}FROM ${runtimeFor("nodejs", config.baseimage, "gcr.io/distroless/nodejs22-debian12:nonroot")} AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${port}
COPY --from=builder --chown=nonroot:nonroot /app ./
USER nonroot
EXPOSE ${port}
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \\
  CMD ["node", "-e", "fetch('http://127.0.0.1:${port}${healthPath}').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["${startCmd || "dist/index.js"}"]`;
  }
  if (feKey === "mobile" || feKey === "mobile-expo") {
    return `# Mobile stack (${fe.label}) does not use containers.
# Build artifact is an APK/IPA via EAS Build or React Native CLI.
# DevSecOps pipeline for mobile must replace S6/S7/S8 with mobile-native steps.`;
  }
  const pmSetup = pm.dockerSetup ? pm.dockerSetup + "\n" : "RUN corepack enable 2>/dev/null || true\n";
  const pmCopy = pm.dockerCopy ?? "COPY package*.json ./";
  const outputDir = fe.outputDir ?? "dist";
  if (isNextJS) {
    return `# syntax=docker/dockerfile:1.9
# Next.js 15 \u2192 distroless/nodejs22 (standalone build)
# REQUIRED: set output: 'standalone' in next.config.ts/js

FROM ${builder} AS deps
WORKDIR /app
${pmSetup}${pmCopy}
RUN ${pm.installCmd || "npm ci --ignore-scripts"}

FROM ${builder} AS builder
WORKDIR /app
${pmSetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

${baseNote("nodejs", config.baseimage)}FROM ${runtimeFor("nodejs", config.baseimage, runtime)} AS runtime
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
  if (fe.staticOutput === true) {
    return `# syntax=docker/dockerfile:1.9
# ${fe.label} (static SPA) \u2192 nginx 1.27-alpine

FROM ${builder} AS deps
WORKDIR /app
${pmSetup}${pmCopy}
RUN ${pm.installCmd || "npm ci --ignore-scripts"}

FROM ${builder} AS builder
WORKDIR /app
${pmSetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN ${fe.buildCmd ?? "npm run build"}

FROM nginx:1.27-alpine AS runtime
# Drop privileged ports \u2014 nginx unprivileged listens on 8080.
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
  const ssrEntry = feKey === "remix" ? "build/server/index.js" : feKey === "svelte" ? "build/index.js" : feKey === "nuxt" ? ".output/server/index.mjs" : `${outputDir}/index.js`;
  const ssrPort = fe.port ?? "3000";
  const ssrOutputBase = outputDir.split("/")[0];
  return `# syntax=docker/dockerfile:1.9
# ${fe.label ?? "App"} (SSR) \u2192 distroless/nodejs22

FROM ${builder} AS deps
WORKDIR /app
${pmSetup}${pmCopy}
RUN ${pm.installCmd || "npm ci --ignore-scripts"}

FROM ${builder} AS builder
WORKDIR /app
${pmSetup}COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN ${fe.buildCmd ?? "npm run build"}

${baseNote("nodejs", config.baseimage)}FROM ${runtimeFor("nodejs", config.baseimage, "gcr.io/distroless/nodejs22-debian12:nonroot")} AS runtime
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

// studio-v2/src/generators/workflow.ts
var TV = {
  actionCheckout: "actions/checkout@v4",
  actionUploadArtifact: "actions/upload-artifact@v4",
  actionDownloadArtifact: "actions/download-artifact@v4",
  preCommitAction: "pre-commit/action@v3.0.1",
  dependencyReview: "actions/dependency-review-action@v4",
  codeqlUploadSarif: "github/codeql-action/upload-sarif@v3",
  dockerLogin: "docker/login-action@v3",
  dockerBuildPush: "docker/build-push-action@v6",
  dockerSetupBuildx: "docker/setup-buildx-action@v3",
  dockerMetadata: "docker/metadata-action@v5",
  cosignInstaller: "sigstore/cosign-installer@v3.7.0",
  trivyAction: "aquasecurity/trivy-action@0.28.0",
  trivyImage: "aquasec/trivy:0.57.1",
  sbomAction: "anchore/sbom-action@v0.17.5",
  checkovAction: "bridgecrewio/checkov-action@v12",
  gitleaksAction: "gitleaks/gitleaks-action@v2",
  fossaAction: "fossas/fossa-action@v2",
  zapBaseline: "zaproxy/action-baseline@v0.13.0",
  slackAction: "slackapi/slack-github-action@v1.27.0",
  codecovAction: "codecov/codecov-action@v4",
  slsaGenerator: "slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0",
  awsConfigureCreds: "aws-actions/configure-aws-credentials@v4",
  awsEcrLogin: "aws-actions/amazon-ecr-login@v2",
  gcpAuth: "google-github-actions/auth@v2",
  azureLogin: "azure/login@v2",
  semgrepVersion: "1.92.0"
};
function buildRegMeta(regKey) {
  switch (regKey) {
    case "ecr":
      return {
        registryUrl: "${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com",
        imageRef: "${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Configure AWS credentials (OIDC)
        uses: ${TV.awsConfigureCreds}
        with:
          role-to-assume: \${{ vars.AWS_OIDC_ROLE_ARN }}
          aws-region: \${{ vars.AWS_REGION }}
          mask-aws-account-id: true

      - name: Login to ECR
        uses: ${TV.awsEcrLogin}
        with:
          mask-password: true`,
        promoteCmd: `aws ecr batch-check-layer-availability \\
            --repository-name myapp \\
            --layer-digests \${{ needs.build.outputs.image-digest }}
          docker buildx imagetools create \\
            --tag \${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ vars.AWS_REGION }}.amazonaws.com/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
    case "gar":
      return {
        registryUrl: "${{ vars.GAR_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/myrepo",
        imageRef: "${{ vars.GAR_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/myrepo/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Authenticate to GCP (OIDC)
        id: auth
        uses: ${TV.gcpAuth}
        with:
          workload_identity_provider: \${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: \${{ vars.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Login to GAR
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.GAR_REGION }}-docker.pkg.dev
          username: oauth2accesstoken
          password: \${{ steps.auth.outputs.access_token }}`,
        promoteCmd: `gcloud artifacts docker tags add \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            \${{ vars.GAR_REGION }}-docker.pkg.dev/\${{ vars.GCP_PROJECT }}/myrepo/myapp:latest`
      };
    case "acr":
      return {
        registryUrl: "${{ vars.ACR_NAME }}.azurecr.io",
        imageRef: "${{ vars.ACR_NAME }}.azurecr.io/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Azure login (OIDC federated credential)
        uses: ${TV.azureLogin}
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}

      - name: Login to ACR
        run: az acr login --name \${{ vars.ACR_NAME }}`,
        promoteCmd: `az acr import \\
            --name \${{ vars.ACR_NAME }} \\
            --source \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            --image myapp:latest`
      };
    case "dockerhub":
      return {
        registryUrl: "docker.io/${{ vars.DOCKERHUB_USERNAME }}",
        imageRef: "${{ vars.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Login to Docker Hub
        uses: ${TV.dockerLogin}
        with:
          username: \${{ vars.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.DOCKERHUB_USERNAME }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
    case "jfrog":
      return {
        registryUrl: "${{ vars.JFROG_REGISTRY }}",
        imageRef: "${{ vars.JFROG_REGISTRY }}/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Login to JFrog
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.JFROG_REGISTRY }}
          username: \${{ vars.JFROG_USERNAME }}
          password: \${{ secrets.JFROG_API_KEY }}`,
        promoteCmd: `# Re-tag by digest \u2014 JFrog supports digest-pinned promotion via buildx imagetools.
          docker buildx imagetools create \\
            --tag \${{ vars.JFROG_REGISTRY }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
    case "harbor":
      return {
        registryUrl: "${{ vars.HARBOR_HOST }}/${{ vars.HARBOR_PROJECT }}",
        imageRef: "${{ vars.HARBOR_HOST }}/${{ vars.HARBOR_PROJECT }}/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Login to Harbor
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.HARBOR_HOST }}
          username: \${{ vars.HARBOR_USERNAME }}
          password: \${{ secrets.HARBOR_PASSWORD }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.HARBOR_HOST }}/\${{ vars.HARBOR_PROJECT }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
    case "nexus":
      return {
        registryUrl: "${{ vars.NEXUS_HOST }}:${{ vars.NEXUS_PORT }}",
        imageRef: "${{ vars.NEXUS_HOST }}:${{ vars.NEXUS_PORT }}/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Login to Nexus
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.NEXUS_HOST }}:\${{ vars.NEXUS_PORT }}
          username: \${{ vars.NEXUS_USERNAME }}
          password: \${{ secrets.NEXUS_PASSWORD }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.NEXUS_HOST }}:\${{ vars.NEXUS_PORT }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
    case "quay":
      return {
        registryUrl: "quay.io/${{ vars.QUAY_ORG }}",
        imageRef: "quay.io/${{ vars.QUAY_ORG }}/myapp:${{ github.sha }}",
        extraPerms: "",
        loginYAML: `      - name: Login to Quay.io
        uses: ${TV.dockerLogin}
        with:
          registry: quay.io
          username: \${{ vars.QUAY_ROBOT_ACCOUNT }}
          password: \${{ secrets.QUAY_ROBOT_TOKEN }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag quay.io/\${{ vars.QUAY_ORG }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
    case "ttlsh":
      return {
        registryUrl: "ttl.sh",
        imageRef: "ttl.sh/$(uuidgen):1h",
        extraPerms: "",
        loginYAML: `      - name: ttl.sh requires no login
        run: echo "ttl.sh \u2014 anonymous push. Image auto-expires per tag suffix."`,
        promoteCmd: `# ttl.sh disposable images cannot be promoted \u2014 by design.
          # Re-push to a durable registry for any prod/test environment.
          echo "ttl.sh is intentionally ephemeral. Promote into GHCR/ECR before deploy."`
      };
    // default: ghcr
    default:
      return {
        registryUrl: "ghcr.io/${{ github.repository_owner }}",
        imageRef: "ghcr.io/${{ github.repository_owner }}/myapp:${{ github.sha }}",
        extraPerms: "  packages: write\n",
        loginYAML: `      - name: Login to GHCR
        uses: ${TV.dockerLogin}
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag ghcr.io/\${{ github.repository_owner }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`
      };
  }
}
function getScanStepsGHA(cfg, imageArg) {
  const isPR = imageArg.startsWith("input");
  switch (cfg.scanner) {
    case "grype":
      return `      - name: Load image
        ${isPR ? "run: docker load -i /tmp/image.tar" : `run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`}
      - name: Container scan \u2014 Grype
        run: |
          docker run --rm \\
            -v /var/run/docker.sock:/var/run/docker.sock \\
            anchore/grype:v0.85.0 \\
            ${isPR ? "myapp:pr-${{ github.sha }}" : "${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}"} \\
            --severity critical --fail-on critical \\
            --output sarif > grype.sarif
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: grype.sarif`;
    case "snyk":
      return `      - name: Container scan \u2014 Snyk
        uses: snyk/actions/docker@master
        with:
          ${isPR ? "image: myapp:pr-${{ github.sha }}" : "image: ${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}"}
          args: --severity-threshold=high --file=Dockerfile
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: snyk.sarif`;
    case "anchore":
      return `      - name: Container scan \u2014 Anchore
        uses: anchore/scan-action@v4
        id: anchore-scan
        with:
          ${isPR ? "image: myapp:pr-${{ github.sha }}" : "image: ${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}"}
          fail-build: 'true'
          severity-cutoff: high
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: \${{ steps.anchore-scan.outputs.sarif }}`;
    default:
      return isPR ? `      - name: Load image
        run: docker load -i /tmp/image.tar
      - name: Container scan \u2014 Trivy
        uses: ${TV.trivyAction}
        with:
          input: /tmp/image.tar
          format: sarif
          output: trivy.sarif
          severity: HIGH,CRITICAL
          exit-code: '1'
          ignore-unfixed: false
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: trivy.sarif` : `      - name: Container scan \u2014 Trivy
        uses: ${TV.trivyAction}
        with:
          image-ref: \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          format: sarif
          output: trivy.sarif
          severity: HIGH,CRITICAL
          exit-code: '1'
          ignore-unfixed: false
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: trivy.sarif`;
  }
}
function getSBOMStepsGHA(cfg, phase) {
  const isPR = phase === "pr";
  const imageRef = isPR ? "myapp:pr-${{ github.sha }}" : "${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}";
  switch (cfg.sbom) {
    case "trivy":
      return `      ${isPR ? `- run: docker load -i /tmp/image.tar
      ` : ""}- name: SBOM generation \u2014 Trivy
        run: |
          docker run --rm \\
            -v /var/run/docker.sock:/var/run/docker.sock \\
            ${TV.trivyImage} \\
            image --format cyclonedx \\
            --output sbom.cdx.json \\
            ${imageRef}
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-${isPR ? "pr-" : "spdx-"}\${{ github.sha }}
          path: sbom.cdx.json`;
    case "cyclonedx":
      return `      - name: SBOM generation \u2014 CycloneDX
        run: |
          npm install -g @cyclonedx/cyclonedx-npm
          cyclonedx-npm --output-format JSON --output-file sbom.cdx.json
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-${isPR ? "pr-" : "spdx-"}\${{ github.sha }}
          path: sbom.cdx.json`;
    case "in-toto":
      return `      - name: SBOM + in-toto attestation \u2014 SLSA
        uses: ${TV.cosignInstaller}
      - run: |
          ${isPR ? "" : "# "}cosign attest --yes \\
            --predicate sbom.spdx.json \\
            --type spdxjson \\
            ${imageRef}
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-${isPR ? "pr-" : "spdx-"}\${{ github.sha }}
          path: sbom.spdx.json`;
    default:
      return isPR ? `      - run: docker load -i /tmp/image.tar
      - uses: ${TV.sbomAction}
        with:
          image: ${imageRef}
          format: spdx-json
          output-file: sbom.spdx.json
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-\${{ github.sha }}
          path: sbom.spdx.json` : `      - uses: ${TV.cosignInstaller}
      - uses: ${TV.sbomAction}
        with:
          image: ${imageRef}
          format: spdx-json
          output-file: sbom.spdx.json
          dependency-snapshot: true
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-spdx-\${{ github.sha }}
          path: sbom.spdx.json`;
  }
}
function getSignStepsGHA(cfg) {
  switch (cfg.signing) {
    case "notary2":
      return `      - name: Install Notation
        run: |
          curl -Lo notation.tar.gz https://github.com/notaryproject/notation/releases/latest/download/notation_linux_amd64.tar.gz
          tar xf notation.tar.gz && mv notation /usr/local/bin/
      - name: Sign image \u2014 Notation (Notary v2)
        run: |
          notation sign \\
            --signature-format cose \\
            --key "\${{ secrets.NOTATION_KEY_NAME }}" \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`;
    case "dct":
      return `      - name: Sign image \u2014 Docker Content Trust (legacy)
        env:
          DOCKER_CONTENT_TRUST: 1
          DOCKER_CONTENT_TRUST_SERVER: https://notary.docker.io
          DOCKER_CONTENT_TRUST_REPOSITORY_PASSPHRASE: \${{ secrets.DCT_PASSPHRASE }}
          DOCKER_CONTENT_TRUST_ROOT_PASSPHRASE: \${{ secrets.DCT_ROOT_PASSPHRASE }}
        run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          docker tag \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            \${{ needs.build.outputs.image-ref }}:signed
          docker push \${{ needs.build.outputs.image-ref }}:signed`;
    case "in-toto":
      return `      - uses: ${TV.cosignInstaller}
      - name: Sign + attest image \u2014 in-toto / SLSA
        run: |
          cosign attest --yes \\
            --rekor-url https://rekor.sigstore.dev \\
            --predicate sbom.spdx.json \\
            --type spdxjson \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          cosign sign --yes \\
            --rekor-url https://rekor.sigstore.dev \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`;
    default:
      return `      - uses: ${TV.cosignInstaller}
      - run: |
          cosign sign --yes --rekor-url https://rekor.sigstore.dev \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
      - run: |
          cosign attest --yes --rekor-url https://rekor.sigstore.dev \\
            --predicate sbom.spdx.json --type spdxjson \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`;
  }
}
function resolveStackCmds(config) {
  const beKey = config.beKey ?? "none";
  const feKey = config.feKey ?? "nextjs";
  const beGroup = (beKey.includes("-") ? beKey.split("-")[0] : beKey).toLowerCase();
  const pkgMgr = config.pkgMgr ?? "npm";
  let integrationTestCmd = "npm run test:integration";
  if (beGroup === "python") integrationTestCmd = "pytest tests/integration --no-cov";
  else if (beGroup === "go") integrationTestCmd = "go test ./tests/integration/... -tags=integration -count=1";
  else if (beGroup === "java") integrationTestCmd = "mvn verify -Pintegration-tests";
  else if (beGroup === "dotnet") integrationTestCmd = "dotnet test --filter Category=Integration";
  else if (beGroup === "rust") integrationTestCmd = 'cargo test --test "*integration*" --no-fail-fast';
  else if (beGroup === "ruby") integrationTestCmd = "bundle exec rspec spec/integration";
  else if (beGroup === "php") integrationTestCmd = "vendor/bin/phpunit --testsuite Integration";
  else if (beGroup === "nodejs") integrationTestCmd = "npm run test:integration";
  const PM_INSTALL = {
    npm: "npm ci --ignore-scripts",
    pnpm: "pnpm install --frozen-lockfile",
    yarn: "yarn install --frozen-lockfile",
    bun: "bun install --frozen-lockfile",
    pip: "pip install --no-cache-dir -r requirements.txt",
    poetry: "poetry install --no-dev --no-interaction",
    uv: "uv sync --frozen --no-dev",
    maven: "mvn dependency:resolve -q",
    gradle: "./gradlew dependencies --no-daemon",
    go: "go mod download",
    cargo: "cargo fetch",
    bundler: "bundle install --without development",
    composer: "composer install --no-dev --optimize-autoloader",
    dotnet: "dotnet restore"
  };
  const BE_TEST = {
    go: "go test ./... -race -coverprofile=coverage.out",
    python: "pytest --cov --cov-report=xml",
    java: "mvn test",
    dotnet: "dotnet test",
    rust: "cargo test",
    ruby: "bundle exec rspec",
    php: "vendor/bin/phpunit",
    nodejs: "npm test"
  };
  const FE_TEST = {
    nextjs: "npm test -- --coverage --ci",
    react: "npm test -- --coverage --ci",
    vue: "npm run test:unit",
    angular: "ng test --watch=false --browsers=ChromeHeadless"
  };
  const testCmd = BE_TEST[beGroup] ?? FE_TEST[feKey] ?? "npm test";
  const installCmd = PM_INSTALL[pkgMgr] ?? "npm ci --ignore-scripts";
  const port = config.port ?? "3000";
  const healthPath = config.healthPath ?? "/api/health";
  return { installCmd, testCmd, integrationTestCmd, port, healthPath };
}
function generatePRWorkflow(config) {
  return `name: PR Checks
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  security-events: write
  pull-requests: read

jobs:
  hooks:
    name: "S1: Pre-commit Hooks"
    runs-on: ubuntu-24.04
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - uses: ${TV.preCommitAction}
        with:
          extra_args: --all-files

  security:
    name: "Security Scans"
    runs-on: ubuntu-24.04
    strategy:
      fail-fast: false
      matrix:
        scan: [dependency-audit, sast, license, iac-scan, secret-scan]
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - name: Dependency review
        if: matrix.scan == 'dependency-audit'
        uses: ${TV.dependencyReview}
        with:
          fail-on-severity: high
          deny-licenses: GPL-2.0, GPL-3.0, LGPL-2.1, AGPL-3.0
      - name: SAST \u2014 Semgrep
        if: matrix.scan == 'sast'
        run: |
          pip install semgrep==${TV.semgrepVersion}
          semgrep ci --config p/owasp-top-ten --config p/secrets --sarif --output semgrep.sarif --error
        env:
          SEMGREP_APP_TOKEN: \${{ secrets.SEMGREP_APP_TOKEN }}
      - name: Upload Semgrep SARIF
        if: matrix.scan == 'sast' && always()
        uses: ${TV.codeqlUploadSarif}
        with:
          sarif_file: semgrep.sarif
      - name: License compliance \u2014 FOSSA
        if: matrix.scan == 'license'
        uses: ${TV.fossaAction}
        with:
          api-key: \${{ secrets.FOSSA_API_KEY }}
          run-tests: true
      - name: IaC scan \u2014 Checkov
        if: matrix.scan == 'iac-scan'
        uses: ${TV.checkovAction}
        with:
          directory: .
          framework: dockerfile,kubernetes,github_actions
          output_format: sarif
          output_file_path: checkov.sarif
          soft_fail: false
      - name: Upload Checkov SARIF
        if: matrix.scan == 'iac-scan' && always()
        uses: ${TV.codeqlUploadSarif}
        with:
          sarif_file: checkov.sarif
      - name: Secret scan \u2014 Gitleaks
        if: matrix.scan == 'secret-scan'
        uses: ${TV.gitleaksAction}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: .gitleaks.toml

  build:
    name: "S6: Docker Build (no push)"
    runs-on: ubuntu-24.04
    needs: [hooks, security]
    steps:
      - uses: ${TV.actionCheckout}
      - uses: ${TV.dockerSetupBuildx}
      - name: Build image (no push)
        uses: ${TV.dockerBuildPush}
        with:
          context: .
          platforms: linux/amd64
          push: false
          tags: myapp:pr-\${{ github.sha }}
          outputs: type=docker,dest=/tmp/image.tar
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false
          sbom: false
      - uses: ${TV.actionUploadArtifact}
        with:
          name: image-tar-\${{ github.sha }}
          path: /tmp/image.tar
          retention-days: 1

  sbom-gen:
    name: "S8a: SBOM Generation (${config.sbom})"
    runs-on: ubuntu-24.04
    needs: [build]
    steps:
      - uses: ${TV.actionDownloadArtifact}
        with:
          name: image-tar-\${{ github.sha }}
          path: /tmp
${getSBOMStepsGHA(config, "pr")}

  scan:
    name: "S7: Container Vulnerability Scan (${config.scanner})"
    runs-on: ubuntu-24.04
    needs: [sbom-gen]
    steps:
      - uses: ${TV.actionDownloadArtifact}
        with:
          name: image-tar-\${{ github.sha }}
          path: /tmp
${getScanStepsGHA(config, "input: /tmp/image.tar")}`;
}
function generateMainWorkflow(config) {
  const reg = buildRegMeta(config.regKey);
  const cmds = resolveStackCmds(config);
  const ciIssuer = "https://token.actions.githubusercontent.com";
  return `name: Main Pipeline
on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write
  security-events: write
  actions: read
${reg.extraPerms}
env:
  IMAGE_NAME: myapp
  REGISTRY: ${reg.registryUrl}
  IMAGE_REF: ${reg.imageRef}

jobs:
  setup:
    name: "S0: Auth + Registry Login"
    runs-on: ubuntu-24.04
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
${reg.loginYAML}

  hooks:
    name: "S1: Pre-commit Hooks"
    runs-on: ubuntu-24.04
    needs: [setup]
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - uses: ${TV.preCommitAction}
        with:
          extra_args: --all-files

  security:
    name: "Security Scans"
    runs-on: ubuntu-24.04
    needs: [setup]
    strategy:
      fail-fast: false
      matrix:
        scan: [dependency-audit, sast, license, iac-scan, secret-scan]
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - name: Dependency review
        if: matrix.scan == 'dependency-audit'
        uses: ${TV.dependencyReview}
        with:
          fail-on-severity: high
      - name: SAST
        if: matrix.scan == 'sast'
        run: pip install semgrep==${TV.semgrepVersion} && semgrep ci --config p/owasp-top-ten --sarif --output semgrep.sarif --error
        env:
          SEMGREP_APP_TOKEN: \${{ secrets.SEMGREP_APP_TOKEN }}
      - name: License
        if: matrix.scan == 'license'
        uses: ${TV.fossaAction}
        with:
          api-key: \${{ secrets.FOSSA_API_KEY }}
          run-tests: true
      - name: IaC
        if: matrix.scan == 'iac-scan'
        uses: ${TV.checkovAction}
        with:
          directory: .
          framework: dockerfile,kubernetes,github_actions
      - name: Secrets
        if: matrix.scan == 'secret-scan'
        uses: ${TV.gitleaksAction}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  build:
    name: "S6: Build + Push"
    runs-on: ubuntu-24.04
    needs: [hooks, security]
    outputs:
      image-ref: \${{ steps.image-name.outputs.ref }}
      image-base: \${{ steps.image-name.outputs.base }}
      image-digest: \${{ steps.build.outputs.digest }}
    steps:
      - uses: ${TV.actionCheckout}
${reg.loginYAML}
      - uses: ${TV.dockerSetupBuildx}
      - id: meta
        uses: ${TV.dockerMetadata}
        with:
          images: ${reg.registryUrl}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=,format=long
            type=ref,event=branch
      - id: build
        uses: ${TV.dockerBuildPush}
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          provenance: false
          sbom: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - id: image-name
        run: |
          echo "ref=${reg.registryUrl}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "base=${reg.registryUrl}/\${{ env.IMAGE_NAME }}" >> $GITHUB_OUTPUT

  sbom-gen:
    name: "S8a: SBOM Generation (${config.sbom})"
    runs-on: ubuntu-24.04
    needs: [build]
    steps:
${getSBOMStepsGHA(config, "main")}

  scan:
    name: "S7: Container Vulnerability Scan (${config.scanner})"
    runs-on: ubuntu-24.04
    needs: [sbom-gen, build]
    steps:
${getScanStepsGHA(config, "image-ref: ${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}")}

  sign:
    name: "S8b: Sign + Attest (${config.signing})"
    runs-on: ubuntu-24.04
    # Hard-depends on sbom-gen \u2014 the SBOM artifact is downloaded in this job.
    needs: [scan, build, sbom-gen]
    permissions:
      id-token: write
      packages: write
    steps:
      - uses: ${TV.actionDownloadArtifact}
        with:
          name: sbom-spdx-\${{ github.sha }}
${reg.loginYAML}
${getSignStepsGHA(config)}

  test:
    name: "S9: Test Suite"
    runs-on: ubuntu-24.04
    needs: [build]
    steps:
      - uses: ${TV.actionCheckout}
      - run: ${cmds.installCmd}
      - run: ${cmds.testCmd}
        env:
          CI: "true"
      - uses: ${TV.codecovAction}
        if: always()
        with:
          fail_ci_if_error: false

  integration-test:
    name: "S9a: Integration Tests"
    runs-on: ubuntu-24.04
    needs: [test, build]
    steps:
      - uses: ${TV.actionCheckout}
${reg.loginYAML}
      - run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          docker run -d --name app -p ${cmds.port}:${cmds.port} \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          timeout 30 bash -c 'until curl -sf http://localhost:${cmds.port}${cmds.healthPath}; do sleep 1; done'
          ${cmds.installCmd}
          ${cmds.integrationTestCmd}
        env:
          TEST_BASE_URL: http://localhost:${cmds.port}
      - run: docker rm -f app || true
        if: always()

  dast:
    name: "DAST: Dynamic App Security"
    runs-on: ubuntu-24.04
    needs: [integration-test, build]
    steps:
${reg.loginYAML}
      - run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          docker run -d -p ${cmds.port}:${cmds.port} --name dastapp \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          timeout 30 bash -c 'until curl -sf http://localhost:${cmds.port}${cmds.healthPath}; do sleep 1; done'
      - uses: zaproxy/action-baseline@v0.13.0
        with:
          target: 'http://localhost:${cmds.port}'
          fail_action: true
      - run: docker rm -f dastapp || true
        if: always()

  provenance:
    name: "S10: SLSA Level 3 Provenance"
    needs: [scan, build]
    permissions:
      actions: read
      id-token: write
      packages: write
    # image: bare repository (no tag). digest: immutable identity.
    # Registry creds: GHCR uses GITHUB_TOKEN; other registries \u2014 replace with
    # the appropriate secret in repo settings (see Setup Guide for each registry).
    uses: ${TV.slsaGenerator}
    with:
      image: \${{ needs.build.outputs.image-base }}
      digest: \${{ needs.build.outputs.image-digest }}
    secrets:
      registry-username: \${{ secrets.SLSA_REGISTRY_USERNAME || github.actor }}
      registry-password: \${{ secrets.SLSA_REGISTRY_PASSWORD || secrets.GITHUB_TOKEN }}

  notify:
    name: "S12: Build Notification"
    runs-on: ubuntu-24.04
    needs: [sign, test, dast, provenance]
    if: always()
    steps:
      - name: Notify success
        if: \${{ !contains(needs.*.result, 'failure') }}
        uses: ${TV.slackAction}
        with:
          channel-id: 'C0DEPLOYMENTS'
          payload: |
            {"text": "\u2705 Pipeline passed: \${{ github.repository }} @ \${{ github.sha }}"}
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}
      - name: Notify failure
        if: \${{ contains(needs.*.result, 'failure') }}
        uses: ${TV.slackAction}
        with:
          channel-id: 'C0ALERTS'
          payload: |
            {"text": "\u274C Pipeline FAILED: \${{ github.repository }} @ \${{ github.sha }}"}
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}

  promote:
    name: "S13: Promote to :latest"
    runs-on: ubuntu-24.04
    # Gated on ACTUAL upstream jobs \u2014 notify always succeeds (if: always()),
    # so checking notify.result would let a failed pipeline promote :latest.
    # I-13: :latest must never reflect a failed build.
    needs: [build, sign, test, dast, provenance]
    if: \${{ needs.sign.result == 'success' && needs.test.result == 'success' && needs.dast.result == 'success' && needs.provenance.result == 'success' }}
    steps:
${reg.loginYAML}
      - run: |
          ${reg.promoteCmd}

  verify:
    name: "S14: Signature Verification"
    runs-on: ubuntu-24.04
    needs: [promote, build]
    steps:
      - uses: ${TV.cosignInstaller}
      - run: |
          cosign verify \\
            --certificate-identity-regexp \\
              "https://github.com/\${{ github.repository }}/.github/workflows/" \\
            --certificate-oidc-issuer "${ciIssuer}" \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
      - run: |
          cosign verify-attestation --type spdxjson \\
            --certificate-identity-regexp \\
              "https://github.com/\${{ github.repository }}/.github/workflows/" \\
            --certificate-oidc-issuer "${ciIssuer}" \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            | jq '.payload | @base64d | fromjson | .subject[0].name'`;
}

// studio-v2/src/generators/helm.ts
function generateHelmValues(cfg, env) {
  const app = cfg.appName ?? "myapp";
  const port = cfg.port ?? 3e3;
  const healthPath = cfg.healthPath ?? "/health";
  const envConfigs = {
    dev: {
      replicas: 1,
      cpuRequest: "50m",
      cpuLimit: "200m",
      memRequest: "64Mi",
      memLimit: "256Mi",
      tag: "dev-latest",
      ingress: false
    },
    staging: {
      replicas: 3,
      cpuRequest: "100m",
      cpuLimit: "500m",
      memRequest: "128Mi",
      memLimit: "512Mi",
      tag: "staging-latest",
      ingress: true
    },
    prod: {
      replicas: 10,
      cpuRequest: "250m",
      cpuLimit: "1000m",
      memRequest: "256Mi",
      memLimit: "1Gi",
      tag: "latest",
      ingress: true
    }
  };
  const c = envConfigs[env];
  return `# deploy/charts/${app}/values-${env}.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Environment: ${env.toUpperCase()}

replicaCount: ${c.replicas}

image:
  repository: ${app}
  tag: "${c.tag}"   # Patched by CI: helm upgrade --set image.tag=<sha>
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80
  targetPort: ${port}

resources:
  requests:
    cpu: "${c.cpuRequest}"
    memory: "${c.memRequest}"
  limits:
    cpu: "${c.cpuLimit}"
    memory: "${c.memLimit}"

# Security: enforce non-root at Helm level (redundant with Kyverno \u2014 defense in depth).
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false

probes:
  readiness:
    path: ${healthPath}
    port: ${port}
    initialDelaySeconds: 5
    periodSeconds: 10
  liveness:
    path: ${healthPath}
    port: ${port}
    initialDelaySeconds: 15
    periodSeconds: 20
${c.ingress ? `
ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: ${app}-${env}.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ${app}-${env}-tls
      hosts:
        - ${app}-${env}.example.com
` : `
ingress:
  enabled: false
`}${env === "prod" ? `
# Production: PodDisruptionBudget prevents full outage during rolling updates.
podDisruptionBudget:
  enabled: true
  minAvailable: 2

# Production: HorizontalPodAutoscaler scales on CPU.
autoscaling:
  enabled: true
  minReplicas: ${c.replicas}
  maxReplicas: ${c.replicas * 3}
  targetCPUUtilizationPercentage: 70
` : ""}`;
}

// studio-v2/src/generators/kustomize.ts
function generateDockerIgnore(_cfg) {
  return `# .dockerignore
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Keeps build context small and avoids leaking sensitive files into the image.

# VCS
.git
.gitignore
.gitattributes

# Dev tooling
node_modules
.pnp
.pnp.js
.yarn/cache
.yarn/unplugged

# Build artifacts
dist
build
.next
.nuxt
out
coverage
.turbo

# Tests \u2014 never in production image
__tests__
*.test.ts
*.test.js
*.spec.ts
*.spec.js
e2e
playwright-report

# Secrets + env \u2014 never in production image
.env
.env.*
*.pem
*.key
*.p12
*.pfx
secrets/

# Docs + CI metadata
*.md
README*
CHANGELOG*
CONTRIBUTING*
.github
.gitlab
Jenkinsfile
azure-pipelines.yml

# Tooling configs that don't affect runtime
.eslintrc*
.prettierrc*
.pre-commit-config.yaml
.gitleaks.toml
.trivyignore
.checkov.yaml
tsconfig*.json
`;
}
function generateBaseDeployment(cfg) {
  const app = cfg.appName ?? "myapp";
  const port = cfg.port ?? 3e3;
  const healthPath = cfg.healthPath ?? "/health";
  return `# deploy/base/deployment.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Security: non-root, read-only root filesystem, no privilege escalation.
# Image digest pinned at deploy time by ArgoCD/Flux (kustomize edit set image).

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app}
  labels:
    app: ${app}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${app}
  template:
    metadata:
      labels:
        app: ${app}
      annotations:
        # cosign verify-image runs as a Kyverno policy at admission \u2014 see sbom-policy.yaml
        policy.sigstore.dev/include: "true"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: ${app}
          image: ${app}:latest   # Kustomize patches this with digest at deploy time
          ports:
            - containerPort: ${port}
              protocol: TCP
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
          readinessProbe:
            httpGet:
              path: ${healthPath}
              port: ${port}
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: ${healthPath}
              port: ${port}
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: ${app}
spec:
  selector:
    app: ${app}
  ports:
    - port: 80
      targetPort: ${port}
`;
}
function generateBaseKustomization(cfg) {
  const app = cfg.appName ?? "myapp";
  return `# deploy/base/kustomization.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24

apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
metadata:
  name: ${app}-base

resources:
  - deployment.yaml

images:
  - name: ${app}
    newTag: latest   # Patched by CI: kustomize edit set image ${app}=<registry>/<image>@sha256:<digest>
`;
}
function generateOverlayKustomization(cfg, env) {
  const app = cfg.appName ?? "myapp";
  const replicas = { dev: 1, test: 2, staging: 3, prod: 10 }[env];
  const namespace = env === "prod" ? "production" : env;
  return `# deploy/overlays/${env}/kustomization.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24

apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
metadata:
  name: ${app}-${env}

namespace: ${namespace}

resources:
  - ../../base

patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: ${app}
      spec:
        replicas: ${replicas}
    target:
      kind: Deployment
      name: ${app}
`;
}

// studio-v2/src/lib/tools.ts
var TOOL_VERSIONS = {
  // GitHub Actions
  actionCheckout: "actions/checkout@v4",
  actionUploadArtifact: "actions/upload-artifact@v4",
  actionDownloadArtifact: "actions/download-artifact@v4",
  actionCache: "actions/cache@v4",
  preCommitAction: "pre-commit/action@v3.0.1",
  dependencyReview: "actions/dependency-review-action@v4",
  codeqlUploadSarif: "github/codeql-action/upload-sarif@v3",
  dockerLogin: "docker/login-action@v3",
  dockerBuildPush: "docker/build-push-action@v6",
  dockerSetupBuildx: "docker/setup-buildx-action@v3",
  dockerSetupQemu: "docker/setup-qemu-action@v3",
  dockerMetadata: "docker/metadata-action@v5",
  cosignInstaller: "sigstore/cosign-installer@v3.7.0",
  cosignImage: "ghcr.io/sigstore/cosign/cosign:v2.4.1",
  trivyAction: "aquasecurity/trivy-action@0.28.0",
  trivyImage: "aquasec/trivy:0.57.1",
  sbomAction: "anchore/sbom-action@v0.17.5",
  syftImage: "anchore/syft:v1.18.0",
  checkovImage: "bridgecrew/checkov:3.2.405",
  kanikoImage: "gcr.io/kaniko-project/executor:v1.23.2",
  k6Image: "grafana/k6:0.55.0",
  gitleaksImage: "zricethezav/gitleaks:v8.21.2",
  checkovAction: "bridgecrewio/checkov-action@v12",
  gitleaksAction: "gitleaks/gitleaks-action@v2",
  fossaAction: "fossas/fossa-action@v2",
  zapBaseline: "zaproxy/action-baseline@v0.13.0",
  zapImage: "zaproxy/zap-stable:2.16.0",
  slackAction: "slackapi/slack-github-action@v1.27.0",
  codecovAction: "codecov/codecov-action@v4",
  slsaGenerator: "slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0",
  awsConfigureCreds: "aws-actions/configure-aws-credentials@v4",
  awsEcrLogin: "aws-actions/amazon-ecr-login@v2",
  gcpAuth: "google-github-actions/auth@v2",
  azureLogin: "azure/login@v2",
  // Standalone CLI versions
  semgrepVersion: "1.92.0",
  k6Action: "grafana/run-k6-action@v1",
  // Base images for non-GHA CI jobs
  nodeImage: "node:22-alpine",
  pythonImage: "python:3.12-slim",
  golangImage: "golang:1.23-alpine",
  javaImage: "eclipse-temurin:21-jdk-alpine",
  rustImage: "rust:1.87-alpine",
  rubyImage: "ruby:3.3-alpine",
  phpImage: "php:8.3-alpine",
  dotnetSdkImage: "mcr.microsoft.com/dotnet/sdk:8.0",
  cimgBase: "cimg/base:2024.01",
  cimgNode: "cimg/node:22.0",
  cimgPython: "cimg/python:3.12",
  cimgGo: "cimg/go:1.22"
};
var TV2 = TOOL_VERSIONS;

// studio-v2/src/generators/hooks.ts
function langExtras(cfg) {
  const be = cfg.beKey;
  const fe = cfg.feKey;
  const lines = [];
  if (fe.includes("react") || fe.includes("vue") || fe.includes("angular") || fe.includes("svelte") || fe.includes("next") || fe.includes("remix") || fe.includes("nuxt")) {
    lines.push(`  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v9.16.0
    hooks:
      - id: eslint
        files: \\.[jt]sx?$
        types: [file]`);
  }
  if (be.includes("python") || fe.includes("python")) {
    lines.push(`  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
      - id: ruff-format`);
  }
  if (be.includes("go-")) {
    lines.push(`  - repo: https://github.com/golangci/golangci-lint
    rev: v1.62.0
    hooks:
      - id: golangci-lint`);
  }
  if (be.includes("rust-")) {
    lines.push(`  - repo: local
    hooks:
      - id: cargo-fmt
        name: cargo fmt
        entry: cargo fmt --
        language: system
        types: [rust]`);
  }
  return lines.join("\n");
}
function generatePreCommitConfig(cfg) {
  const extras = langExtras(cfg);
  return `# .pre-commit-config.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Run locally: pre-commit run --all-files
# Install: pip install pre-commit && pre-commit install
# Same hooks run in CI (S1) to catch --no-verify bypasses.

repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: ${TV2.gitleaksImage.replace("zricethezav/gitleaks:", "")}
    hooks:
      - id: gitleaks

  - repo: https://github.com/hadolint/hadolint
    rev: v2.13.1-beta
    hooks:
      - id: hadolint-docker
        args: [--failure-threshold, error]

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-merge-conflict
      - id: detect-private-key
      - id: check-added-large-files
        args: [--maxkb=500]
${extras}
  - repo: https://github.com/bridgecrewio/checkov
    rev: 3.2.405
    hooks:
      - id: checkov
        args: [--quiet, --compact]
`;
}
function generateGitleaksConfig(_cfg) {
  return `# .gitleaks.toml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Allowlist: add repo-specific patterns below.
# Never add real secrets \u2014 only patterns for known false-positives.
# Reference: https://github.com/gitleaks/gitleaks

title = "gitleaks config"

[allowlist]
  description = "Repo-specific allowlist"
  regexTarget = "match"
  # Example: test fixture secrets (never real)
  # regexes = ["EXAMPLE_TEST_SECRET"]
  paths = [
    '''.gitleaks.toml''',
    '''tests/fixtures/''',
    '''testdata/''',
  ]

# Policy: no secret type is exempt by default.
# If a finding is a false-positive, add it here with a comment explaining why.
# All allowlist changes require a second reviewer approval per I-2.
`;
}
function generateTrivyIgnore(_cfg) {
  return `# .trivyignore
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Policy: suppress a CVE only when ALL three conditions are met:
#   1. The CVE has no fix available from upstream.
#   2. The CVE has been reviewed by your security team.
#   3. An expiry date is set (max 90 days \u2014 I-19).
#
# Format: CVE-ID [expiry:YYYY-MM-DD] # Reviewer: name / Reason: one-line
#
# Example (uncomment and edit):
# CVE-2024-12345 exp:2026-08-24 # Reviewer: jane / Reason: no fix, base image risk accepted
#
# All suppressions require a PR review by a team member with security approval.
# Suppressions without an expiry date are rejected by the pipeline.
`;
}
function generateCheckovConfig(_cfg) {
  return `# .checkov.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Checkov IaC scanner configuration.
# Reference: https://www.checkov.io/5.Policy%20Index/all.html

quiet: true
compact: true
output: cli

# Checks to skip \u2014 only skip with documented justification.
# Policy: same conditions as .trivyignore (no fix + security team review + expiry comment).
skip-check:
  # Example: CKV_DOCKER_2 - Healthcheck in Dockerfile
  # Skipped because: healthcheck managed externally by Kubernetes probes (readinessProbe/livenessProbe).
  - CKV_DOCKER_2

# Soft-fail: do not block CI on informational findings.
# Remove this if you want to gate on everything.
soft-fail-on:
  - LOW
`;
}
function generateSbomPolicy(_cfg) {
  return `# sbom-policy.yaml
# Generated by DevSecOps Pipeline Studio \u2014 2026-05-24
# Kyverno ClusterPolicy: enforce image signing + SBOM attestation before any pod starts.
# Prerequisites: Kyverno installed in cluster, cosign public key or keyless configured.
# Invariant: I-20 (admission gate \u2014 no unsigned image reaches prod).
# Reference: https://kyverno.io/policies/other/verify-image/verify-image/

apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signature
  annotations:
    policies.kyverno.io/title: Verify Image Signature + SBOM
    policies.kyverno.io/category: Supply Chain Security
    policies.kyverno.io/severity: high
    policies.kyverno.io/description: >-
      Requires all images to be signed by cosign (keyless, Sigstore Rekor transparency log).
      Requires SBOM attestation to be present. Blocks unsigned/unattested images at admission.
      Enforces Invariant I-20.
spec:
  validationFailureAction: Enforce
  background: false
  rules:
    - name: check-image-signature
      match:
        any:
          - resources:
              kinds: [Pod]
              namespaces: ["default", "production", "staging"]
      verifyImages:
        - imageReferences: ["*"]
          attestors:
            - count: 1
              entries:
                - keyless:
                    subject: "https://github.com/*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: https://rekor.sigstore.dev
          attestations:
            - predicateType: https://spdx.dev/Document
              conditions:
                - all:
                    - key: "{{ spdxVersion }}"
                      operator: NotEquals
                      value: ""
`;
}

// studio-v2/src/generators/deploy.ts
var FRONTEND_META = {
  nextjs: { label: "Next.js 15", port: "3000", healthPath: "/api/health" },
  react: { label: "React SPA", port: "80", healthPath: "/" },
  vue: { label: "Vue 3", port: "80", healthPath: "/" },
  angular: { label: "Angular 18", port: "80", healthPath: "/" },
  svelte: { label: "SvelteKit", port: "3000", healthPath: "/api/health" },
  nuxt: { label: "Nuxt 3", port: "3000", healthPath: "/api/health" },
  remix: { label: "Remix 2", port: "3000", healthPath: "/api/health" },
  "react-vite": { label: "React + Vite", port: "80", healthPath: "/" },
  gatsby: { label: "Gatsby 5", port: "80", healthPath: "/" },
  "vue-vite": { label: "Vue 3 + Vite", port: "80", healthPath: "/" },
  astro: { label: "Astro 4", port: "3000", healthPath: "/" },
  solid: { label: "SolidStart", port: "3000", healthPath: "/api/health" },
  "solid-vite": { label: "Solid + Vite", port: "80", healthPath: "/" },
  qwik: { label: "Qwik City", port: "3000", healthPath: "/health" },
  tanstack: { label: "TanStack Start", port: "3000", healthPath: "/health" },
  "preact-vite": { label: "Preact + Vite", port: "80", healthPath: "/" },
  lit: { label: "Lit (Web Components)", port: "80", healthPath: "/" },
  redwood: { label: "RedwoodJS", port: "8910", healthPath: "/.redwood/functions/healthz" },
  fresh: { label: "Fresh (Deno)", port: "8000", healthPath: "/health" }
};
var BACKEND_META = {
  none: { label: "None" },
  nodejs: { label: "Node.js", port: "3000", healthPath: "/api/health" },
  go: { label: "Go", port: "8080", healthPath: "/health" },
  python: { label: "Python", port: "8000", healthPath: "/health" },
  java: { label: "Java (Spring)", port: "8080", healthPath: "/actuator/health" },
  dotnet: { label: ".NET", port: "8080", healthPath: "/health" },
  rust: { label: "Rust", port: "8080", healthPath: "/health" },
  ruby: { label: "Ruby", port: "3000", healthPath: "/health" },
  php: { label: "PHP", port: "8000", healthPath: "/health" },
  "nodejs-express": { label: "Express", port: "3000", healthPath: "/health" },
  "nodejs-fastify": { label: "Fastify", port: "3000", healthPath: "/health" },
  "nodejs-nest": { label: "NestJS", port: "3000", healthPath: "/health" },
  "nodejs-hono": { label: "Hono", port: "3000", healthPath: "/health" },
  "python-fastapi": { label: "FastAPI", port: "8000", healthPath: "/health" },
  "python-django": { label: "Django", port: "8000", healthPath: "/health/" },
  "python-flask": { label: "Flask", port: "5000", healthPath: "/health" },
  "python-litestar": { label: "Litestar", port: "8000", healthPath: "/health" },
  "java-spring": { label: "Spring Boot 3", port: "8080", healthPath: "/actuator/health" },
  "java-quarkus": { label: "Quarkus", port: "8080", healthPath: "/q/health" },
  "java-micronaut": { label: "Micronaut", port: "8080", healthPath: "/health" },
  "go-gin": { label: "Go + gin", port: "8080", healthPath: "/health" },
  "go-echo": { label: "Go + echo", port: "8080", healthPath: "/health" },
  "go-chi": { label: "Go + chi", port: "8080", healthPath: "/health" },
  "go-stdlib": { label: "Go stdlib", port: "8080", healthPath: "/health" },
  "go-fiber": { label: "Go + fiber", port: "8080", healthPath: "/health" },
  "rust-axum": { label: "Axum", port: "8080", healthPath: "/health" },
  "rust-actix": { label: "Actix-web", port: "8080", healthPath: "/health" },
  "rust-rocket": { label: "Rocket", port: "8000", healthPath: "/health" },
  "rust-warp": { label: "Warp", port: "8080", healthPath: "/health" },
  "ruby-rails": { label: "Rails 7", port: "3000", healthPath: "/health" },
  "ruby-sinatra": { label: "Sinatra", port: "4567", healthPath: "/health" },
  "php-laravel": { label: "Laravel 11", port: "8000", healthPath: "/health" },
  "php-symfony": { label: "Symfony 7", port: "8000", healthPath: "/health" },
  "php-slim": { label: "Slim 4", port: "8000", healthPath: "/health" },
  "nodejs-koa": { label: "Koa", port: "3000", healthPath: "/health" },
  "elixir-phoenix": { label: "Phoenix", port: "4000", healthPath: "/health" },
  "kotlin-ktor": { label: "Ktor", port: "8080", healthPath: "/health" },
  "bun-elysia": { label: "Elysia (Bun)", port: "3000", healthPath: "/health" },
  "deno-fresh-api": { label: "Fresh API (Deno)", port: "8000", healthPath: "/health" },
  "python-starlette": { label: "Starlette", port: "8000", healthPath: "/health" },
  "java-javalin": { label: "Javalin", port: "7070", healthPath: "/health" },
  "swift-vapor": { label: "Vapor (Swift)", port: "8080", healthPath: "/health" },
  "elixir-live": { label: "Phoenix LiveView", port: "4000", healthPath: "/health" }
};
function resolveDeployContext(config) {
  const fe = FRONTEND_META[config.feKey] ?? {};
  const be = BACKEND_META[config.beKey] ?? {};
  const port = config.port ?? be.port ?? fe.port ?? "8080";
  const healthPath = config.healthPath ?? be.healthPath ?? fe.healthPath ?? "/health";
  const app = config.appName ?? "myapp";
  const cd = config.cd ?? "argocd";
  const gitops = config.gitops ?? "same-repo";
  const sameRepo = gitops === "same-repo";
  const feLbl = fe.label;
  const beLbl = be.label;
  const stackTag = [feLbl, beLbl].filter((l) => !!l && l !== "None").join(" + ") || "generic";
  return { app, port, healthPath, stackTag, cd, gitops, sameRepo };
}
function genArgoCDApp(config) {
  const { app, cd, sameRepo } = resolveDeployContext(config);
  if (cd !== "argocd") {
    return `# Not emitted \u2014 current CD tool is ${cd}.
# Switch CD to ArgoCD to emit this file.`;
  }
  const repoURL = sameRepo ? "https://github.com/YOUR_ORG/YOUR_APP_REPO" : "https://github.com/YOUR_ORG/YOUR_CONFIG_REPO";
  const path = sameRepo ? "deploy/overlays/dev" : "overlays/dev";
  return `# ArgoCD Application \u2014 bootstrap with:
#   kubectl apply -n argocd -f deploy/argocd-app.yaml
# Then ArgoCD pulls + reconciles automatically on every commit.
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${app}-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: ${repoURL}
    targetRevision: main
    path: ${path}
  destination:
    server: https://kubernetes.default.svc
    namespace: ${app}-dev
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [ "CreateNamespace=true" ]
`;
}
function genBaseKustomization(config) {
  const app = config.appName ?? "myapp";
  return `# Base kustomization \u2014 referenced by every overlay.
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
images:
  - name: ${app}
    newName: REGISTRY/${app}           # set by CI's "Bump image digest" step
    digest: sha256:DIGEST               # digest-pinned, never a tag (I-3)
`;
}
function genBaseDeployment(config) {
  const { app, port, healthPath, stackTag } = resolveDeployContext(config);
  return `# Base Deployment. Overlays patch replicas + env per environment.
# Configured for: ${stackTag} \xB7 containerPort ${port} \xB7 readiness ${healthPath}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app}
  labels: { app: ${app} }
spec:
  replicas: 2
  selector:
    matchLabels: { app: ${app} }
  template:
    metadata:
      labels: { app: ${app} }
    spec:
      # securityContext + readOnlyRootFilesystem match common admission policies
      securityContext:
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
        - name: ${app}
          image: ${app}                # rewritten by kustomize image transformer
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: ${port}
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
          readinessProbe:
            httpGet: { path: ${healthPath}, port: ${port} }
            initialDelaySeconds: 3
            periodSeconds: 5
`;
}
function genBaseService(config) {
  const { app, port, stackTag } = resolveDeployContext(config);
  return `# Configured for: ${stackTag} \xB7 targetPort ${port}
apiVersion: v1
kind: Service
metadata:
  name: ${app}
spec:
  selector: { app: ${app} }
  ports:
    - port: 80
      targetPort: ${port}
      protocol: TCP
`;
}
function genOverlayKustomization(config, env) {
  const app = config.appName ?? "myapp";
  const replicas = env === "dev" ? 1 : env === "staging" ? 3 : 10;
  return `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: ${app}-${env}
resources:
  - ../../base
replicas:
  - name: ${app}
    count: ${replicas}
patches:
  - target: { kind: Deployment, name: ${app} }
    patch: |
      - op: add
        path: /spec/template/spec/containers/0/env
        value:
          - name: ENV
            value: ${env}
`;
}
function genDeployReadme(config) {
  const { cd, gitops, sameRepo } = resolveDeployContext(config);
  if (gitops === "push") {
    return `# Deploy \u2014 push mode (no GitOps)

You picked **push deploy**. CI runs \`helm upgrade\` directly from the
main workflow. No drift detection, no auto-sync, no audit trail.

## What you need before the first deploy
1. \`kubectl\` configured for your target cluster (cluster admin gave you a kubeconfig)
2. Helm 3 installed in your CI runner
3. A namespace for each environment: \`kubectl create ns myapp-dev myapp-staging myapp-prod\`
4. Your platform team has installed the admission policies (signed-image, allowed-registries) \u2014 see the **Cluster prerequisites** strip on the home page.

## Switch to GitOps before production
Push-deploy is for prototypes. Before any real traffic, switch the
\`GitOps repo layout\` decision to **same-repo** or **separate-repo**.
`;
  }
  const cdLabel = cd === "argocd" ? "ArgoCD" : "Flux";
  return `# Deploy \u2014 ${cdLabel} (${sameRepo ? "same-repo" : "separate-repo"})

This directory holds the K8s manifests ${cdLabel} watches.

\`\`\`
deploy/
\u251C\u2500\u2500 base/                       # one source of truth \u2014 patched per env by overlays
\u2502   \u251C\u2500\u2500 kustomization.yaml
\u2502   \u251C\u2500\u2500 deployment.yaml
\u2502   \u2514\u2500\u2500 service.yaml
\u251C\u2500\u2500 overlays/
\u2502   \u251C\u2500\u2500 dev/kustomization.yaml      # replicas=1, ENV=dev
\u2502   \u251C\u2500\u2500 staging/kustomization.yaml  # replicas=3, ENV=staging
\u2502   \u2514\u2500\u2500 prod/kustomization.yaml     # replicas=10, ENV=prod
\u2514\u2500\u2500 argocd-app.yaml             # the Application that points at the right overlay
\`\`\`

## One-time bootstrap

${sameRepo ? `**Same-repo layout** \u2014 the manifests above live in this app repo, in this \`deploy/\` directory. CI builds + pushes the image; ArgoCD watches \`deploy/overlays/<env>/\` and reconciles on every commit.

\`\`\`bash
# 1. Ensure ArgoCD is installed (platform team usually owns this)
kubectl get ns argocd || kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Tell ArgoCD to watch this repo
kubectl apply -n argocd -f deploy/argocd-app.yaml

# 3. Watch the sync
argocd app get myapp-dev
\`\`\`` : `**Separate-repo layout** \u2014 these manifests belong in a config repo (e.g. \`YOUR_ORG/k8s-config\`). Your CI builds the image in the app repo, then opens a PR against the config repo to bump \`base/kustomization.yaml\`'s image digest. ArgoCD watches the config repo.

\`\`\`bash
# 1. Copy this deploy/ tree into your config repo at the path matching argocd-app.yaml's "path"

# 2. From the config repo:
kubectl apply -n argocd -f argocd-app.yaml

# 3. App-repo CI needs write access to config repo to open digest-bump PRs
\`\`\``}

## Image-digest update flow
CI's "Promote :latest" step writes the new \`sha256:DIGEST\` into
\`base/kustomization.yaml\` (\`images[0].digest\`).
${sameRepo ? "Commits to this repo." : "Opens a PR against the config repo."}
ArgoCD's PreSync hook runs \`cosign verify\` on the digest before any pod schedules \u2014 if the signature is missing or the identity doesn't match \`YOUR_ORG/YOUR_REPO/.github/workflows/*\`, sync fails closed (I-20).
`;
}
function genChartYaml(config) {
  const app = config.appName ?? "myapp";
  return `apiVersion: v2
name: ${app}
description: Application chart \u2014 emitted by pipeline-studio.
type: application
version: 0.1.0       # bump when chart structure changes
appVersion: "1.0.0"  # bump per release; CI rewrites this to the image digest
`;
}
function genChartValues(config) {
  const { app, port, healthPath, stackTag } = resolveDeployContext(config);
  return `# Default values. Override per environment with -f values-<env>.yaml or --set.
# Configured for: ${stackTag} \xB7 targetPort ${port} \xB7 readiness ${healthPath}
# Chart directory should be named '${app}' to match Chart.yaml.
image:
  repository: REGISTRY/${app}    # set by CI: --set image.repository=...
  digest: sha256:DIGEST           # set by CI: --set image.digest=...
  pullPolicy: IfNotPresent

replicaCount: 2

service:
  type: ClusterIP
  port: 80
  targetPort: ${port}

# Security context matches the admission policies your platform team enforces.
podSecurityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault

containerSecurityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]

resources:
  requests: { cpu: "100m", memory: "128Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }

env: dev   # overridden per environment

probes:
  readiness:
    path: ${healthPath}
    initialDelaySeconds: 3
    periodSeconds: 5
`;
}
var HELM_DEPLOYMENT_TEMPLATE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
    chart: {{ .Chart.Name }}-{{ .Chart.Version }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels: { app: {{ .Release.Name }} }
  template:
    metadata:
      labels: { app: {{ .Release.Name }} }
    spec:
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Release.Name }}
          image: "{{ .Values.image.repository }}@{{ .Values.image.digest }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          env:
            - name: ENV
              value: {{ .Values.env | quote }}
          readinessProbe:
            httpGet:
              path: {{ .Values.probes.readiness.path }}
              port: {{ .Values.service.targetPort }}
            initialDelaySeconds: {{ .Values.probes.readiness.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.readiness.periodSeconds }}
`;
var HELM_SERVICE_TEMPLATE = `apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  selector: { app: {{ .Release.Name }} }
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
`;
var HELM_VALUES_DEV = `# Dev overrides. helm upgrade ... -f values.yaml -f values-dev.yaml
replicaCount: 1
env: dev
resources:
  requests: { cpu: "50m",  memory: "64Mi" }
  limits:   { cpu: "250m", memory: "256Mi" }
`;
var HELM_VALUES_STAGING = `# Staging overrides. helm upgrade ... -f values.yaml -f values-staging.yaml
replicaCount: 3
env: staging
resources:
  requests: { cpu: "100m", memory: "128Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }
`;
var HELM_VALUES_PROD = `# Prod overrides. helm upgrade ... -f values.yaml -f values-prod.yaml
replicaCount: 10
env: prod
resources:
  requests: { cpu: "200m", memory: "256Mi" }
  limits:   { cpu: "1000m", memory: "1Gi" }
# Pod disruption budget \u2014 keep at least N pods during voluntary disruption
podDisruptionBudget:
  enabled: true
  minAvailable: 7
`;
function generateDeploy(config) {
  const app = config.appName ?? "myapp";
  return {
    // ArgoCD Application
    "deploy/argocd-app.yaml": genArgoCDApp(config),
    // Kustomize base
    "deploy/base/kustomization.yaml": genBaseKustomization(config),
    "deploy/base/deployment.yaml": genBaseDeployment(config),
    "deploy/base/service.yaml": genBaseService(config),
    // Kustomize overlays
    "deploy/overlays/dev/kustomization.yaml": genOverlayKustomization(config, "dev"),
    "deploy/overlays/staging/kustomization.yaml": genOverlayKustomization(config, "staging"),
    "deploy/overlays/prod/kustomization.yaml": genOverlayKustomization(config, "prod"),
    // README
    "deploy/README.md": genDeployReadme(config),
    // Helm chart
    [`deploy/charts/${app}/Chart.yaml`]: genChartYaml(config),
    [`deploy/charts/${app}/values.yaml`]: genChartValues(config),
    [`deploy/charts/${app}/templates/deployment.yaml`]: HELM_DEPLOYMENT_TEMPLATE,
    [`deploy/charts/${app}/templates/service.yaml`]: HELM_SERVICE_TEMPLATE,
    [`deploy/charts/${app}/values-dev.yaml`]: HELM_VALUES_DEV,
    [`deploy/charts/${app}/values-staging.yaml`]: HELM_VALUES_STAGING,
    [`deploy/charts/${app}/values-prod.yaml`]: HELM_VALUES_PROD
  };
}
export {
  generateBaseDeployment,
  generateBaseKustomization,
  generateCheckovConfig,
  generateDeploy,
  generateDockerIgnore,
  generateDockerfile,
  generateGitleaksConfig,
  generateHelmValues,
  generateMainWorkflow,
  generateOverlayKustomization,
  generatePRWorkflow,
  generatePreCommitConfig,
  generateSbomPolicy,
  generateTrivyIgnore
};
