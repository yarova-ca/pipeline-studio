#!/usr/bin/env python3
"""Generate 15-version-registry.html — master version + source tracking page."""

OUT = '/mnt/c/Users/RohithY/yarova/pipeline-studio/15-version-registry.html'
VERIFIED = '2026-05-28'

# category, review_cadence_days
CATEGORIES = [
    ('base-images',    'Base Images',           'Docker tags — update when upstream releases security patch', 30),
    ('frameworks',     'Frameworks',            'App frameworks — update when major/minor release ships',    90),
    ('ci-tools',       'CI/CD Tools',           'Pipeline tools — update when new version changes behavior', 90),
    ('linux-distros',  'Linux Distros',         'OS base images — update on LTS release or security patch',  90),
    ('compliance',     'Compliance Standards',  'Regulatory versions — update when standard body issues new revision', 365),
    ('data',           'Market & Industry Data','Canadian market/industry data — re-verify annually',        365),
]

# Fields: name, version, docs (list), source_url, notes, category_slug
# docs = list of doc numbers as strings
ITEMS = [
    # ── BASE IMAGES ──────────────────────────────────────────────────────────
    ('ubuntu:24.04',                    '24.04 LTS',     ['11','13'],  'https://hub.docker.com/_/ubuntu',                                        'Builder stage — all non-FIPS frameworks',  'base-images'),
    ('node:22-alpine',                  '22-alpine',     ['11','13'],  'https://hub.docker.com/_/node',                                          'Runtime — Node.js (non-FIPS)',             'base-images'),
    ('node:22-bookworm-slim',           '22-bookworm-slim',['11','13'],'https://hub.docker.com/_/node',                                          'Runtime — Node.js (Debian slim)',          'base-images'),
    ('python:3.12-slim',                '3.12-slim',     ['11','13'],  'https://hub.docker.com/_/python',                                        'Runtime — Python (non-FIPS)',              'base-images'),
    ('golang:1.24-alpine',              '1.24-alpine',   ['11','13'],  'https://hub.docker.com/_/golang',                                        'Builder — Go',                             'base-images'),
    ('gcr.io/distroless/static-debian12','debian12',     ['11','13'],  'https://github.com/GoogleContainerTools/distroless',                     'Runtime — Go (distroless)',                'base-images'),
    ('eclipse-temurin:21-jre-alpine',   '21-jre-alpine', ['11','13'],  'https://hub.docker.com/_/eclipse-temurin',                               'Runtime — Java/Kotlin (non-FIPS)',         'base-images'),
    ('gcr.io/distroless/java21-debian12','java21-debian12',['11','13'],'https://github.com/GoogleContainerTools/distroless',                     'Runtime — Java (distroless)',              'base-images'),
    ('mcr.microsoft.com/dotnet/aspnet:8.0-alpine','8.0-alpine',['11','13'],'https://hub.docker.com/_/microsoft-dotnet-aspnet',                   'Runtime — .NET 8',                         'base-images'),
    ('nginx:alpine',                    'alpine',        ['11','13'],  'https://hub.docker.com/_/nginx',                                         'Runtime — static CSR/SSG serving',         'base-images'),
    ('ruby:3.3-alpine',                 '3.3-alpine',    ['11','13'],  'https://hub.docker.com/_/ruby',                                          'Runtime — Ruby/Rails',                     'base-images'),
    ('php:8.3-fpm-alpine',              '8.3-fpm-alpine',['11','13'],  'https://hub.docker.com/_/php',                                           'Runtime — PHP',                            'base-images'),
    ('oven/bun:1.1-alpine',             '1.1-alpine',    ['11','13'],  'https://hub.docker.com/r/oven/bun',                                      'Runtime — Bun',                            'base-images'),
    ('denoland/deno:2.3.3',             '2.3.3',         ['11','13'],  'https://hub.docker.com/r/denoland/deno',                                 'Runtime — Deno / Fresh',                   'base-images'),
    ('swift:6.1-alpine',                '6.1-alpine',    ['11','13'],  'https://hub.docker.com/_/swift',                                         'Builder — Swift',                          'base-images'),
    ('rust:1.87-alpine',                '1.87-alpine',   ['11','13'],  'https://hub.docker.com/_/rust',                                          'Builder — Rust',                           'base-images'),
    # UBI FIPS images
    ('ubi9/nodejs-22-minimal',          'ubi9',          ['11','13'],  'https://catalog.redhat.com/software/containers/search',                  'FIPS runtime — Node.js (UBI9)',            'base-images'),
    ('ubi9/python-311',                 'ubi9',          ['11','13'],  'https://catalog.redhat.com/software/containers/search',                  'FIPS runtime — Python (UBI9)',             'base-images'),
    ('ubi9/openjdk-21-runtime',         'ubi9',          ['11','13'],  'https://catalog.redhat.com/software/containers/search',                  'FIPS runtime — Java (UBI9)',               'base-images'),
    ('ubi9/php-83',                     'ubi9',          ['11','13'],  'https://catalog.redhat.com/software/containers/search',                  'FIPS runtime — PHP (UBI9)',                'base-images'),
    ('ubi9/nginx-122',                  'ubi9',          ['11','13'],  'https://catalog.redhat.com/software/containers/search',                  'FIPS runtime — Nginx/CSR (UBI9)',          'base-images'),

    # ── FRAMEWORKS ────────────────────────────────────────────────────────────
    # Frontend SSR/Hybrid
    ('Next.js',         '16.2.6',   ['01','11','13'], 'https://github.com/vercel/next.js/releases',               'SSR/Hybrid — React. Verified 2026-05-28 via npm registry.',  'frameworks'),
    ('Remix / React Router', 'React Router 7', ['01','13'], 'https://github.com/remix-run/react-router/releases', 'SSR/Hybrid — React form-first',                              'frameworks'),
    ('Nuxt',            '4.4',      ['01','13'],      'https://github.com/nuxt/nuxt/releases',                    'SSR/Hybrid — Vue',                                           'frameworks'),
    ('SvelteKit',       '2.57',     ['01','13'],      'https://github.com/sveltejs/kit/releases',                 'SSR/Hybrid — Svelte',                                        'frameworks'),
    ('Angular SSR',     '20',       ['01','13'],      'https://github.com/angular/angular/releases',              'SSR — Angular Universal',                                    'frameworks'),
    # Frontend CSR/SPA
    ('React',           '19',       ['01','13'],      'https://github.com/facebook/react/releases',               'CSR/SPA',                                                    'frameworks'),
    ('Vue',             '3.5',      ['01','13'],      'https://github.com/vuejs/core/releases',                   'CSR/SPA',                                                    'frameworks'),
    ('Angular',         '20',       ['01','13'],      'https://github.com/angular/angular/releases',              'CSR/SPA (CLI app)',                                          'frameworks'),
    ('Solid.js',        '2.0',      ['01','13'],      'https://github.com/solidjs/solid/releases',                'Streaming SSR + CSR',                                        'frameworks'),
    # Frontend SSG
    ('Astro',           '6.3',      ['01','13'],      'https://github.com/withastro/astro/releases',              'SSG + Islands',                                              'frameworks'),
    ('Gatsby',          '5.13',     ['01','13'],      'https://github.com/gatsbyjs/gatsby/releases',              'SSG — React + GraphQL',                                      'frameworks'),
    ('Hugo',            '0.161',    ['01','13'],      'https://github.com/gohugoio/hugo/releases',                'SSG — Go-based',                                             'frameworks'),
    ('Eleventy',        '3.0',      ['01','13'],      'https://github.com/11ty/eleventy/releases',                'SSG — JS-based',                                             'frameworks'),
    # Islands
    ('Qwik',            '2.0',      ['01','13'],      'https://github.com/QwikDev/qwik/releases',                 'Islands / Resumable',                                        'frameworks'),
    ('Fresh',           '2.3',      ['01','11','13'], 'https://github.com/denoland/fresh/releases',               'Islands — Deno runtime',                                     'frameworks'),
    # Edge Rendering
    ('Next.js Edge Runtime', '16.2.6', ['01','13'],  'https://github.com/vercel/next.js/releases',               'Edge — V8 Isolate',                                          'frameworks'),
    ('Hono',            '4.7',      ['01','13'],      'https://github.com/honojs/hono/releases',                  'Edge — multi-runtime',                                       'frameworks'),
    # Mobile
    ('React Native',    '0.79',     ['01','13'],      'https://github.com/facebook/react-native/releases',        'Mobile — RN cross-platform',                                 'frameworks'),
    ('Flutter',         '3.44',     ['01','13'],      'https://github.com/flutter/flutter/releases',              'Mobile — Dart cross-platform',                               'frameworks'),
    # Backend Node/Deno/Bun
    ('Express',         '5.0',      ['01','13'],      'https://github.com/expressjs/express/releases',            'Backend — Node.js',                                          'frameworks'),
    ('Fastify',         '5.2',      ['01','13'],      'https://github.com/fastify/fastify/releases',              'Backend — Node.js',                                          'frameworks'),
    ('NestJS',          '11.0',     ['01','13'],      'https://github.com/nestjs/nest/releases',                  'Backend — Node.js opinionated',                              'frameworks'),
    ('Deno (runtime)',  '2.3',      ['01','13'],      'https://github.com/denoland/deno/releases',                'Backend — Deno runtime',                                     'frameworks'),
    ('Elysia',          '1.2',      ['01','13'],      'https://github.com/elysiajs/elysia/releases',              'Backend — Bun-native',                                       'frameworks'),
    # Backend Python
    ('Django',          '5.2',      ['01','13'],      'https://github.com/django/django/releases',                'Backend — Python batteries-included',                        'frameworks'),
    ('FastAPI',         '0.115',    ['01','13'],      'https://github.com/tiangolo/fastapi/releases',             'Backend — Python async API',                                 'frameworks'),
    ('Flask',           '3.1',      ['01','13'],      'https://github.com/pallets/flask/releases',                'Backend — Python micro-framework',                           'frameworks'),
    ('Starlette',       '0.41',     ['01','13'],      'https://github.com/encode/starlette/releases',             'Backend — Python ASGI',                                      'frameworks'),
    # Backend Go
    ('Gin',             '1.10',     ['01','13'],      'https://github.com/gin-gonic/gin/releases',                'Backend — Go',                                               'frameworks'),
    ('Chi',             '5.2',      ['01','13'],      'https://github.com/go-chi/chi/releases',                   'Backend — Go lightweight',                                   'frameworks'),
    ('Echo',            '4.12',     ['01','13'],      'https://github.com/labstack/echo/releases',                'Backend — Go',                                               'frameworks'),
    # Backend Java/Kotlin
    ('Spring Boot',     '3.4',      ['01','13'],      'https://github.com/spring-projects/spring-boot/releases',  'Backend — Java/Kotlin',                                      'frameworks'),
    ('Quarkus',         '3.35',     ['01','13'],      'https://github.com/quarkusio/quarkus/releases',            'Backend — Java native/JVM',                                  'frameworks'),
    ('Ktor',            '3.5',      ['01','13'],      'https://github.com/ktorio/ktor/releases',                  'Backend — Kotlin',                                           'frameworks'),
    ('Micronaut',       '5.0',      ['01','13'],      'https://github.com/micronaut-projects/micronaut-core/releases','Backend — Java/Kotlin/Groovy',                           'frameworks'),
    # Backend .NET
    ('ASP.NET Core',    '9.0',      ['01','13'],      'https://github.com/dotnet/aspnetcore/releases',            'Backend — .NET',                                             'frameworks'),
    # Backend Rust
    ('Axum',            '0.8',      ['01','13'],      'https://github.com/tokio-rs/axum/releases',                'Backend — Rust async',                                       'frameworks'),
    ('Actix-web',       '4.9',      ['01','13'],      'https://github.com/actix/actix-web/releases',              'Backend — Rust performance',                                 'frameworks'),
    # Backend Elixir
    ('Phoenix',         '1.7',      ['01','13'],      'https://github.com/phoenixframework/phoenix/releases',     'Backend — Elixir',                                           'frameworks'),
    # Backend Ruby
    ('Rails',           '8.0',      ['01','13'],      'https://github.com/rails/rails/releases',                  'Backend — Ruby',                                             'frameworks'),
    # Backend PHP
    ('Symfony',         '7.2',      ['01','13'],      'https://github.com/symfony/symfony/releases',              'Backend — PHP',                                              'frameworks'),
    ('Slim',            '4.14',     ['01','13'],      'https://github.com/slimphp/Slim/releases',                 'Backend — PHP micro',                                        'frameworks'),
    # Backend Swift
    ('Vapor',           '4.121',    ['01','13'],      'https://github.com/vapor/vapor/releases',                  'Backend — Swift',                                            'frameworks'),
    # Backend Scala/Clojure/C++
    ('http4s',          '0.23',     ['01','13'],      'https://github.com/http4s/http4s/releases',                'Backend — Scala functional',                                 'frameworks'),
    ('Drogon',          '1.9.13',   ['01','13'],      'https://github.com/drogonframework/drogon/releases',       'Backend — C++ async',                                        'frameworks'),

    # ── CI/CD TOOLS ───────────────────────────────────────────────────────────
    # Dep management
    ('Renovate',        'v43',      ['04','13'],      'https://github.com/renovatebot/renovate/releases',         'Dependency update automation. License: MIT.',                'ci-tools'),
    ('Dependabot',      'built-in', ['04'],           'https://github.com/dependabot',                            'GitHub-native dep updates. No version pin.',                 'ci-tools'),
    # Secret scan
    ('gitleaks',        'v8.21',    ['04','13'],      'https://github.com/gitleaks/gitleaks/releases',            'Secret scan — pre-commit + CI. License: MIT.',              'ci-tools'),
    ('truffleHog',      'v3.80',    ['04','13'],      'https://github.com/trufflesecurity/trufflehog/releases',   'Entropy-based secret scan. License: AGPL-3.0.',             'ci-tools'),
    # Dockerfile lint
    ('hadolint',        'v2.12',    ['04','13'],      'https://github.com/hadolint/hadolint/releases',            'Dockerfile linter. License: MIT.',                          'ci-tools'),
    ('checkov',         'v3',       ['04','13'],      'https://github.com/bridgecrewio/checkov/releases',         'IaC security scan. License: Apache 2.0.',                   'ci-tools'),
    # SAST
    ('Semgrep',         'v1.75',    ['04','13'],      'https://github.com/semgrep/semgrep/releases',              'Multi-language SAST. License: LGPL-2.1.',                   'ci-tools'),
    ('CodeQL',          'v2.19',    ['04','13'],      'https://github.com/github/codeql/releases',                'GitHub SAST. Requires GitHub Actions.',                     'ci-tools'),
    ('SonarQube',       'v10.5',    ['04','13'],      'https://github.com/SonarSource/sonarqube/releases',        'Code quality + SAST. License: LGPL-3.0 (CE).',             'ci-tools'),
    # SCA
    ('OWASP Dependency-Check', 'v10.0', ['04','13'], 'https://github.com/jeremylong/DependencyCheck/releases',   'SCA — NVD-based. License: Apache 2.0.',                     'ci-tools'),
    ('osv-scanner',     'v1.8',     ['04','13'],      'https://github.com/google/osv-scanner/releases',           'SCA — OSV database. License: Apache 2.0.',                  'ci-tools'),
    ('Trivy',           'v0.58',    ['04','13'],      'https://github.com/aquasecurity/trivy/releases',           'Image + SCA scan. License: Apache 2.0.',                    'ci-tools'),
    ('Snyk',            'v1.1280',  ['04','13'],      'https://github.com/snyk/cli/releases',                     'SCA + container scan. License: Apache 2.0.',                'ci-tools'),
    ('FOSSA',           'v3',       ['04'],           'https://github.com/fossas/fossa-cli/releases',             'License compliance SCA. Commercial.',                       'ci-tools'),
    # Image scan
    ('grype',           'latest',   ['04','13'],      'https://github.com/anchore/grype/releases',                'Container image CVE scan. License: Apache 2.0.',            'ci-tools'),
    # SBOM
    ('syft',            'latest',   ['04','13'],      'https://github.com/anchore/syft/releases',                 'SBOM generator (SPDX + CycloneDX). License: Apache 2.0.',  'ci-tools'),
    # Sign + attest
    ('cosign',          'latest',   ['04','13'],      'https://github.com/sigstore/cosign/releases',              'Keyless image signing via Sigstore. License: Apache 2.0.', 'ci-tools'),
    ('slsa-github-generator', 'v2', ['04','13'],      'https://github.com/slsa-framework/slsa-github-generator/releases', 'SLSA L3 provenance. License: Apache 2.0.',          'ci-tools'),
    # Load test
    ('k6',              'v0.53',    ['04','13'],      'https://github.com/grafana/k6/releases',                   'Load testing. License: AGPL-3.0.',                          'ci-tools'),
    # Kyverno
    ('Kyverno',         'v1.13',    ['04','13'],      'https://github.com/kyverno/kyverno/releases',              'K8s policy engine. License: Apache 2.0.',                   'ci-tools'),
    # pre-commit framework
    ('pre-commit',      'v3.8',     ['04','13'],      'https://github.com/pre-commit/pre-commit/releases',        'Hook manager. License: MIT.',                               'ci-tools'),

    # ── LINUX DISTROS ─────────────────────────────────────────────────────────
    ('Alpine Linux',        '3.21',        ['09','10','11'], 'https://alpinelinux.org/releases/',                            'Container-optimized. musl libc. No shell by default.',   'linux-distros'),
    ('Ubuntu LTS',          '24.04',       ['09','10','11'], 'https://releases.ubuntu.com/',                                 'General purpose. glibc. LTS until 2029.',                'linux-distros'),
    ('Debian',              '12 (Bookworm)',['09','10','11'], 'https://www.debian.org/releases/',                             'General purpose. glibc. LTS.',                           'linux-distros'),
    ('RHEL / UBI9',         '9',           ['09','10','11'], 'https://access.redhat.com/articles/3078',                      'Enterprise. FIPS-capable. DISA STIG available.',         'linux-distros'),
    ('Rocky Linux',         '9',           ['09','10'],      'https://rockylinux.org/news',                                  'RHEL-compatible. FIPS-capable.',                         'linux-distros'),
    ('AlmaLinux',           '9',           ['09','10'],      'https://almalinux.org/blog/',                                  'RHEL-compatible. FIPS-capable.',                         'linux-distros'),
    ('Amazon Linux',        '2023',        ['09','10'],      'https://aws.amazon.com/amazon-linux-2023/release-notes/',      'AWS-native. RHEL-based.',                                'linux-distros'),
    ('Azure Linux',         '3',           ['09','10'],      'https://github.com/microsoft/azurelinux/releases',             'Azure-native. FIPS-capable.',                            'linux-distros'),
    ('Fedora',              '42',          ['09'],           'https://fedoraproject.org/wiki/Releases',                      'Cutting-edge. Not for production containers.',           'linux-distros'),
    ('Talos Linux',         '1.10',        ['09'],           'https://github.com/siderolabs/talos/releases',                 'K8s-native. Immutable. API-only.',                       'linux-distros'),
    ('Bottlerocket',        '1.x',         ['09','10'],      'https://github.com/bottlerocket-os/bottlerocket/releases',     'AWS EKS node OS. Immutable.',                            'linux-distros'),
    ('Flatcar Container Linux','latest',   ['09'],           'https://www.flatcar.org/releases',                             'Immutable. Self-updating. Coreos successor.',            'linux-distros'),
    ('Google COS',          'auto-patched',['09'],           'https://cloud.google.com/container-optimized-os/docs/release-notes', 'GKE node OS only — not a Dockerfile FROM.',       'linux-distros'),
    ('Wolfi / Chainguard',  'rolling',     ['09'],           'https://github.com/wolfi-dev/os/releases',                     'SLSA-aware. Zero CVE target. glibc + musl.',            'linux-distros'),
    ('Distroless (Google)', 'rolling',     ['09','11'],      'https://github.com/GoogleContainerTools/distroless',           'No shell. No package manager. Minimal attack surface.', 'linux-distros'),
    ('scratch',             'N/A',         ['09'],           'https://hub.docker.com/_/scratch',                             'Empty image. Use only for static binaries.',            'linux-distros'),

    # ── COMPLIANCE STANDARDS ──────────────────────────────────────────────────
    ('FIPS 140-2',      '140-2',    ['09','10','12'], 'https://csrc.nist.gov/publications/detail/fips/140/2/final',         'Superseded by 140-3. NIST closes new submissions Sept 2026.','compliance'),
    ('FIPS 140-3',      '140-3',    ['09','10','12'], 'https://csrc.nist.gov/publications/detail/fips/140/3/final',         'Current standard. ISO/IEC 19790 aligned.',               'compliance'),
    ('FedRAMP Moderate','Moderate', ['10','12','13'], 'https://www.fedramp.gov/documents/',                                  'US federal cloud. Requires FIPS + STIG base.',           'compliance'),
    ('FedRAMP High',    'High',     ['10','12','13'], 'https://www.fedramp.gov/documents/',                                  'US federal cloud — higher sensitivity.',                 'compliance'),
    ('CMMC 2.0',        '2.0',      ['10','12','13'], 'https://www.acq.osd.mil/cmmc/documentation.html',                    'DoD contractor cybersecurity maturity.',                 'compliance'),
    ('HIPAA',           '1996/2013 Omnibus', ['10','12','13'], 'https://www.hhs.gov/hipaa/for-professionals/index.html',     'US health data. No version number — law.',               'compliance'),
    ('PCI DSS',         '4.0',      ['10','12','13'], 'https://www.pcisecuritystandards.org/document_library/',             'Payment card security. v4.0 mandatory from March 2025.', 'compliance'),
    ('SOC 2 Type II',   'Type II',  ['10','12','13'], 'https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html', 'SaaS enterprise trust. Annual audit.','compliance'),
    ('SOX ITGC',        'Sarbanes-Oxley', ['12','13'], 'https://www.sec.gov/spotlight/sarbanes-oxley.htm',                  'US public company financial controls. No version.',      'compliance'),
    ('ISO 27001',       '2022',     ['10','12','13'], 'https://www.iso.org/standard/27001.html',                            'ISMS. 2022 revision current.',                           'compliance'),
    ('CIS Benchmarks',  'latest',   ['10','12'],      'https://www.cisecurity.org/cis-benchmarks/',                         'Center for Internet Security. Linux + Docker configs.',  'compliance'),
    ('DISA STIG',       'latest',   ['09','10','12'], 'https://public.cyber.mil/stigs/downloads/',                          'DoD hardening. Per-distro STIGs published separately.',  'compliance'),
    ('GDPR',            '2018',     ['12','13'],      'https://gdpr-info.eu/',                                              'EU data protection. Regulation — no version.',           'compliance'),
    ('PIPEDA / Bill C-27', '2024',  ['12','13','14'], 'https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/', 'Canadian privacy + proposed AIDA.','compliance'),
    ('NERC CIP',        'CIP-013-2',['12','13','14'], 'https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx',             'North American electric utility cybersecurity.',          'compliance'),
    ('SLSA',            'L3',       ['10','12','13'], 'https://slsa.dev/',                                                  'Supply chain security framework. L3 = highest CI/CD.',  'compliance'),
    ('OSFI B-10',       'Jan 2024', ['14'],           'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/technology-cyber-risk-management-guideline', 'Canadian bank outsourcing + tech risk.','compliance'),
    ('ITSG-33',         'Nov 2012', ['14'],           'https://www.cyber.gc.ca/en/guidance/it-security-risk-management-lifecycle-approach-itsg-33', 'GC IT security risk management.','compliance'),

    # ── MARKET & INDUSTRY DATA ────────────────────────────────────────────────
    ('Canada Market Data (73 industries)',   'May 2026', ['08'],     'https://ca.indeed.com / https://ca.linkedin.com/jobs', 'Tier, demand, wage, entry difficulty. Annual re-verify.','data'),
    ('Canada Industry Deep-dives (73)',      'May 2026', ['14'],     'https://ca.indeed.com / https://ca.linkedin.com/jobs', 'Systems, employers, tech stack, compliance, entry notes.','data'),
    ('Canada Industry Schema (73)',          'May 2026', ['07'],     'https://www.statcan.gc.ca',                            'NAICS codes, compliance frameworks, hub mapping.',        'data'),
    ('US Industry Schema (74)',              'May 2026', ['06'],     'https://www.bls.gov',                                  'NAICS codes, compliance frameworks.',                     'data'),
    ('Linux distro data (22)',               'May 2026', ['09','10'],'https://repology.org',                                 'Family, FIPS, STIG, CIS, base image data.',               'data'),
    ('Pipeline schema (6 phases, 44 stages)','May 2026', ['02','03'],'Derived from: OWASP DevSecOps, SLSA, NIST SSDF',      'Phase triggers, stage types, parallel groups.',           'data'),
]

