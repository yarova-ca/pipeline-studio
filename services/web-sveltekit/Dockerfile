# syntax=docker/dockerfile:1.6
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
# Industry compliance profiles are read at runtime to show the recipe.
COPY --from=build /app/compliance ./compliance
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" || exit 1
CMD ["node", "build/index.js"]
