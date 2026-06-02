import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { createSchema, createYoga } from "graphql-yoga";

const yoga = createYoga({
  schema: createSchema({
    typeDefs: `type Query { health: String! }`,
    resolvers: { Query: { health: () => "ok" } },
  }),
});

const healthBody = JSON.stringify({ status: "ok", version: "1.0.0" });
const liveBody = JSON.stringify({ status: "ok" });

function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(healthBody);
  }
  if (req.url === "/health/live" || req.url === "/health/ready") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(liveBody);
  }
  return yoga(req, res);
}

const port = parseInt(process.env.PORT ?? "4000");
createServer(handler).listen(port, () => {
  console.log(`GraphQL Yoga ready at http://localhost:${port}/graphql`);
  console.log(`Health: GET http://localhost:${port}/health`);
});

// Graceful shutdown — drains in-flight requests before exiting.
process.on('SIGTERM', () => {
  const srv = (global as any).__server
  if (srv) srv.close(() => process.exit(0))
  else process.exit(0)
})
