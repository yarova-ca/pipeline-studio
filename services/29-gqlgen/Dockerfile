# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
 && wget -q https://go.dev/dl/go1.22.12.linux-amd64.tar.gz \
 && tar -C /usr/local -xzf go1.22.12.linux-amd64.tar.gz \
 && rm go1.22.12.linux-amd64.tar.gz \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/local/go/bin:$PATH"

FROM golang:1.22-bookworm AS base-sdk
FROM golang:1.22-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/server .
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]

# slim
# FROM gcr.io/distroless/base-debian12 AS runtime
# COPY --from=build /app/server /server
# EXPOSE 8080
# CMD ["/server"]
