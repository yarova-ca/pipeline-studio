# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget clang libicu-dev libssl-dev \
 && wget -q https://download.swift.org/swift-5.10-release/ubuntu2404/swift-5.10-RELEASE/swift-5.10-RELEASE-ubuntu24.04.tar.gz \
 && tar -xzf swift-5.10-RELEASE-ubuntu24.04.tar.gz -C /usr \
 && mv /usr/swift-5.10-RELEASE-ubuntu24.04 /usr/swift \
 && rm swift-5.10-RELEASE-ubuntu24.04.tar.gz \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/swift/usr/bin:$PATH"

FROM swift:5.10-bookworm AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY Package.swift Package.resolved* ./
RUN swift package resolve
COPY Sources ./Sources
RUN swift build -c release

FROM swift:5.10-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/.build/release/Server ./server
ENV GRPC_PORT=50051
EXPOSE 50051
CMD ["./server"]
