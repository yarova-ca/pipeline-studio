# ─────────────────────────────────────────────────────────────────────────
# Framework: 04 Islands — Fresh 2.3
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Deno 2.3 installed)
# Runtime:   denoland/deno:2.3-alpine
# FIPS:      N/A — no dedicated FIPS variant for Deno
# Port:      8000
# Fresh: runs directly with deno — no separate build step needed
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \
 && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY deno.json deno.lock* ./
RUN deno cache src/main.ts
COPY . .
RUN deno task build 2>/dev/null || echo "No build step — running directly"

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM denoland/deno:2.3-alpine AS runtime
WORKDIR /app
USER 1001
COPY --from=build --chown=1001:0 /app ./
EXPOSE 8000
# Deno permissions: add --allow-net --allow-read etc. as needed
CMD ["deno", "task", "start"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: denoland/deno:2.3 — Debian-based, larger, more compat (glibc vs musl)
#FROM denoland/deno:2.3 AS runtime
#WORKDIR /app
#USER 1001
#COPY --from=build --chown=1001:0 /app ./
#EXPOSE 8000
#CMD ["deno", "task", "start"]

# Option: denoland/deno:2.3-distroless — minimal, no shell, sigstore-verified
#FROM denoland/deno:2.3-distroless AS runtime
#WORKDIR /app
#COPY --from=build --chown=65532:65532 /app ./
#EXPOSE 8000
#CMD ["deno", "task", "start"]
