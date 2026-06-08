# ─────────────────────────────────────────────────────────────────────────
# Framework: 16 Go — Chi 5.2
# Pattern:   Multi-stage Docker (statically linked binary → scratch)
# Build:     ubuntu:24.04 (Go 1.23 + musl via CGO_ENABLED=0)
# Runtime:   scratch
# FIPS:      registry.access.redhat.com/ubi9/ubi-micro
# Port:      8080
# Chi: same pattern as Gin
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
 && wget -q https://go.dev/dl/go1.23.4.linux-amd64.tar.gz \
 && tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz \
 && rm go1.23.4.linux-amd64.tar.gz \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/local/go/bin:$PATH" CGO_ENABLED=0 GOOS=linux

FROM golang:1.23-bookworm AS base-sdk
FROM golang:1.23-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -a -installsuffix cgo -ldflags="-s -w" -o /app/bin/app .

# ── Runtime stage (standard — scratch, zero attack surface) ───────────────
FROM scratch AS runtime
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app/bin/app /app
USER 65534:65534
EXPOSE 8080
ENTRYPOINT ["/app"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: gcr.io/distroless/static-debian12 — when TLS certs or timezone data needed at runtime
#FROM gcr.io/distroless/static-debian12 AS runtime
#COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
#COPY --from=build /app/bin/app /app
#USER 65534:65534
#EXPOSE 8080
#ENTRYPOINT ["/app"]

# Option: alpine:3.21 — shell available for debugging; larger attack surface than scratch
#FROM alpine:3.21 AS runtime
#RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 65534 nobody
#COPY --from=build /app/bin/app /app
#USER 65534:65534
#EXPOSE 8080
#ENTRYPOINT ["/app"]

# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ubi-micro AS runtime-fips
COPY --from=build /app/bin/app /usr/local/bin/app
USER 1001
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1
ENTRYPOINT ["/usr/local/bin/app"]
