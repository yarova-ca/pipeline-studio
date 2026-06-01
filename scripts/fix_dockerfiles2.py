"""
Fix batch 2 — all remaining build failures from build run #2.
Run from: /mnt/c/Users/RohithY/yarova/service-starters/
"""
import os
import re
import json

SERVICES = '/mnt/c/Users/RohithY/yarova/service-starters/services'


def patch(path, replacements):
    with open(path) as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)


def patch_re(path, pattern, replacement, flags=0):
    with open(path) as f:
        content = f.read()
    content = re.sub(pattern, replacement, content, flags=flags)
    with open(path, 'w') as f:
        f.write(content)


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)


# ── Fix A: npm install --omit=dev → npm install in BUILD stage ────────────
# These services need devDeps at build time (tsc, framework CLIs, etc.)
OMIT_DEV_SERVICES = [
    '14-express', '14-fastify', '14-hono', '14-nestjs',
    '01-nuxt', '01-sveltekit', '01-angular-ssr',
    '04-astro', '05-qwik',
    '07-nextjs-app-router', '07-remix', '07-sveltekit',
]

def fix_omit_dev():
    for slug in OMIT_DEV_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [('RUN npm install --omit=dev', 'RUN npm install')])
        print(f'  --omit=dev fix: {slug}')


# ── Fix B: .NET — replace wget build stage with mcr dotnet/sdk:9.0 ───────
DOTNET_SERVICES = ['19-minimal-apis', '19-aspnet-core']

DOTNET_WGET_BLOCK = (
    r'FROM ubuntu:24\.04 AS build\s*\n'
    r'RUN apt-get update && apt-get install.*?packages-microsoft-prod\.deb\s*\n'
)

def fix_dotnet_build():
    for slug in DOTNET_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch_re(
            df,
            r'FROM ubuntu:24\.04 AS build\nRUN apt-get update && apt-get install.*?rm -rf /var/lib/apt/lists/\* packages-microsoft-prod\.deb\n',
            'FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build\n',
            flags=re.DOTALL,
        )
        print(f'  dotnet sdk fix: {slug}')


# ── Fix C: Ruby — install bundler in build container ──────────────────────
RUBY_SERVICES = ['22-rails', '22-sinatra']

def fix_ruby_bundler():
    for slug in RUBY_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            # Add gem install bundler after ruby install
            ('apt-get install -y --no-install-recommends ruby ruby-dev build-essential \\\n && rm -rf /var/lib/apt/lists/*',
             'apt-get install -y --no-install-recommends ruby ruby-dev build-essential \\\n && rm -rf /var/lib/apt/lists/* \\\n && gem install bundler --no-document'),
        ])
        print(f'  bundler fix: {slug}')


# ── Fix D: Go — add go mod tidy before go build ───────────────────────────
GO_SERVICES = ['16-gin', '16-echo', '16-fiber', '16-chi']

def fix_go_tidy():
    for slug in GO_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ('COPY . .\nRUN go build',
             'COPY . .\nRUN go mod tidy\nRUN go build'),
        ])
        print(f'  go mod tidy fix: {slug}')


# ── Fix E: Ktor + Spring Boot Kotlin — use gradle base image ─────────────
GRADLE_SERVICES_TASKS = {
    '18-ktor': 'shadowJar',
    '18-spring-boot-kotlin': 'bootJar',
}

def fix_gradle_image():
    for slug, task in GRADLE_SERVICES_TASKS.items():
        df = f'{SERVICES}/{slug}/Dockerfile'
        # Replace build stage: ubuntu + manual JDK + gradlew → gradle:8.11.1-jdk21
        patch_re(
            df,
            r'FROM ubuntu:24\.04 AS build\nRUN apt-get update && apt-get install.*?rm -rf /var/lib/apt/lists/\*\n',
            'FROM gradle:8.11.1-jdk21-alpine AS build\n',
            flags=re.DOTALL,
        )
        # Replace ./gradlew with gradle --no-daemon
        patch(df, [
            (f'RUN ./gradlew dependencies -q\nCOPY src ./src\nRUN ./gradlew {task} -q',
             f'RUN gradle dependencies -q --no-daemon\nCOPY src ./src\nRUN gradle {task} -q --no-daemon'),
            # Also handle gradlew copy line — remove it
            ('COPY build.gradle.kts settings.gradle.kts gradlew ./',
             'COPY build.gradle.kts settings.gradle.kts ./'),
            ('COPY gradle ./gradle\n', ''),
        ])
        print(f'  gradle base image fix: {slug}')


