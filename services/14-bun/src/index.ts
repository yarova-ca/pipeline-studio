const server = Bun.serve({
  port: parseInt(process.env.PORT ?? "3000"),
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") {
      return Response.json({ message: "Hello from Bun 1.1", framework: "14-bun", version: "1.0.0" });
    }
    if (url.pathname === "/health" || url.pathname === "/health/live" || url.pathname === "/health/ready") {
      return Response.json({ status: "ok", version: "1.0.0" });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Bun server running on http://localhost:${server.port}`);
