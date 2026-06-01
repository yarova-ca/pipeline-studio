# ─────────────────────────────────────────────────────────────────────────
# Framework: 19 .NET — Minimal APIs .NET 9
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (.NET SDK 9.0)
# Runtime:   mcr.microsoft.com/dotnet/aspnet:9.0-alpine
# FIPS:      mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips
# Port:      8080
# Minimal APIs: same publish pattern as ASP.NET Core
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \
 && wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \
 && dpkg -i packages-microsoft-prod.deb \
 && apt-get update && apt-get install -y dotnet-sdk-9.0 \
 && rm -rf /var/lib/apt/lists/* packages-microsoft-prod.deb

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS base-sdk
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/out --self-contained false

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
WORKDIR /app
RUN adduser -u 1001 -D app
COPY --from=build --chown=app:app /app/out ./
USER app
EXPOSE 8080
# REPLACE: App.dll with your assembly name (project name without extension)
ENTRYPOINT ["dotnet", "19-minimal-apis.dll"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: mcr.microsoft.com/dotnet/aspnet:9.0-noble — Ubuntu Noble, glibc (better Linux compat)
#FROM mcr.microsoft.com/dotnet/aspnet:9.0-noble AS runtime
#WORKDIR /app
#RUN adduser -u 1001 -D app
#COPY --from=build --chown=app:app /app/out ./
#USER app
#EXPOSE 8080
#ENTRYPOINT ["dotnet", "19-minimal-apis.dll"]

# Option: mcr.microsoft.com/dotnet/aspnet:9.0 — Debian bookworm slim (default Microsoft base)
#FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
#WORKDIR /app
#RUN adduser -u 1001 -D app
#COPY --from=build --chown=app:app /app/out ./
#USER app
#EXPOSE 8080
#ENTRYPOINT ["dotnet", "19-minimal-apis.dll"]

# ── Runtime — FIPS (Mariner 2.0 FIPS-compliant .NET) ─────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips AS runtime-fips
WORKDIR /app
RUN adduser -u 1001 -D app
COPY --from=build --chown=app:app /app/out ./
USER app
EXPOSE 8080
# REPLACE: App.dll with your assembly name

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "19-minimal-apis.dll"]
