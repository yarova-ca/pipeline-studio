import './tracing.js'
import { logger } from './logger.js'
import { prisma } from './db/client.js'
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import rateLimit from 'express-rate-limit'

const typeDefs = `#graphql
  type Query {
    health: HealthStatus!
  }
  type HealthStatus {
    status: String!
    version: String!
  }
`;

const resolvers = {
  Query: {
    health: () => ({ status: "ok", version: "1.0.0" }),
  },
};

async function start() {
  const app = express();
  app.use(cors());
  app.use(express.json());

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 60_000,   // 1-minute window
    max: 100,           // 100 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — try again in 60 seconds' },
    skip: (req) => req.path.startsWith('/health'),
  }),
)
// ── Request logging ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'request')
  next()
})

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
  });
  app.get("/health/live", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/health/ready", (_req, res) => {
    res.json({ status: "ok" });
  });

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  app.use("/graphql", expressMiddleware(server));

  const port = parseInt(process.env.PORT ?? "4000");
  createServer(app).listen(port, () => {
    console.log(`Apollo Server ready at http://localhost:${port}/graphql`);
    console.log(`Health: GET http://localhost:${port}/health`);
  });
}

start().catch(console.error);

// Graceful shutdown — drains in-flight requests before exiting.
process.on('SIGTERM', () => {
  const srv = (global as any).__server
  if (srv) srv.close(() => process.exit(0))
  else process.exit(0)
})