# ── Fix F: Rust — fix Cargo.toml package name (digits not allowed) ────────
RUST_SERVICES = {'20-axum': 'app', '20-actix-web': 'app'}

def fix_rust_name():
    for slug, new_name in RUST_SERVICES.items():
        cargo = f'{SERVICES}/{slug}/Cargo.toml'
        with open(cargo) as f:
            content = f.read()
        # Replace name = "20-axum" or "20-actix-web" with "app"
        content = re.sub(r'^name = "[^"]*"', f'name = "{new_name}"', content, count=1, flags=re.MULTILINE)
        with open(cargo, 'w') as f:
            f.write(content)
        # Also revert the Dockerfile COPY patch (binary name is now "app" again)
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            (f'release/{slug} /app',           'release/app /app'),
            (f'release/{slug} /usr/local/bin/app', 'release/app /usr/local/bin/app'),
        ])
        print(f'  rust name fix: {slug}')


# ── Fix G: Deno — move COPY . . before deno cache ────────────────────────
DENO_SERVICES = ['14-deno', '04-fresh']

def fix_deno_copy_order():
    for slug in DENO_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            # Remove the pre-cache step entirely (src not copied yet)
            ('COPY deno.json deno.lock* ./\nRUN deno cache src/main.ts\nCOPY . .',
             'COPY . .'),
        ])
        print(f'  deno copy order fix: {slug}')


# ── Fix H: Next.js — fix runtime COPY paths ──────────────────────────────
# Next.js standalone builds to .next/standalone/ not dist/
NEXTJS_SERVICES = ['01-nextjs', '07-nextjs-app-router']

NEXTJS_RUNTIME_COPY_OLD = (
    'COPY --from=build --chown=app:app /app/dist ./dist\n'
    'COPY --from=build --chown=app:app /app/node_modules ./node_modules\n'
    'COPY --from=build --chown=app:app /app/package.json ./'
)

NEXTJS_RUNTIME_COPY_NEW = (
    'COPY --from=build --chown=app:app /app/.next/standalone ./\n'
    'COPY --from=build --chown=app:app /app/.next/static ./.next/static\n'
    'COPY --from=build --chown=app:app /app/public ./public'
)

def fix_nextjs_paths():
    for slug in NEXTJS_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [(NEXTJS_RUNTIME_COPY_OLD, NEXTJS_RUNTIME_COPY_NEW)])
        print(f'  nextjs standalone path fix: {slug}')


# ── Fix I: Remix — update package version (v7 doesn't exist on npm) ──────
REMIX_SERVICES = ['01-remix', '07-remix']

def fix_remix_version():
    for slug in REMIX_SERVICES:
        pkg = f'{SERVICES}/{slug}/package.json'
        with open(pkg) as f:
            content = f.read()
        # Remix v7 doesn't exist — downgrade to v2.16
        content = content.replace('"^7.0.0"', '"^2.16.0"')
        with open(pkg, 'w') as f:
            f.write(content)
        # Also fix the build script: remix vite:build → vite build for v2
        # Actually remix vite:build IS the v2 command — keep it
        print(f'  remix version fix: {slug}')


