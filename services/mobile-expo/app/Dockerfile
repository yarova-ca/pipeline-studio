# syntax=docker/dockerfile:1.6
# The native app ships to the stores; this image builds and serves the web
# target so the client is verifiable in CI, behind the same BFF proxy.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG EXPO_PUBLIC_BFF_URL=""
ENV EXPO_PUBLIC_BFF_URL=${EXPO_PUBLIC_BFF_URL}
RUN npx expo export --platform web --output-dir dist

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.mjs ./server.mjs
# C-10: run as the non-root user the node image ships.
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health/live',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" || exit 1
CMD ["node", "server.mjs"]
