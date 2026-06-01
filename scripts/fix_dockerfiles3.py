"""
Fix batch 3 — all remaining failures from build run #3.
Run from: /mnt/c/Users/RohithY/yarova/service-starters/
"""
import os
import json
import re

SERVICES = '/mnt/c/Users/RohithY/yarova/service-starters/services'


def patch(path, replacements):
    with open(path) as f:
        content = f.read()
    for old, new in replacements:
        if old not in content:
            print(f'    WARNING: pattern not found in {path}: {old[:60]!r}')
        content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)


# ── Fix 1: NPM peer-dep failures — add --legacy-peer-deps ─────────────────
# remix 2.x requires react@^18 but packages specify react@^19 → ERESOLVE
# sveltekit 2.x + vite@^6 → peer conflict
NPM_LEGACY_SERVICES = ['01-remix', '07-remix', '01-sveltekit', '07-sveltekit', '04-astro']

def fix_npm_legacy_peer():
    for slug in NPM_LEGACY_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        # Also strip any leftover --omit=dev from build stage for remix
        patch(df, [
            ('RUN npm install --omit=dev\n', 'RUN npm install --legacy-peer-deps\n'),
            ('RUN npm install\n', 'RUN npm install --legacy-peer-deps\n'),
        ])
        print(f'  legacy-peer-deps: {slug}')


# ── Fix 2: Qwik v2 doesn't exist — downgrade to ^1.12 ─────────────────────
def fix_qwik_version():
    pkg = f'{SERVICES}/05-qwik/package.json'
    with open(pkg) as f:
        data = json.load(f)
    for pkg_name in ['@builder.io/qwik', '@builder.io/qwik-city']:
        if pkg_name in data.get('dependencies', {}):
            data['dependencies'][pkg_name] = '^1.12.0'
        if pkg_name in data.get('devDependencies', {}):
            data['devDependencies'][pkg_name] = '^1.12.0'
    with open(pkg, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print('  qwik: downgraded ^2.0.0 → ^1.12.0')


# ── Fix 3: Remix/SvelteKit runtime COPY uses /app/dist — should be /app/build
REMIX_SVELTEKIT_DIST_SERVICES = ['01-remix', '07-remix', '01-sveltekit', '07-sveltekit']

def fix_remix_sveltekit_copy():
    for slug in REMIX_SVELTEKIT_DIST_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ('/app/dist ./dist', '/app/build ./build'),
        ])
        print(f'  dist→build COPY: {slug}')


# ── Fix 4: Next.js — no public/ dir — create public/.gitkeep ──────────────
NEXTJS_SERVICES = ['01-nextjs', '07-nextjs-app-router']

def fix_nextjs_public():
    for slug in NEXTJS_SERVICES:
        keep = f'{SERVICES}/{slug}/public/.gitkeep'
        os.makedirs(os.path.dirname(keep), exist_ok=True)
        with open(keep, 'w') as f:
            f.write('')
        print(f'  public/.gitkeep created: {slug}')


# ── Fix 5: Nuxt — runtime COPY /app/dist → /app/.output ───────────────────
def fix_nuxt_copy():
    df = f'{SERVICES}/01-nuxt/Dockerfile'
    patch(df, [
        (
            'COPY --from=build --chown=app:app /app/dist ./dist\n'
            'COPY --from=build --chown=app:app /app/node_modules ./node_modules\n'
            'COPY --from=build --chown=app:app /app/package.json ./',
            'COPY --from=build --chown=app:app /app/.output ./.output'
        ),
        # Fix commented alternatives too
        ('#COPY --from=build --chown=app:app /app/dist ./dist\n'
         '#COPY --from=build --chown=app:app /app/node_modules ./node_modules\n'
         '#COPY --from=build --chown=app:app /app/package.json ./',
         '#COPY --from=build --chown=app:app /app/.output ./.output'),
    ])
    # Fix FIPS stage too
    patch(df, [
        (
            'COPY --from=build --chown=app:app /app/dist ./dist\n'
            'COPY --from=build --chown=app:app /app/node_modules ./node_modules\n'
            'COPY --from=build --chown=app:app /app/package.json ./',
            'COPY --from=build --chown=app:app /app/.output ./.output'
        ),
    ])
    print('  nuxt: COPY dist → .output')


