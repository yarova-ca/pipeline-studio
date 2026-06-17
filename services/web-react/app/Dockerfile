# syntax=docker/dockerfile:1.6
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
# PUBLIC_APP_NAME is baked into the bundle at build (a public value, not a secret).
ARG PUBLIC_APP_NAME=Yarova
ENV PUBLIC_APP_NAME=${PUBLIC_APP_NAME}
RUN npm run build

FROM node:24-bookworm-slim AS runtime
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
