import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { createServer } from "http";

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
