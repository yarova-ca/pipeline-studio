FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx prisma generate 2>/dev/null || true
RUN npm run build
FROM node:22-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV PORT=3000 NODE_ENV=production OTEL_ENABLED=false DATABASE_URL="file:./dev.db"
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# The industry compliance profiles are read at runtime to flip controls.
COPY --from=build /app/compliance ./compliance
RUN useradd -r -u 10001 appuser && chown -R appuser /app
USER appuser
EXPOSE 3000
CMD ["node","dist/main.js"]
