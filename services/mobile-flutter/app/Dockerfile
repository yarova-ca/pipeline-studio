# syntax=docker/dockerfile:1.6
# The native app ships to the stores; this image builds and serves the web
# target so the client is verifiable in CI, behind the same BFF proxy.
FROM ghcr.io/cirruslabs/flutter:stable AS build
WORKDIR /app
# Scaffold the web platform files, then override with our pubspec and code.
RUN flutter create --platforms=web --project-name yarova_mobile .
COPY pubspec.yaml ./
COPY lib ./lib
RUN flutter pub get && flutter build web --release

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/build/web ./dist
COPY server.mjs ./server.mjs
# C-10: run as the non-root user the node image ships.
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health/live',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" || exit 1
CMD ["node", "server.mjs"]
