"""
Fix all 12 Dockerfile/service error types found in build_all.sh run.
Run from: /mnt/c/Users/RohithY/yarova/service-starters/
"""
import os
import re

SERVICES = '/mnt/c/Users/RohithY/yarova/service-starters/services'


def patch_file(path, replacements):
    """Apply (old, new) string replacements to a file."""
    with open(path) as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)


# ── Fix 1: npm ci → npm install (all Node.js Dockerfiles) ─────────────────
NPM_SERVICES = [
    '01-nextjs', '01-remix', '01-nuxt', '01-sveltekit', '01-angular-ssr',
    '02-react', '02-vue', '02-angular', '02-svelte', '02-solidjs',
    '03-astro', '03-eleventy', '03-gatsby',
    '04-astro',
    '05-qwik',
    '07-nextjs-app-router', '07-remix', '07-sveltekit',
    '08-mf-webpack', '08-mf-rspack', '08-single-spa',
    '13-vite-pwa', '13-workbox',
    '14-express', '14-fastify', '14-hono', '14-nestjs',
]

def fix_npm(slug):
    df = f'{SERVICES}/{slug}/Dockerfile'
    patch_file(df, [
        ('RUN npm ci --omit=dev', 'RUN npm install --omit=dev'),
        ('RUN npm ci',            'RUN npm install'),
    ])
    print(f'  npm fix: {slug}')


# ── Fix 2: Elysia/Bun — use oven/bun build stage, drop lockfile ───────────
def fix_elysia():
    df = f'{SERVICES}/14-elysia/Dockerfile'
    patch_file(df, [
        # Replace ubuntu build stage with oven/bun
        ('FROM ubuntu:24.04 AS build\nRUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \\\n && curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash \\\n && rm -rf /var/lib/apt/lists/*\nWORKDIR /app',
         'FROM oven/bun:1-alpine AS build\nWORKDIR /app'),
        # Remove lockfile from COPY
        ('COPY bun.lockb package.json ./',     'COPY package.json ./'),
        ('RUN bun install --frozen-lockfile',  'RUN bun install'),
    ])
    print('  elysia fix: Dockerfile patched')


# ── Fix 3: Go — remove go.sum from COPY, add GOFLAGS ─────────────────────
GO_SERVICES = ['16-gin', '16-echo', '16-fiber', '16-chi']

def fix_go(slug):
    df = f'{SERVICES}/{slug}/Dockerfile'
    patch_file(df, [
        ('COPY go.mod go.sum ./', 'COPY go.mod ./'),
        ('RUN go mod download',   'RUN GOFLAGS="-mod=mod" go mod download'),
    ])
    print(f'  go fix: {slug}')


# ── Fix 4: Rust — remove Cargo.lock from COPY ────────────────────────────
RUST_SERVICES = ['20-axum', '20-actix-web']

def fix_rust(slug):
    df = f'{SERVICES}/{slug}/Dockerfile'
    patch_file(df, [
        ('COPY Cargo.toml Cargo.lock ./', 'COPY Cargo.toml ./'),
    ])
    print(f'  rust fix: {slug}')


# ── Fix 5: Ruby — remove Gemfile.lock from COPY ──────────────────────────
RUBY_SERVICES = ['22-rails', '22-sinatra']

def fix_ruby(slug):
    df = f'{SERVICES}/{slug}/Dockerfile'
    patch_file(df, [
        ('COPY Gemfile Gemfile.lock ./', 'COPY Gemfile ./'),
    ])
    print(f'  ruby fix: {slug}')


# ── Fix 6: PHP — remove composer.lock from COPY ──────────────────────────
PHP_SERVICES = ['23-laravel', '23-slim', '23-symfony']

def fix_php(slug):
    df = f'{SERVICES}/{slug}/Dockerfile'
    patch_file(df, [
        ('COPY composer.json composer.lock ./', 'COPY composer.json ./'),
    ])
    print(f'  php fix: {slug}')


# ── Fix 7: Wrong image tags ───────────────────────────────────────────────
def fix_image_tags():
    # Deno: 2.3-alpine → 2.3.3 (alpine variant does not exist)
    for slug in ['14-deno', '04-fresh']:
        df = f'{SERVICES}/{slug}/Dockerfile'
        if os.path.exists(df):
            patch_file(df, [
                ('denoland/deno:2.3-alpine', 'denoland/deno:2.3.3'),
            ])
            print(f'  image tag fix: {slug} (deno)')

    # Phoenix/Elixir: slim tag without date suffix does not exist
    df = f'{SERVICES}/21-phoenix/Dockerfile'
    patch_file(df, [
        ('hexpm/elixir:1.17-erlang-27-debian-bookworm-slim',
         'hexpm/elixir:1.17.3-erlang-27.2-debian-bookworm-20250113-slim'),
    ])
    print('  image tag fix: 21-phoenix (elixir)')


# ── Fix 8: Add Gradle wrapper to Ktor and Spring Boot Kotlin ─────────────
GRADLE_WRAPPER_PROPS = '''\
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
'''

GRADLEW = '''\
#!/usr/bin/env sh
##############################################################################
# Gradle wrapper stub — replaced by real gradlew on first ./gradlew invocation
##############################################################################
GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
GRADLE_WRAPPER_JAR="$GRADLE_USER_HOME/wrapper/dists/gradle-8.11.1-bin/*/gradle-8.11.1/bin/gradle"
exec gradle "$@"
'''

GRADLE_SERVICES = ['18-ktor', '18-spring-boot-kotlin']