# ── Fix J: Workbox — add missing vite-plugin-pwa dependency ──────────────
def fix_workbox():
    pkg = f'{SERVICES}/13-workbox/package.json'
    with open(pkg) as f:
        data = json.load(f)
    data.setdefault('devDependencies', {})
    data['devDependencies']['vite-plugin-pwa'] = '^0.21.0'
    with open(pkg, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print('  workbox vite-plugin-pwa fix')


# ── Fix K: Phoenix — fix mix.lock COPY pattern and priv/ COPY ────────────
def fix_phoenix():
    df = f'{SERVICES}/21-phoenix/Dockerfile'
    patch(df, [
        # Allow missing mix.lock
        ('COPY mix.exs mix.lock ./', 'COPY mix.exs mix.lock* ./'),
        # Remove priv/ COPY (not in our service)
        ('COPY priv ./priv\n', ''),
        # Fix release name: myapp → app
        ('_build/prod/rel/myapp', '_build/prod/rel/app'),
    ])
    # Create empty priv/ so mix doesn't complain
    os.makedirs(f'{SERVICES}/21-phoenix/priv', exist_ok=True)
    with open(f'{SERVICES}/21-phoenix/priv/.gitkeep', 'w') as f:
        f.write('')
    print('  phoenix fix: mix.lock pattern + priv/ + release name')


# ── Fix L: Scala Play — fix COPY src → COPY app + conf ───────────────────
def fix_play():
    df = f'{SERVICES}/25-play/Dockerfile'
    patch(df, [
        ('COPY src ./src\nRUN sbt assembly',
         'COPY app ./app\nCOPY conf ./conf\nRUN sbt assembly'),
    ])
    print('  scala play COPY fix: src → app + conf')


# ── Fix M: Quarkus — add explicit versions as BOM fallback ───────────────
def fix_quarkus():
    pom = f'{SERVICES}/17-quarkus/pom.xml'
    with open(pom) as f:
        content = f.read()
    # Try changing BOM version to 3.8.4 (known to exist)
    content = content.replace(
        '<quarkus.platform.version>3.35.0</quarkus.platform.version>',
        '<quarkus.platform.version>3.15.1</quarkus.platform.version>',
    )
    with open(pom, 'w') as f:
        f.write(content)
    print('  quarkus BOM version: 3.35.0 → 3.15.1')


# ── Fix N: Angular CSR — add angular.json workspace file ─────────────────
ANGULAR_JSON = """{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "app": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/app",
            "index": "src/index.html",
            "main": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": ["src/favicon.ico","src/assets"],
            "styles": [],
            "scripts": []
          },
          "configurations": {
            "production": {
              "optimization": true,
              "outputHashing": "all",
              "budgets": [
                {"type": "initial","maximumWarning": "2mb","maximumError": "5mb"},
                {"type": "anyComponentStyle","maximumWarning": "2kb","maximumError": "4kb"}
              ]
            },
            "development": { "optimization": false }
          },
          "defaultConfiguration": "production"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": { "tsConfig": "tsconfig.spec.json" }
        }
      }
    }
  }
}
"""

ANGULAR_TSCONFIG_APP = """{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
"""

def fix_angular_csr():
    base = f'{SERVICES}/02-angular'
    # Add angular.json
    write(f'{base}/angular.json', ANGULAR_JSON)
    # Add tsconfig.app.json
    write(f'{base}/tsconfig.app.json', ANGULAR_TSCONFIG_APP)
    # Add src/index.html if missing
    if not os.path.exists(f'{base}/src/index.html'):
        write(f'{base}/src/index.html', '<!doctype html>\n<html><head><title>Angular</title></head><body><app-root></app-root></body></html>\n')
    print('  angular.json + tsconfig.app.json added to 02-angular')


def main():
    print('Applying fix batch 2...\n')

    print('[ Fix A — Remove --omit=dev from build stage ]')
    fix_omit_dev()

    print('\n[ Fix B — .NET: use dotnet/sdk:9.0 image ]')
    fix_dotnet_build()

    print('\n[ Fix C — Ruby: install bundler ]')
    fix_ruby_bundler()

    print('\n[ Fix D — Go: add go mod tidy ]')
    fix_go_tidy()

    print('\n[ Fix E — Gradle: use gradle:8.11.1-jdk21 base image ]')
    fix_gradle_image()

    print('\n[ Fix F — Rust: fix Cargo.toml package name ]')
    fix_rust_name()

    print('\n[ Fix G — Deno: fix COPY order ]')
    fix_deno_copy_order()

    print('\n[ Fix H — Next.js: fix runtime COPY paths ]')
    fix_nextjs_paths()

    print('\n[ Fix I — Remix: downgrade version to ^2.16.0 ]')
    fix_remix_version()

    print('\n[ Fix J — Workbox: add vite-plugin-pwa ]')
    fix_workbox()

    print('\n[ Fix K — Phoenix: mix.lock + priv/ + release name ]')
    fix_phoenix()

    print('\n[ Fix L — Scala Play: COPY src → app + conf ]')
    fix_play()

    print('\n[ Fix M — Quarkus: BOM version 3.35.0 → 3.15.1 ]')
    fix_quarkus()

    print('\n[ Fix N — Angular CSR: add angular.json ]')
    fix_angular_csr()

    print('\nAll batch-2 fixes applied.')


if __name__ == '__main__':
    main()
