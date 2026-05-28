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

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: nginx:1.27-stable-alpine3.21-slim — pinned stable slim tag (more predictable than :alpine)
#FROM nginx:1.27-stable-alpine3.21-slim AS runtime
#COPY --from=build /app/public /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]

# Option: cgr.dev/chainguard/nginx:latest — hardened nginx, sigstore-verified, rootless by default
#FROM cgr.dev/chainguard/nginx:latest AS runtime
#COPY --from=build /app/public /usr/share/nginx/html
#EXPOSE 80

# Option: caddy:2-alpine — replaces nginx entirely; HTTPS auto-provisioning, simpler config
#FROM caddy:2-alpine AS runtime
#COPY --from=build /app/public /srv
#COPY Caddyfile /etc/caddy/Caddyfile
#EXPOSE 80 443
#CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nginx-122 AS runtime-fips
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