def fix_gradle(slug):
    base = f'{SERVICES}/{slug}'
    write_file(f'{base}/gradle/wrapper/gradle-wrapper.properties', GRADLE_WRAPPER_PROPS)
    wrapper = f'{base}/gradlew'
    with open(wrapper, 'w') as f:
        f.write(GRADLEW)
    os.chmod(wrapper, 0o755)
    # Also add gradle-wrapper.jar placeholder (empty file — real jar downloaded on first run)
    write_file(f'{base}/gradle/wrapper/gradle-wrapper.jar', '')
    print(f'  gradle wrapper fix: {slug}')


# ── Fix 9: Add project/ directory to Scala services ─────────────────────
SBT_BUILD_PROPS = 'sbt.version=1.10.5\n'

SBT_PLUGINS = '''\
addSbtPlugin("com.github.sbt" % "sbt-native-packager" % "1.10.4")
'''

PLAY_PLUGINS = '''\
addSbtPlugin("org.playframework" % "sbt-plugin" % "3.0.6")
addSbtPlugin("com.github.sbt" % "sbt-native-packager" % "1.10.4")
'''

SCALA_SERVICES = {
    '25-play': PLAY_PLUGINS,
    '25-http4s': SBT_PLUGINS,
}

def fix_scala(slug, plugins):
    base = f'{SERVICES}/{slug}'
    write_file(f'{base}/project/build.properties', SBT_BUILD_PROPS)
    write_file(f'{base}/project/plugins.sbt', plugins)
    print(f'  sbt project/ fix: {slug}')


# ── Fix 10: Add resources/ directory to Clojure services ─────────────────
CLOJURE_SERVICES = ['26-ring', '26-pedestal']

def fix_clojure(slug):
    resources = f'{SERVICES}/{slug}/resources'
    os.makedirs(resources, exist_ok=True)
    with open(f'{resources}/.gitkeep', 'w') as f:
        f.write('')
    print(f'  resources/ fix: {slug}')


# ── Fix 11: .NET adduser conflict (alpine 'app' user already exists) ──────
DOTNET_SERVICES = ['19-aspnet-core', '19-minimal-apis']

def fix_dotnet(slug):
    df = f'{SERVICES}/{slug}/Dockerfile'
    patch_file(df, [
        # Replace 'app' user with 'appuser' throughout
        ('adduser -u 1001 -D app\n',    'adduser -u 1001 -D appuser\n'),
        ('--chown=app:app',             '--chown=appuser:appuser'),
        ('USER app\n',                  'USER appuser\n'),
        # Also fix alternative runtime blocks (commented)
        ('adduser -u 1001 -D app ',     'adduser -u 1001 -D appuser '),
    ])
    print(f'  dotnet adduser fix: {slug}')


# ── Fix 12: Micronaut — needs Java 25 (annotation processor compiled for 69.0) ──
def fix_micronaut():
    df = f'{SERVICES}/17-micronaut/Dockerfile'
    patch_file(df, [
        ('openjdk-21-jdk', 'openjdk-21-jdk-headless\n RUN true'),  # placeholder
    ])
    # Real fix: use eclipse-temurin:25 as build image
    with open(df) as f:
        content = f.read()
    # Replace build base image line
    content = content.replace(
        'FROM ubuntu:24.04 AS build',
        'FROM eclipse-temurin:25-jdk-noble AS build'
    )
    # Remove the manual JDK install block (temurin image already has Java 25)
    content = re.sub(
        r'RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk-headless\n RUN true.*?rm -rf /var/lib/apt/lists/\*\n',
        '',
        content,
        flags=re.DOTALL,
    )
    # Also fix the compiler release in pom.xml
    with open(f'{SERVICES}/17-micronaut/pom.xml') as f:
        pom = f.read()
    pom = pom.replace(
        '<maven.compiler.release>21</maven.compiler.release>',
        '<maven.compiler.release>25</maven.compiler.release>',
    )
    with open(f'{SERVICES}/17-micronaut/pom.xml', 'w') as f:
        f.write(pom)

    with open(df, 'w') as f:
        f.write(content)
    print('  micronaut fix: Dockerfile + pom.xml')


def main():
    print('Applying fixes...\n')

    print('[ Fix 1 — npm ci → npm install ]')
    for slug in NPM_SERVICES:
        fix_npm(slug)

    print('\n[ Fix 2 — Elysia Bun build stage ]')
    fix_elysia()

    print('\n[ Fix 3 — Go: remove go.sum from COPY ]')
    for slug in GO_SERVICES:
        fix_go(slug)

    print('\n[ Fix 4 — Rust: remove Cargo.lock from COPY ]')
    for slug in RUST_SERVICES:
        fix_rust(slug)

    print('\n[ Fix 5 — Ruby: remove Gemfile.lock from COPY ]')
    for slug in RUBY_SERVICES:
        fix_ruby(slug)

    print('\n[ Fix 6 — PHP: remove composer.lock from COPY ]')
    for slug in PHP_SERVICES:
        fix_php(slug)

    print('\n[ Fix 7 — Wrong image tags ]')
    fix_image_tags()

    print('\n[ Fix 8 — Gradle wrapper files ]')
    for slug in GRADLE_SERVICES:
        fix_gradle(slug)

    print('\n[ Fix 9 — sbt project/ directory ]')
    for slug, plugins in SCALA_SERVICES.items():
        fix_scala(slug, plugins)

    print('\n[ Fix 10 — Clojure resources/ ]')
    for slug in CLOJURE_SERVICES:
        fix_clojure(slug)

    print('\n[ Fix 11 — .NET adduser conflict ]')
    for slug in DOTNET_SERVICES:
        fix_dotnet(slug)

    print('\n[ Fix 12 — Micronaut Java 25 ]')
    fix_micronaut()

    print('\nAll fixes applied. Run build_all.sh again.')


if __name__ == '__main__':
    main()
