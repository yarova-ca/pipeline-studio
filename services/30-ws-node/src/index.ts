import * as http from "http";
import { WebSocketServer } from "ws";

const port = parseInt(process.env.PORT ?? "8080");

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: "1.0.0" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (msg) => {
    ws.send(JSON.stringify({ echo: msg.toString(), ts: Date.now() }));
  });
  ws.on("close", () => console.log("Client disconnected"));
});

server.listen(port, () => {
  console.log(`WebSocket server on ws://localhost:${port}/ws`);
  console.log(`Health on http://localhost:${port}/health`);
});
