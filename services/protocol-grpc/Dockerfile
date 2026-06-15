# syntax=docker/dockerfile:1.6
FROM golang:1.23-bookworm AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# I-19: distroless nonroot base — no shell, runs as uid 65532.
FROM gcr.io/distroless/base-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=build /app/server .
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
USER nonroot
ENTRYPOINT ["/app/server"]