# ── NAV ──────────────────────────────────────────────────────────────────────
DOCS = [
    ('01','01-framework-catalog.html','01 Frameworks'),
    ('02','02-pipeline-schema.html','02 Pipeline schema'),
    ('03','03-stage-types.html','03 Stage types'),
    ('04','04-tool-catalog.html','04 Tool catalog'),
    ('05','05-invariants.html','05 Invariants'),
    ('06','06-industry-schema.html','06 US industries'),
    ('07','07-canada-schema.html','07 CA industries'),
    ('08','08-canada-market.html','08 CA market'),
    ('09','09-linux-distros.html','09 Linux distros'),
    ('10','10-linux-compliance.html','10 Linux compliance'),
    ('11','11-dockerfile-catalog.html','11 Dockerfiles'),
    ('12','12-compliance-variations.html','12 Compliance'),
    ('13','13-pipeline-build-catalog.html','13 Pipeline catalog'),
    ('14','14-canada-industry-catalog.html','14 CA industries'),
    ('15','15-version-registry.html','15 Version registry'),
]

# ── Counts ────────────────────────────────────────────────────────────────────
total_items = len(ITEMS)
docs_covered = len(set(d for item in ITEMS for d in item[2]))
sources_linked = sum(1 for item in ITEMS if item[4] and 'http' in item[3])

