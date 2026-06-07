# ─────────────────────────────────────────────────────────────────────────
# Framework: 20 Rust — Axum 0.8
# Pattern:   Multi-stage Docker (musl static binary → scratch)
# Build:     ubuntu:24.04 (rustup + musl target)
# Runtime:   scratch (default) | gcr.io/distroless/static-debian12 | alpine:3.21 | ubi9/ubi-micro
# Port:      8080
# Axum: statically linked via musl target; zero-dependency scratch image
# RUNTIME build-arg: scratch (default) | distroless | alpine | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=scratch
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential musl-tools ca-certificates \
 && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
 && . /root/.cargo/env \
 && rustup target add x86_64-unknown-linux-musl \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/root/.cargo/bin:$PATH"

FROM rust:1.83-bookworm AS base-sdk
FROM rust:1.83-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release --target x86_64-unknown-linux-musl && rm src/main.rs
COPY src ./src
RUN cargo build --release --target x86_64-unknown-linux-musl
# REPLACE: binary name in COPY below defaults to 'app' — update to your Cargo package name
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM scratch AS base-scratch
FROM gcr.io/distroless/static-debian12 AS base-distroless
FROM alpine:3.21 AS base-alpine
FROM registry.access.redhat.com/ubi9/ubi-micro AS base-fips

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/20-axum /app
USER 1001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["/app", "-health-check"]
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
ENTRYPOINT ["/app"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/20-axum /usr/local/bin/app
RUN microdnf install -y curl && microdnf clean all
USER 1001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
ENTRYPOINT ["/usr/local/bin/app"]