# ── Fix 6: Angular CSR — add missing tsconfig.json ────────────────────────
ANGULAR_TSCONFIG_BASE = """{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"]
  }
}
"""

def fix_angular_csr_tsconfig():
    write(f'{SERVICES}/02-angular/tsconfig.json', ANGULAR_TSCONFIG_BASE)
    print('  02-angular: tsconfig.json added')


# ── Fix 7: Angular SSR — add workspace config + missing entry files ────────
ANGULAR_SSR_JSON = """{
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
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "server": "src/server.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [],
            "styles": [],
            "scripts": []
          },
          "configurations": {
            "production": {
              "optimization": true,
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false
            }
          },
          "defaultConfiguration": "production"
        }
      }
    }
  }
}
"""

ANGULAR_SSR_TSCONFIG_APP = """{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": ["node"]
  },
  "files": ["src/main.ts", "src/server.ts"],
  "include": ["src/**/*.d.ts"]
}
"""

ANGULAR_SSR_INDEX_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>App</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
"""

ANGULAR_SSR_MAIN_TS = """import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch(console.error);
"""

def fix_angular_ssr():
    base = f'{SERVICES}/01-angular-ssr'
    write(f'{base}/angular.json', ANGULAR_SSR_JSON)
    write(f'{base}/tsconfig.json', ANGULAR_TSCONFIG_BASE)
    write(f'{base}/tsconfig.app.json', ANGULAR_SSR_TSCONFIG_APP)
    write(f'{base}/src/index.html', ANGULAR_SSR_INDEX_HTML)
    write(f'{base}/src/main.ts', ANGULAR_SSR_MAIN_TS)
    print('  01-angular-ssr: angular.json + tsconfig.json + tsconfig.app.json + index.html + main.ts added')


# ── Fix 8: Module Federation — fix import path change in v0.8 ─────────────
MF_SERVICES = ['08-mf-webpack', '08-mf-rspack']

def fix_module_federation():
    for slug in MF_SERVICES:
        cfg = f'{SERVICES}/{slug}/webpack.config.cjs'
        patch(cfg, [
            ("const { ModuleFederationPlugin } = require('@module-federation/enhanced')",
             "const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack')"),
        ])
        print(f'  @module-federation/enhanced import path fix: {slug}')


# ── Fix 9: NestJS — add jest types to tsconfig ────────────────────────────
def fix_nestjs_types():
    tsconfig = f'{SERVICES}/14-nestjs/tsconfig.json'
    with open(tsconfig) as f:
        data = json.load(f)
    data['compilerOptions']['types'] = ['jest', 'node']
    with open(tsconfig, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    print('  14-nestjs: types jest+node added to tsconfig.json')


# ── Fix 10: Quarkus — add build plugins to pom.xml ────────────────────────
QUARKUS_BUILD_SECTION = """  <build>
    <plugins>
      <plugin>
        <groupId>io.quarkus.platform</groupId>
        <artifactId>quarkus-maven-plugin</artifactId>
        <version>${quarkus.platform.version}</version>
        <extensions>true</extensions>
        <executions>
          <execution>
            <goals>
              <goal>build</goal>
              <goal>generate-code</goal>
              <goal>generate-code-tests</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.13.0</version>
        <configuration>
          <release>${maven.compiler.release}</release>
          <parameters>true</parameters>
        </configuration>
      </plugin>
    </plugins>
  </build>
