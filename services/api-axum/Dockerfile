FROM rust:1-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
ENV SQLX_OFFLINE=true
COPY . .
RUN cargo build --release
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/* && useradd -r -u 10001 appuser
COPY --from=build /app/target/release/axum-service /app
USER appuser
ENV PORT=8080
EXPOSE 8080
CMD ["/app"]
