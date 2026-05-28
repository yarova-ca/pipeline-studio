# ─────────────────────────────────────────────────────────────────────────
# Framework: 13 PWA — Vite PWA Plugin 0.21
# Pattern:   Multi-stage Docker (build → static → nginx)
# Build:     ubuntu:24.04
# Runtime:   nginx:alpine
# FIPS:      registry.access.redhat.com/ubi9/nginx-122
# Port:      80
# Vite PWA: Vite outputs to dist/; service worker included
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage (standard — nginx serves static assets) ─────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nginx-122 AS runtime-fips
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
