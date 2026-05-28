# ─────────────────────────────────────────────────────────────────────────
# Framework: 20 Rust — Axum 0.8
# Pattern:   Multi-stage Docker (musl static binary → scratch)
# Build:     ubuntu:24.04 (rustup + musl target)
# Runtime:   scratch (zero attack surface — no OS, no shell)
# FIPS:      registry.access.redhat.com/ubi9/ubi-micro
# Port:      8080
# Axum: statically linked via musl target; zero-dependency scratch image
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential musl-tools ca-certificates \
 && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
 && . /root/.cargo/env \
 && rustup target add x86_64-unknown-linux-musl \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/root/.cargo/bin:$PATH" 
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release --target x86_64-unknown-linux-musl && rm src/main.rs
COPY src ./src
RUN cargo build --release --target x86_64-unknown-linux-musl
# REPLACE: binary name in COPY below defaults to 'app' — update to your Cargo package name

# ── Runtime stage (standard — scratch) ────────────────────────────────────
FROM scratch AS runtime
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/app /app
USER 65534:65534
EXPOSE 8080
ENTRYPOINT ["/app"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: gcr.io/distroless/static-debian12 — when TLS certs or timezone data needed at runtime
#FROM gcr.io/distroless/static-debian12 AS runtime
#COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
#COPY --from=build /app/target/x86_64-unknown-linux-musl/release/app /app
#USER 65534:65534
#EXPOSE 8080
#ENTRYPOINT ["/app"]

# Option: alpine:3.21 — shell available for debugging; apk available for runtime deps
#FROM alpine:3.21 AS runtime
#RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 65534 nobody
#COPY --from=build /app/target/x86_64-unknown-linux-musl/release/app /app
#USER 65534:65534
#EXPOSE 8080
#ENTRYPOINT ["/app"]

# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ubi-micro AS runtime-fips
COPY --from=build /app/target/x86_64-unknown-linux-musl/release/app /usr/local/bin/app
USER 1001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]
