# ─────────────────────────────────────────────────────────────────────────
# Framework: 19 .NET — ASP.NET Core 9
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (.NET SDK 9.0)
# Runtime:   mcr.microsoft.com/dotnet/aspnet:9.0-alpine
# FIPS:      mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips
# Port:      8080
# ASP.NET Core: dotnet publish -c Release -o out; REPLACE App.dll with your assembly name
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \
 && wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \
 && dpkg -i packages-microsoft-prod.deb \
 && apt-get update && apt-get install -y dotnet-sdk-9.0 \
 && rm -rf /var/lib/apt/lists/* packages-microsoft-prod.deb
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
ENTRYPOINT ["dotnet", "App.dll"]

# ── Runtime — FIPS (Mariner 2.0 FIPS-compliant .NET) ─────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips AS runtime-fips
WORKDIR /app
RUN adduser -u 1001 -D app
COPY --from=build --chown=app:app /app/out ./
USER app
EXPOSE 8080
# REPLACE: App.dll with your assembly name
ENTRYPOINT ["dotnet", "App.dll"]
