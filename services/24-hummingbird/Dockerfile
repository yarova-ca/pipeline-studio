# ─────────────────────────────────────────────────────────────────────────
# Framework: 24 Swift Server — Hummingbird 2.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Swift 6.0.3)
# Runtime:   swift:6.0-noble-slim
# FIPS:      N/A — no dedicated FIPS variant for Swift Server
# Port:      8080
# Hummingbird: same swift build pattern as Vapor
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget clang libicu-dev libssl-dev \
 && wget -q https://download.swift.org/swift-6.0.3-release/ubuntu2404/swift-6.0.3-RELEASE/swift-6.0.3-RELEASE-ubuntu24.04.tar.gz \
 && tar -xzf swift-6.0.3-RELEASE-ubuntu24.04.tar.gz -C /usr \
 && mv /usr/swift-6.0.3-RELEASE-ubuntu24.04 /usr/swift \
 && rm swift-6.0.3-RELEASE-ubuntu24.04.tar.gz \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/swift/usr/bin:$PATH" 

FROM swift:6.0-bookworm AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY Package.swift Package.resolved ./
RUN swift package resolve
COPY Sources ./Sources
COPY Tests ./Tests
RUN swift build -c release
# REPLACE: 'App' in COPY below with your Swift target/product name

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM swift:6.0-noble-slim AS runtime
WORKDIR /app
RUN useradd -u 1001 -r app
COPY --from=build --chown=1001:0 /app/.build/release/App /app/app
# REPLACE: App with your executable target name
USER app
EXPOSE 8080
# REPLACE: /app/app with your Swift target binary name
ENTRYPOINT ["/app/app", "--hostname", "0.0.0.0", "--port", "8080"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: swift:6.0-jammy — Ubuntu Jammy, larger but maximum library compat
#FROM swift:6.0-jammy AS runtime
#WORKDIR /app
#RUN useradd -u 1001 -r app
#COPY --from=build --chown=1001:0 /app/.build/release/App /app/app
#USER app
#EXPOSE 8080
#ENTRYPOINT ["/app/app", "--hostname", "0.0.0.0", "--port", "8080"]

# Option: swift:6.0-alpine — smallest Swift runtime image (~80MB smaller than noble-slim)
#FROM swift:6.0-alpine AS runtime
#WORKDIR /app
#RUN adduser -D -u 1001 app
#COPY --from=build --chown=app:app /app/.build/release/App /app/app
#USER app
#EXPOSE 8080
#ENTRYPOINT ["/app/app", "--hostname", "0.0.0.0", "--port", "8080"]
