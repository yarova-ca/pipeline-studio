# ─────────────────────────────────────────────────────────────────────────
# Framework: 16 Go — Gin 1.10
# Pattern:   Multi-stage Docker (statically linked binary → scratch)
# Build:     ubuntu:24.04 (Go 1.23 + musl via CGO_ENABLED=0)
# Runtime:   scratch
# FIPS:      registry.access.redhat.com/ubi9/ubi-micro
# Port:      8080
# Gin: statically linked binary copied to scratch image
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
 && wget -q https://go.dev/dl/go1.23.4.linux-amd64.tar.gz \
 && tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz \
 && rm go1.23.4.linux-amd64.tar.gz \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/local/go/bin:$PATH" CGO_ENABLED=0 GOOS=linux
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -a -installsuffix cgo -ldflags="-s -w" -o /app/bin/app ./...

# ── Runtime stage (standard — scratch, zero attack surface) ───────────────
FROM scratch AS runtime
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=build /app/bin/app /app
USER 65534:65534
EXPOSE 8080
ENTRYPOINT ["/app"]

# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ubi-micro AS runtime-fips
COPY --from=build /app/bin/app /usr/local/bin/app
USER 1001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]
