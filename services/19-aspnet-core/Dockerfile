# ─────────────────────────────────────────────────────────────────────────
# Framework: 19 .NET — ASP.NET Core 9
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (.NET SDK 9.0)
# Runtime:   mcr.microsoft.com/dotnet/aspnet:9.0-alpine (default) | aspnet:9.0-noble | aspnet:9.0-cbl-mariner2.0-fips
# Port:      8080
# ASP.NET Core: dotnet publish -c Release -o out; REPLACE App.dll with your assembly name
# RUNTIME build-arg: alpine (default) | debian | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=alpine
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
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base-alpine
FROM mcr.microsoft.com/dotnet/aspnet:9.0-noble AS base-debian
FROM mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips AS base-fips

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/out ./
USER 1001
EXPOSE 8080
# REPLACE: App.dll with your assembly name (project name without extension)
ENTRYPOINT ["dotnet", "19-aspnet-core.dll"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/out ./
USER 1001
EXPOSE 8080
# REPLACE: App.dll with your assembly name

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["dotnet", "19-aspnet-core.dll"]