# ── HTML GENERATION ───────────────────────────────────────────────────────────
def doc_badges(doc_list):
    badges = []
    for d in sorted(doc_list, key=int):
        badges.append(f'<a href="{[x[1] for x in DOCS if x[0]==d][0]}" class="doc-badge">{d}</a>')
    return ' '.join(badges)

def gen_nav():
    links = []
    for cat_slug, cat_name, _, _ in CATEGORIES:
        links.append(f'<a href="#{cat_slug}">{cat_name}</a>')
    links.append('<hr style="border:none;border-top:1px solid var(--border);margin:6px 0">')
    for num, href, label in DOCS:
        aria = ' aria-current="page"' if num == '15' else ''
        links.append(f'<a href="{href}"{aria}>{label}</a>')
    links.append('<a href="#main-content" class="nav-top">↑ Back to top</a>')
    return '\n  '.join(links)

def gen_category_section(cat_slug, cat_name, cat_desc, cadence_days, items):
    rows = [i for i in items if i[5] == cat_slug]
    if not rows:
        return ''

    html = f'''
<h2 id="{cat_slug}">{cat_name}</h2>
<p class="section-sub">{cat_desc} — review every {cadence_days} days.</p>
<div class="tbl-wrap">
<table class="xref-table">
<thead>
  <tr>
    <th>Item</th>
    <th>Version in docs</th>
    <th>Used in</th>
    <th>Source / release page</th>
    <th>Notes</th>
    <th>Last verified</th>
  </tr>
</thead>
<tbody>
'''
    for name, version, docs, source_url, notes, _ in rows:
        # shorten long source URLs for display
        display_url = source_url.split('/')[2] if 'http' in source_url else source_url
        if len(display_url) > 40:
            display_url = display_url[:38] + '…'
        html += f'<tr>'
        html += f'<td style="font-weight:600;white-space:nowrap">{name}</td>'
        html += f'<td><code class="ic">{version}</code></td>'
        html += f'<td style="white-space:nowrap">{doc_badges(docs)}</td>'
        html += f'<td style="font-size:11px"><a href="{source_url}" style="color:var(--blue)" target="_blank">{display_url}</a></td>'
        html += f'<td style="font-size:11px;color:var(--text-dim)">{notes}</td>'
        html += f'<td style="font-size:11px;color:var(--text-dim);white-space:nowrap">{VERIFIED}</td>'
        html += f'</tr>\n'
    html += '</tbody></table></div>\n'
    return html