"""

def fix_quarkus_pom():
    pom = f'{SERVICES}/17-quarkus/pom.xml'
    with open(pom) as f:
        content = f.read()
    if '<build>' not in content:
        content = content.replace('</project>', QUARKUS_BUILD_SECTION + '</project>')
        with open(pom, 'w') as f:
            f.write(content)
    print('  17-quarkus: <build> section with maven-compiler-plugin:3.13.0 added')


# ── Fix 11: Ktor — fix plugin version 3.5.0 → 3.0.3, task → buildFatJar ──
def fix_ktor():
    gradle = f'{SERVICES}/18-ktor/build.gradle.kts'
    patch(gradle, [
        ('id("io.ktor.plugin") version "3.5.0"',
         'id("io.ktor.plugin") version "3.0.3"'),
        ('kotlin("jvm") version "2.1.0"',
         'kotlin("jvm") version "1.9.25"'),
    ])
    df = f'{SERVICES}/18-ktor/Dockerfile'
    patch(df, [
        ('RUN gradle shadowJar -q --no-daemon',
         'RUN gradle buildFatJar -q --no-daemon'),
        ('RUN gradle dependencies -q --no-daemon\nCOPY src ./src\nRUN gradle shadowJar -q --no-daemon',
         'RUN gradle dependencies -q --no-daemon\nCOPY src ./src\nRUN gradle buildFatJar -q --no-daemon'),
    ])
    print('  18-ktor: plugin 3.5.0→3.0.3, task shadowJar→buildFatJar')


# ── Fix 12: Spring Boot Kotlin — create settings.gradle.kts, fix gradlew ──
SPRING_SETTINGS = 'rootProject.name = "18-spring-boot-kotlin"\n'

SPRING_BOOT_BUILD_KTS_EXTRA = '''
tasks.named<org.springframework.boot.gradle.tasks.bundling.BootJar>("bootJar") {
    archiveFileName.set("app.jar")
}
'''

def fix_spring_boot_kotlin():
    base = f'{SERVICES}/18-spring-boot-kotlin'
    # Create missing settings.gradle.kts
    settings = f'{base}/settings.gradle.kts'
    if not os.path.exists(settings):
        with open(settings, 'w') as f:
            f.write(SPRING_SETTINGS)

    # Add archiveFileName to build.gradle.kts if missing
    gradle = f'{base}/build.gradle.kts'
    with open(gradle) as f:
        content = f.read()
    if 'archiveFileName' not in content:
        content += SPRING_BOOT_BUILD_KTS_EXTRA
        with open(gradle, 'w') as f:
            f.write(content)

    # Fix Dockerfile: ./gradlew → gradle --no-daemon, shadowJar → bootJar, COPY jar
    df = f'{base}/Dockerfile'
    patch(df, [
        ('RUN ./gradlew dependencies -q\nCOPY src ./src\nRUN ./gradlew shadowJar -q',
         'RUN gradle dependencies -q --no-daemon\nCOPY src ./src\nRUN gradle bootJar -q --no-daemon'),
        ('RUN ./gradlew dependencies -q\nCOPY src ./src\nRUN ./gradlew bootJar -q',
         'RUN gradle dependencies -q --no-daemon\nCOPY src ./src\nRUN gradle bootJar -q --no-daemon'),
        ('/app/build/libs/*-all.jar app.jar',
         '/app/build/libs/app.jar app.jar'),
    ])
    print('  18-spring-boot-kotlin: settings.gradle.kts + bootJar config + Dockerfile fixed')


# ── Fix 13: .NET — csproj is in App/ subdir, not root ─────────────────────
DOTNET_SERVICES = ['19-aspnet-core', '19-minimal-apis']

def fix_dotnet_subdir():
    for slug in DOTNET_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ('COPY *.csproj ./\n'
             'RUN dotnet restore\n'
             'COPY . .\n'
             'RUN dotnet publish -c Release -o /app/out --self-contained false',
             'COPY App/*.csproj App/\n'
             'RUN dotnet restore App/\n'
             'COPY . .\n'
             'RUN dotnet publish App/ -c Release -o /app/out --self-contained false'),
        ])
        print(f'  {slug}: COPY *.csproj → App/*.csproj App/')


# ── Fix 14: Phoenix — use hexpm/elixir image for build stage (has elixir 1.17)
def fix_phoenix_build():
    df = f'{SERVICES}/21-phoenix/Dockerfile'
    patch(df, [
        ('FROM ubuntu:24.04 AS build\n'
         'RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \\\n'
         ' && rm -rf /var/lib/apt/lists/*',
         'FROM hexpm/elixir:1.17.3-erlang-27.2-debian-bookworm-20250113-slim AS build\n'
         'RUN apt-get update && apt-get install -y --no-install-recommends build-essential \\\n'
         ' && rm -rf /var/lib/apt/lists/*'),
    ])
    print('  21-phoenix: build stage switched to hexpm/elixir:1.17.3')


# ── Fix 15: Ruby — bundler --path flag removed in v2 ─────────────────────
RUBY_SERVICES = ['22-rails', '22-sinatra']

def fix_ruby_bundle():
    for slug in RUBY_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ("RUN bundle config set without 'development test' \\\n"
             " && bundle install --path vendor/bundle",
             "RUN bundle config set --local path 'vendor/bundle' \\\n"
             " && bundle config set --local without 'development test' \\\n"
             " && bundle install"),
        ])
        print(f'  {slug}: bundler --path flag replaced with bundle config')


# ── Fix 16: PHP — curl missing from apt-get install ───────────────────────
PHP_SERVICES = ['23-laravel', '23-slim', '23-symfony']

def fix_php_curl():
    for slug in PHP_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ('apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml',
             'apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml curl'),
        ])
        print(f'  {slug}: curl added to apt-get install')


# ── Fix 17: Swift — Package.resolved doesn't exist — remove from COPY ─────
SWIFT_SERVICES = ['24-hummingbird', '24-vapor']

def fix_swift_package():
    for slug in SWIFT_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ('COPY Package.swift Package.resolved ./', 'COPY Package.swift ./'),
        ])
        print(f'  {slug}: Package.resolved removed from COPY')


# ── Fix 18: Scala http4s — fix version 0.23 → 0.23.28, add sbt-assembly ──
def fix_http4s():
    # Fix build.sbt versions
    sbt = f'{SERVICES}/25-http4s/build.sbt'
    patch(sbt, [
        ('"org.http4s" %% "http4s-ember-server" % "0.23"',
         '"org.http4s" %% "http4s-ember-server" % "0.23.28"'),
        ('"org.http4s" %% "http4s-dsl"          % "0.23"',
         '"org.http4s" %% "http4s-dsl"          % "0.23.28"'),
        ('"org.http4s" %% "http4s-circe"        % "0.23"',
         '"org.http4s" %% "http4s-circe"        % "0.23.28"'),
    ])
    # Add sbt-assembly plugin
    plugins = f'{SERVICES}/25-http4s/project/plugins.sbt'
    with open(plugins) as f:
        content = f.read()
    if 'sbt-assembly' not in content:
        content += '\naddSbtPlugin("com.eed3si9n" % "sbt-assembly" % "2.2.0")\n'
        with open(plugins, 'w') as f:
            f.write(content)
    # Add assembly merge strategy to build.sbt
    with open(sbt) as f:
        content = f.read()
    if 'assemblyMergeStrategy' not in content:
        content += """
