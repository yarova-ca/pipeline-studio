# ─────────────────────────────────────────────────────────────────────────
# Framework: 03 SSG — Hugo 0.161
# Pattern:   Multi-stage Docker (build → static → nginx)
# Build:     ubuntu:24.04
# Runtime:   nginx:alpine
# FIPS:      registry.access.redhat.com/ubi9/nginx-122
# Port:      80
# Hugo: hugo --minify outputs to public/
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
 && wget -q https://github.com/gohugoio/hugo/releases/download/v0.161.0/hugo_extended_0.161.0_linux-amd64.tar.gz \
 && tar -xzf hugo_extended_0.161.0_linux-amd64.tar.gz -C /usr/local/bin \
 && rm hugo_extended_0.161.0_linux-amd64.tar.gz \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN hugo --minify

# ── Runtime stage (standard — nginx serves static assets) ─────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/public /usr/share/nginx/html
# Optional: COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nginx-122 AS runtime-fips
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