def gen_html():
    nav = gen_nav()
    sections = ''.join(
        gen_category_section(slug, name, desc, cadence, ITEMS)
        for slug, name, desc, cadence in CATEGORIES
    )

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>15 — Version Registry | Pipeline Studio</title>
<meta name="description" content="Master version registry for all 14 pipeline-studio docs — frameworks, CI tools, base images, Linux distros, compliance standards, and market data. Single source for version maintenance.">
<style>
:root{{
  --bg:#ffffff;--bg2:#f6f8fa;--bg3:#eaeef2;
  --border:#d0d7de;--text:#1f2328;--text-dim:#656d76;--text-head:#1f2328;
  --blue:#0969da;--green:#1a7f37;--amber:#7a4f00;--purple:#6f42c1;--red:#b91c1c;
  --sidebar-w:220px;
}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;
  background:var(--bg);color:var(--text);line-height:1.5;display:flex;min-height:100vh}}
nav{{width:var(--sidebar-w);min-width:var(--sidebar-w);background:var(--bg2);
  border-right:1px solid var(--border);padding:16px 0;position:sticky;top:0;height:100vh;
  overflow-y:auto;flex-shrink:0}}
nav a{{display:block;padding:5px 16px;font-size:12px;color:var(--text-dim);text-decoration:none;
  transition:color .12s,background .12s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
nav a:hover{{color:var(--text);background:var(--bg3)}}
nav a[aria-current]{{color:var(--blue);font-weight:600;background:var(--bg3)}}
.nav-top{{color:var(--text-dim)!important;margin-top:8px;border-top:1px solid var(--border)}}
main{{flex:1;padding:24px 32px;max-width:1400px;overflow-x:auto}}
h1{{font-size:20px;font-weight:700;color:var(--text-head);margin-bottom:4px}}
.page-meta{{font-size:11px;color:var(--text-dim);margin-bottom:16px}}
h2{{font-size:15px;font-weight:700;color:var(--text-head);margin:28px 0 4px;
  padding-top:8px;border-top:2px solid var(--border)}}
.section-sub{{font-size:11px;color:var(--text-dim);margin-bottom:10px}}
.counts-bar{{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}}
.count-chip{{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--bg2);
  border:1px solid var(--border);border-radius:7px}}
.count-chip .chip-num{{font-size:22px;font-weight:700;color:var(--text-head);line-height:1}}
.count-chip .chip-label{{font-size:11px;color:var(--text-dim);line-height:1.4}}
.count-chip.c1{{border-left:3px solid var(--blue)}}.count-chip.c1 .chip-num{{color:var(--blue)}}
.count-chip.c2{{border-left:3px solid var(--green)}}.count-chip.c2 .chip-num{{color:var(--green)}}
.count-chip.c3{{border-left:3px solid var(--amber)}}.count-chip.c3 .chip-num{{color:var(--amber)}}
.count-chip.c4{{border-left:3px solid var(--purple)}}.count-chip.c4 .chip-num{{color:var(--purple)}}
.count-chip.c5{{border-left:3px solid var(--red)}}.count-chip.c5 .chip-num{{color:var(--red)}}
.tbl-wrap{{overflow-x:auto;border:1px solid var(--border);border-radius:7px;margin-bottom:8px}}
.xref-table{{width:100%;border-collapse:collapse;font-size:12px}}
.xref-table th{{background:var(--bg2);padding:7px 10px;text-align:left;font-size:11px;
  font-weight:600;color:var(--text-dim);border-bottom:1px solid var(--border);white-space:nowrap}}
.xref-table td{{padding:6px 10px;border-bottom:1px solid var(--border);vertical-align:top}}
.xref-table tr:last-child td{{border-bottom:none}}
.xref-table tr:hover td{{background:var(--bg2)}}
.doc-badge{{display:inline-block;font-size:10px;font-weight:700;padding:1px 5px;
  border-radius:3px;background:#dbeeff;color:var(--blue);border:1px solid #b6d7f5;
  text-decoration:none;margin:1px}}
.doc-badge:hover{{background:var(--blue);color:#fff}}
code.ic{{font-family:"SFMono-Regular",Consolas,monospace;font-size:11px;background:var(--bg2);
  border:1px solid var(--border);border-radius:3px;padding:1px 5px;white-space:nowrap}}
.how-block{{background:var(--bg2);border:1px solid var(--border);border-radius:7px;
  padding:14px 18px;margin-bottom:20px;font-size:12px}}
.how-block h3{{font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text-head)}}
.how-block ol{{padding-left:18px;line-height:2}}
.cadence-table{{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}}
.cadence-table th,.cadence-table td{{padding:5px 10px;border:1px solid var(--border);text-align:left}}
.cadence-table th{{background:var(--bg3);font-size:11px;font-weight:600}}
@media(prefers-color-scheme:dark){{
  :root{{
    --bg:#0d1117;--bg2:#161b22;--bg3:#21262d;
    --border:#30363d;--text:#e6edf3;--text-dim:#8b949e;--text-head:#e6edf3;
    --blue:#58a6ff;--green:#3fb950;--amber:#d29922;--purple:#bc8cff;--red:#f85149;
  }}
  .doc-badge{{background:#0d2744;border-color:#2d4a6a;color:var(--blue)}}
  .doc-badge:hover{{background:var(--blue);color:#0d1117}}
}}
@media print{{
  nav{{display:none}}
  main{{max-width:100%;padding:12px}}
  .tbl-wrap{{border:1px solid #ccc}}
}}
</style>
</head>
<body>
<nav>
  {nav}
</nav>
<main id="main-content">
<h1>Version &amp; Source Registry</h1>
<div class="page-meta">{total_items} items tracked · {docs_covered} docs covered · {sources_linked} sources linked · last full verify {VERIFIED}</div>

<div class="counts-bar">
  <div class="count-chip c1"><div class="chip-num">{sum(1 for i in ITEMS if i[5]=='frameworks')}</div><div class="chip-label">Frameworks<br>tracked</div></div>
  <div class="count-chip c2"><div class="chip-num">{sum(1 for i in ITEMS if i[5]=='ci-tools')}</div><div class="chip-label">CI/CD tools<br>tracked</div></div>
  <div class="count-chip c3"><div class="chip-num">{sum(1 for i in ITEMS if i[5]=='base-images')}</div><div class="chip-label">Base images<br>tracked</div></div>
  <div class="count-chip c4"><div class="chip-num">{sum(1 for i in ITEMS if i[5]=='linux-distros')}</div><div class="chip-label">Linux distros<br>tracked</div></div>
  <div class="count-chip c5"><div class="chip-num">{sum(1 for i in ITEMS if i[5]=='compliance')}</div><div class="chip-label">Compliance<br>standards</div></div>
</div>

<div class="how-block">
  <h3>How to use this page — version maintenance workflow</h3>
  <ol>
    <li>Find the item whose version you want to verify (use the category sections below).</li>
    <li>Click the source link → check the latest release on that page.</li>
    <li>If the version differs: find the doc(s) listed in the "Used in" column → update the version string there.</li>
    <li>Update the "Last verified" date here to today's date.</li>
    <li>For base images: also update the Dockerfile <code>FROM</code> tag in doc 11 and any framework-specific Dockerfiles.</li>
    <li>Commit with message: <code>Update [item name] version [old] → [new] (verified [date])</code></li>
  </ol>
  <table class="cadence-table" style="margin-top:12px">
    <thead><tr><th>Category</th><th>Review every</th><th>Why</th></tr></thead>
    <tbody>
      <tr><td>Base images</td><td>30 days</td><td>OS security patches ship continuously — stale tags accumulate CVEs</td></tr>
      <tr><td>Frameworks</td><td>90 days</td><td>Major/minor releases change pipeline behavior and Dockerfile patterns</td></tr>
      <tr><td>CI/CD tools</td><td>90 days</td><td>New versions add detection rules — old versions miss new vulnerability patterns</td></tr>
      <tr><td>Linux distros</td><td>90 days</td><td>LTS releases and security patches change FIPS/STIG status</td></tr>
      <tr><td>Compliance standards</td><td>365 days</td><td>Standard bodies publish revisions annually — check release notes only</td></tr>
      <tr><td>Market &amp; industry data</td><td>365 days</td><td>Wage bands and demand signals shift with hiring cycles — annual re-verify is sufficient</td></tr>
    </tbody>
  </table>
</div>

{sections}
</main>
</body>
</html>
'''

html = gen_html()
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print(f'Written {len(html):,} chars to {OUT}')