assembly / assemblyMergeStrategy := {
  case PathList("META-INF", _*) => MergeStrategy.discard
  case PathList("reference.conf") => MergeStrategy.concat
  case _ => MergeStrategy.first
}
assembly / assemblyJarName := "app.jar"
"""
        with open(sbt, 'w') as f:
            f.write(content)
    print('  25-http4s: version 0.23→0.23.28 + sbt-assembly plugin + mergeStrategy')


# ── Fix 19: Scala Play — assembly not available; use stage + jre runtime ───
def fix_play():
    df = f'{SERVICES}/25-play/Dockerfile'
    patch(df, [
        # Change build command
        ('RUN sbt assembly\n'
         '# REPLACE: if using Play Framework use \'sbt dist\' and unzip the zip file',
         'RUN sbt stage'),
        # Change default runtime from distroless to temurin (shell needed for bin script)
        ('FROM gcr.io/distroless/java21-debian12 AS runtime\n'
         'WORKDIR /app\n'
         'COPY --from=build /app/target/scala-*/*-assembly-*.jar app.jar\n'
         'USER 65534:65534\n'
         'EXPOSE 9000\n'
         'ENTRYPOINT ["java", "-jar", "/app/app.jar"]',
         'FROM eclipse-temurin:21-jre-alpine AS runtime\n'
         'WORKDIR /app\n'
         'RUN adduser -D -u 1001 app\n'
         'COPY --from=build /app/target/universal/stage/ ./\n'
         'RUN chmod +x bin/25-play\n'
         'USER app\n'
         'EXPOSE 9000\n'
         'ENV JAVA_OPTS="-Dhttp.port=9000 -Dplay.http.secret.key=changeme"\n'
         'CMD ["bin/25-play"]'),
    ])
    # Add sbt-assembly to play plugins (keep it for alternatives) — actually not needed since we use stage
    # Fix the FIPS stage too
    patch(df, [
        ('COPY --from=build /app/target/scala-*/*-assembly-*.jar /deployments/app.jar',
         'COPY --from=build /app/target/universal/stage/ /deployments/\n'
         'RUN chmod +x /deployments/bin/25-play'),
    ])
    print('  25-play: sbt assembly → sbt stage + eclipse-temurin:21-jre-alpine runtime')


# ── Fix 20: Clojure — fix dependency versions (1.12 → 1.12.2, 0.7 → 0.7.0)
def fix_clojure_versions():
    ring_clj = f'{SERVICES}/26-ring/project.clj'
    patch(ring_clj, [
        ('[ring/ring-core "1.12"]', '[ring/ring-core "1.12.2"]'),
        ('[ring/ring-jetty-adapter "1.12"]', '[ring/ring-jetty-adapter "1.12.2"]'),
    ])
    print('  26-ring: ring version 1.12 → 1.12.2')

    ped_clj = f'{SERVICES}/26-pedestal/project.clj'
    patch(ped_clj, [
        ('[io.pedestal/pedestal.service "0.7"]', '[io.pedestal/pedestal.service "0.7.0"]'),
        ('[io.pedestal/pedestal.jetty "0.7"]', '[io.pedestal/pedestal.jetty "0.7.0"]'),
    ])
    print('  26-pedestal: pedestal version 0.7 → 0.7.0')


# ── Fix 21: C++ services — no src/ or include/ dir; source is main.cc ──────
CPP_SERVICES = ['27-crow', '27-drogon']

def fix_cpp_copy():
    for slug in CPP_SERVICES:
        df = f'{SERVICES}/{slug}/Dockerfile'
        patch(df, [
            ('COPY CMakeLists.txt ./\n'
             'COPY src ./src\n'
             'COPY include ./include',
             'COPY CMakeLists.txt main.cc ./'),
        ])
        print(f'  {slug}: COPY src+include → COPY main.cc')


def main():
    print('Applying fix batch 3...\n')

    print('[ Fix 1 — NPM: add --legacy-peer-deps ]')
    fix_npm_legacy_peer()

    print('\n[ Fix 2 — Qwik: downgrade ^2.0.0 → ^1.12.0 ]')
    fix_qwik_version()

    print('\n[ Fix 3 — Remix/SvelteKit: runtime COPY dist → build ]')
    fix_remix_sveltekit_copy()

    print('\n[ Fix 4 — Next.js: create public/.gitkeep ]')
    fix_nextjs_public()

    print('\n[ Fix 5 — Nuxt: COPY .output not dist ]')
    fix_nuxt_copy()

    print('\n[ Fix 6 — Angular CSR: add tsconfig.json ]')
    fix_angular_csr_tsconfig()

    print('\n[ Fix 7 — Angular SSR: workspace config + entry files ]')
    fix_angular_ssr()

    print('\n[ Fix 8 — Module Federation: fix import path ]')
    fix_module_federation()

    print('\n[ Fix 9 — NestJS: add jest types to tsconfig ]')
    fix_nestjs_types()

    print('\n[ Fix 10 — Quarkus: add build plugins to pom.xml ]')
    fix_quarkus_pom()

    print('\n[ Fix 11 — Ktor: plugin version + buildFatJar task ]')
    fix_ktor()

    print('\n[ Fix 12 — Spring Boot Kotlin: settings.gradle.kts + bootJar ]')
    fix_spring_boot_kotlin()

    print('\n[ Fix 13 — .NET: csproj in App/ subdir ]')
    fix_dotnet_subdir()

    print('\n[ Fix 14 — Phoenix: build stage → hexpm/elixir:1.17.3 ]')
    fix_phoenix_build()

    print('\n[ Fix 15 — Ruby: bundler --path removed ]')
    fix_ruby_bundle()

    print('\n[ Fix 16 — PHP: add curl to apt-get ]')
    fix_php_curl()

    print('\n[ Fix 17 — Swift: remove Package.resolved from COPY ]')
    fix_swift_package()

    print('\n[ Fix 18 — http4s: version 0.23.28 + sbt-assembly ]')
    fix_http4s()

    print('\n[ Fix 19 — Play: sbt stage + JRE runtime ]')
    fix_play()

    print('\n[ Fix 20 — Clojure: fix dependency versions ]')
    fix_clojure_versions()

    print('\n[ Fix 21 — C++: COPY main.cc not src/+include/ ]')
    fix_cpp_copy()

    print('\nAll batch-3 fixes applied.')


if __name__ == '__main__':
    main()
