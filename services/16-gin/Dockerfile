# ─────────────────────────────────────────────────────────────────────────
# Framework: 16 Go — Gin 1.10
# Pattern:   Multi-stage Docker (statically linked binary → scratch)
# Build:     ubuntu:24.04 (Go 1.23 + musl via CGO_ENABLED=0)
# Runtime:   scratch (default) | gcr.io/distroless/static-debian12 | alpine:3.21 | ubi9/ubi-micro
# Port:      8080
# Gin: statically linked binary copied to scratch image
# RUNTIME build-arg: scratch (default) | distroless | alpine | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=scratch
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
RUN go build -a -installsuffix cgo -ldflags="-s -w" -o /app/bin/app ./...
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
COPY --from=build /app/bin/app /app
USER 1001
EXPOSE 8080
ENTRYPOINT ["/app"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build /app/bin/app /usr/local/bin/app
USER 1001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]
