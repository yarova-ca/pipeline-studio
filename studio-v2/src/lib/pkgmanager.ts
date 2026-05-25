// Package manager definitions — install commands, lock files, cache keys, Dockerfile snippets.
// Fields drive: CI cache steps, Dockerfile COPY layer ordering, install command generation.
// Verified current as of 2026-05-24.

export type PkgManagerType =
  | 'js'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'dotnet'
  | 'elixir'
  | 'swift'
  | 'haskell'
  | 'crystal';

export interface PkgManagerDef {
  label: string;
  type: PkgManagerType;
  // Command that performs a reproducible, offline-safe install
  installCmd: string;
  // Lock file name — used for cache key expressions
  lockFile: string;
  // Glob pattern for CI cache key (GitHub Actions / CircleCI format)
  cacheKey: string;
  // Dockerfile COPY line(s) for the dependency manifest + lock file
  dockerCopy: string;
  // Extra RUN line(s) needed before the install (empty string if none)
  dockerSetup: string;
}

export const PKG_MANAGERS: Record<string, PkgManagerDef> = {
  npm: {
    label: 'npm', type: 'js',
    installCmd: 'npm ci --ignore-scripts',
    lockFile: 'package-lock.json',
    cacheKey: '**/package-lock.json',
    dockerCopy: 'COPY package-lock.json ./',
    dockerSetup: '',
  },
  pnpm: {
    label: 'pnpm', type: 'js',
    installCmd: 'pnpm install --frozen-lockfile',
    lockFile: 'pnpm-lock.yaml',
    cacheKey: '**/pnpm-lock.yaml',
    dockerCopy: 'COPY pnpm-lock.yaml ./',
    dockerSetup: 'RUN corepack enable pnpm',
  },
  yarn: {
    label: 'yarn', type: 'js',
    installCmd: 'yarn install --frozen-lockfile',
    lockFile: 'yarn.lock',
    cacheKey: '**/yarn.lock',
    dockerCopy: 'COPY yarn.lock ./',
    dockerSetup: 'RUN corepack enable yarn',
  },
  bun: {
    label: 'bun', type: 'js',
    installCmd: 'bun install --frozen-lockfile',
    lockFile: 'bun.lockb',
    cacheKey: '**/bun.lockb',
    dockerCopy: 'COPY bun.lockb ./',
    dockerSetup: 'COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun',
  },
  pip: {
    label: 'pip', type: 'python',
    installCmd: 'pip install --no-cache-dir -r requirements.txt',
    lockFile: 'requirements.txt',
    cacheKey: '**/requirements.txt',
    dockerCopy: 'COPY requirements.txt ./',
    dockerSetup: '',
  },
  poetry: {
    label: 'poetry', type: 'python',
    installCmd: 'poetry install --no-dev --no-interaction',
    lockFile: 'poetry.lock',
    cacheKey: '**/poetry.lock',
    dockerCopy: 'COPY pyproject.toml poetry.lock ./',
    dockerSetup: 'RUN pip install poetry==1.8.3 && poetry config virtualenvs.create false',
  },
  uv: {
    label: 'uv', type: 'python',
    installCmd: 'uv sync --frozen --no-dev',
    lockFile: 'uv.lock',
    cacheKey: '**/uv.lock',
    dockerCopy: 'COPY pyproject.toml uv.lock ./',
    dockerSetup: 'RUN pip install uv',
  },
  maven: {
    label: 'Maven', type: 'java',
    installCmd: 'mvn dependency:resolve -q',
    lockFile: 'pom.xml',
    cacheKey: '**/pom.xml',
    dockerCopy: 'COPY pom.xml ./',
    dockerSetup: '',
  },
  gradle: {
    label: 'Gradle', type: 'java',
    installCmd: './gradlew dependencies --no-daemon',
    lockFile: 'gradle.lockfile',
    cacheKey: '**/gradle.lockfile',
    dockerCopy: 'COPY build.gradle settings.gradle ./\nCOPY gradle ./gradle',
    dockerSetup: '',
  },
  go: {
    label: 'go mod', type: 'go',
    installCmd: 'go mod download',
    lockFile: 'go.sum',
    cacheKey: '**/go.sum',
    dockerCopy: 'COPY go.mod go.sum ./',
    dockerSetup: '',
  },
  cargo: {
    label: 'cargo', type: 'rust',
    installCmd: 'cargo fetch',
    lockFile: 'Cargo.lock',
    cacheKey: '**/Cargo.lock',
    dockerCopy: 'COPY Cargo.toml Cargo.lock ./',
    dockerSetup: '',
  },
  bundler: {
    label: 'bundler', type: 'ruby',
    installCmd: 'bundle install --without development',
    lockFile: 'Gemfile.lock',
    cacheKey: '**/Gemfile.lock',
    dockerCopy: 'COPY Gemfile Gemfile.lock ./',
    dockerSetup: '',
  },
  composer: {
    label: 'composer', type: 'php',
    installCmd: 'composer install --no-dev --optimize-autoloader',
    lockFile: 'composer.lock',
    cacheKey: '**/composer.lock',
    dockerCopy: 'COPY composer.json composer.lock ./',
    dockerSetup: '',
  },
  dotnet: {
    label: 'dotnet', type: 'dotnet',
    installCmd: 'dotnet restore',
    lockFile: '*.csproj',
    cacheKey: '**/packages.lock.json',
    dockerCopy: 'COPY *.csproj ./',
    dockerSetup: '',
  },
  mix: {
    label: 'mix', type: 'elixir',
    installCmd: 'mix deps.get --only prod',
    lockFile: 'mix.lock',
    cacheKey: '**/mix.lock',
    dockerCopy: 'COPY mix.exs mix.lock ./',
    dockerSetup: '',
  },
  spm: {
    label: 'swift package manager', type: 'swift',
    installCmd: 'swift package resolve',
    lockFile: 'Package.resolved',
    cacheKey: '**/Package.resolved',
    dockerCopy: 'COPY Package.swift Package.resolved ./',
    dockerSetup: '',
  },
  cabal: {
    label: 'cabal', type: 'haskell',
    installCmd: 'cabal update && cabal install --only-dependencies',
    lockFile: 'cabal.project.freeze',
    cacheKey: '**/cabal.project.freeze',
    dockerCopy: 'COPY *.cabal cabal.project* ./',
    dockerSetup: '',
  },
  shards: {
    label: 'shards', type: 'crystal',
    installCmd: 'shards install --production',
    lockFile: 'shard.lock',
    cacheKey: '**/shard.lock',
    dockerCopy: 'COPY shard.yml shard.lock ./',
    dockerSetup: '',
  },
};
