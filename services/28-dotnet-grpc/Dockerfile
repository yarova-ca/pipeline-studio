# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=sdk
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \
 && wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \
 && dpkg -i packages-microsoft-prod.deb \
 && apt-get update && apt-get install -y dotnet-sdk-8.0 \
 && rm -rf /var/lib/apt/lists/* packages-microsoft-prod.deb

FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS base-sdk
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /publish .
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:50051/health/live || exit 1
ENTRYPOINT ["dotnet", "28-dotnet-grpc.dll"]
