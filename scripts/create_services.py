#!/usr/bin/env python3
"""Create all 30 new service starter directories."""
import os

BASE = "/mnt/c/Users/RohithY/yarova/service-starters/services"

def mkfile(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    print(f"  {os.path.relpath(path, BASE)}")

def d(name):
    return os.path.join(BASE, name)

# ── 01-solid-start ───────────────────────────────────────────────────────────
name = "01-solid-start"
mkfile(f"{d(name)}/package.json", """{
  "name": "01-solid-start",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "node .output/server/index.mjs"
  },
  "dependencies": {
    "@solidjs/start": "^1.0.0",
    "solid-js": "^1.9.0",
    "vinxi": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
""")
mkfile(f"{d(name)}/app.config.ts", """import { defineConfig } from "@solidjs/start/config";
export default defineConfig({
  server: { preset: "node-server" }
});
""")
mkfile(f"{d(name)}/src/routes/index.tsx", """export default function Home() {
  return <h1>Solid Start 1.0 — service starter</h1>;
}
""")
mkfile(f"{d(name)}/src/routes/api/health.ts", """import { json } from "@solidjs/start";
export function GET() {
  return json({ status: "ok", version: "1.0.0" });
}
""")
mkfile(f"{d(name)}/src/routes/api/health/live.ts", """import { json } from "@solidjs/start";
export function GET() {
  return json({ status: "ok" });
}
""")
mkfile(f"{d(name)}/src/routes/api/health/ready.ts", """import { json } from "@solidjs/start";
export function GET() {
  return json({ status: "ok" });
}
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsxImportSource": "solid-js",
    "jsx": "preserve"
  }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── runtime (standard — default) ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/.output .output
ENV PORT=3000 NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

# ── runtime variants (uncomment one, comment the standard block above) ────────
# slim
# FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD [".output/server/index.mjs"]

# chainguard
# FROM cgr.dev/chainguard/node:latest AS runtime
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD [".output/server/index.mjs"]

# ubi9
# FROM registry.access.redhat.com/ubi9-minimal AS runtime
# RUN microdnf install -y nodejs && microdnf clean all
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD ["node", ".output/server/index.mjs"]

# edge (multi-arch)
# FROM --platform=$TARGETPLATFORM node:22-bookworm-slim AS runtime
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD ["node", ".output/server/index.mjs"]
""")

# ── 02-preact ─────────────────────────────────────────────────────────────────
name = "02-preact"
mkfile(f"{d(name)}/package.json", """{
  "name": "02-preact",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "preact": "^10.25.0"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.9.0",
    "vite": "^5.4.0",
    "typescript": "^5.4.0"
  }
}
""")
mkfile(f"{d(name)}/vite.config.ts", """import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
export default defineConfig({ plugins: [preact()] });
""")
mkfile(f"{d(name)}/src/app.tsx", """export function App() {
  return <h1>Preact 10 — service starter</h1>;
}
""")
mkfile(f"{d(name)}/src/main.tsx", """import { render } from "preact";
import { App } from "./app";
render(<App />, document.getElementById("app")!);
""")
mkfile(f"{d(name)}/index.html", """<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8"><title>02-preact</title></head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsxImportSource": "preact",
    "jsx": "react-jsx"
  }
}
""")
mkfile(f"{d(name)}/nginx.conf", """server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /health { return 200 '{"status":"ok"}'; add_header Content-Type application/json; }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── runtime (standard — default) ─────────────────────────────────────────────
FROM nginx:1.27-bookworm-slim AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── runtime variants ──────────────────────────────────────────────────────────
# slim / chainguard / ubi9 / edge variants follow same pattern:
# replace nginx:1.27-bookworm-slim with preferred base, keep COPY + CMD.
""")

# ── 02-lit ────────────────────────────────────────────────────────────────────
name = "02-lit"
mkfile(f"{d(name)}/package.json", """{
  "name": "02-lit",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "lit": "^3.2.0"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "typescript": "^5.4.0"
  }
}
""")
mkfile(f"{d(name)}/src/my-element.ts", """import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("my-element")
export class MyElement extends LitElement {
  static styles = css`h1 { color: #007bff; }`;
  render() {
    return html`<h1>Lit 3.2 — service starter</h1>`;
  }
}
""")
mkfile(f"{d(name)}/src/main.ts", """import "./my-element";
""")
mkfile(f"{d(name)}/index.html", """<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8"><title>02-lit</title></head>
  <body>
    <my-element></my-element>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "experimentalDecorators": true,
    "useDefineForClassFields": false
  }
}
""")
mkfile(f"{d(name)}/nginx.conf", """server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /health { return 200 '{"status":"ok"}'; add_header Content-Type application/json; }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx vite build

FROM nginx:1.27-bookworm-slim AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
""")

# ── 14-bun ────────────────────────────────────────────────────────────────────
name = "14-bun"
mkfile(f"{d(name)}/package.json", """{
  "name": "14-bun",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "start": "bun run src/index.ts",
    "test": "bun test"
  },
  "dependencies": {}
}
""")
mkfile(f"{d(name)}/src/index.ts", """const server = Bun.serve({
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
""")
mkfile(f"{d(name)}/src/index.test.ts", """import { describe, it, expect } from "bun:test";

describe("14-bun health endpoints", () => {
  it("GET /health returns ok", async () => {
    const res = await fetch("http://localhost:3000/health");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
# ── build ────────────────────────────────────────────────────────────────────
FROM oven/bun:1.1-debian AS build
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build src/index.ts --outfile dist/index.js --target bun

# ── runtime (standard — default) ─────────────────────────────────────────────
FROM oven/bun:1.1-distroless AS runtime
WORKDIR /app
COPY --from=build /app/dist/index.js .
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "index.js"]

# ── runtime variants ──────────────────────────────────────────────────────────
# standard (with shell)
# FROM oven/bun:1.1-debian AS runtime
# WORKDIR /app
# COPY --from=build /app/dist/index.js .
# ENV PORT=3000
# EXPOSE 3000
# CMD ["bun", "run", "index.js"]

# ubi9
# FROM registry.access.redhat.com/ubi9-minimal AS runtime
# RUN microdnf install -y unzip && microdnf clean all
# RUN curl -fsSL https://bun.sh/install | bash
# WORKDIR /app
# COPY --from=build /app/dist/index.js .
# ENV PORT=3000
# EXPOSE 3000
# CMD ["/root/.bun/bin/bun", "run", "index.js"]

# edge (multi-arch)
# FROM --platform=$TARGETPLATFORM oven/bun:1.1-debian AS runtime
# WORKDIR /app
# COPY --from=build /app/dist/index.js .
# ENV PORT=3000
# EXPOSE 3000
# CMD ["bun", "run", "index.js"]
""")

# ── 28 gRPC ───────────────────────────────────────────────────────────────────
PROTO = """syntax = "proto3";
package health;
option go_package = "health/healthpb";

service Health {
  rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
}

message HealthCheckRequest { string service = 1; }
message HealthCheckResponse {
  enum ServingStatus { UNKNOWN = 0; SERVING = 1; NOT_SERVING = 2; }
  ServingStatus status = 1;
}
"""

# 28-go-grpc
name = "28-go-grpc"
mkfile(f"{d(name)}/proto/health.proto", PROTO)
mkfile(f"{d(name)}/go.mod", """module github.com/yarova-ca/28-go-grpc

go 1.22

require (
\tgoogle.golang.org/grpc v1.63.0
\tgoogle.golang.org/protobuf v1.34.0
)
""")
mkfile(f"{d(name)}/main.go", """package main

import (
\t"context"
\t"log"
\t"net"
\t"net/http"
\t"os"

\t"google.golang.org/grpc"
\t"google.golang.org/grpc/health/grpc_health_v1"
\t"google.golang.org/grpc/reflection"
)

type healthServer struct{ grpc_health_v1.UnimplementedHealthServer }

func (s *healthServer) Check(ctx context.Context, req *grpc_health_v1.HealthCheckRequest) (*grpc_health_v1.HealthCheckResponse, error) {
\treturn &grpc_health_v1.HealthCheckResponse{Status: grpc_health_v1.HealthCheckResponse_SERVING}, nil
}

func main() {
\tgrpcPort := os.Getenv("GRPC_PORT")
\tif grpcPort == "" { grpcPort = "50051" }
\thttpPort := os.Getenv("HTTP_PORT")
\tif httpPort == "" { httpPort = "8080" }

\tlis, err := net.Listen("tcp", ":"+grpcPort)
\tif err != nil { log.Fatalf("listen: %v", err) }

\ts := grpc.NewServer()
\tgrpc_health_v1.RegisterHealthServer(s, &healthServer{})
\treflection.Register(s)

\t// HTTP sidecar for Kubernetes /health probes
\tgo func() {
\t\thttp.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
\t\t\tw.Header().Set("Content-Type", "application/json")
\t\t\tw.Write([]byte(`{"status":"ok"}`))
\t\t})
\t\thttp.HandleFunc("/health/live", func(w http.ResponseWriter, r *http.Request) {
\t\t\tw.Header().Set("Content-Type", "application/json")
\t\t\tw.Write([]byte(`{"status":"ok"}`))
\t\t})
\t\thttp.HandleFunc("/health/ready", func(w http.ResponseWriter, r *http.Request) {
\t\t\tw.Header().Set("Content-Type", "application/json")
\t\t\tw.Write([]byte(`{"status":"ok"}`))
\t\t})
\t\tif err := http.ListenAndServe(":"+httpPort, nil); err != nil {
\t\t\tlog.Fatalf("http sidecar: %v", err)
\t\t}
\t}()

\tlog.Printf("gRPC server listening on :%s", grpcPort)
\tlog.Printf("HTTP health sidecar on :%s", httpPort)
\tif err := s.Serve(lis); err != nil { log.Fatalf("serve: %v", err) }
}
""")
mkfile(f"{d(name)}/main_test.go", """package main

import (
\t"context"
\t"net"
\t"testing"
\t"time"

\t"google.golang.org/grpc"
\t"google.golang.org/grpc/credentials/insecure"
\t"google.golang.org/grpc/health/grpc_health_v1"
)

func TestHealthCheck(t *testing.T) {
\tlis, _ := net.Listen("tcp", ":0")
\ts := grpc.NewServer()
\tgrpc_health_v1.RegisterHealthServer(s, &healthServer{})
\tgo s.Serve(lis)
\tdefer s.Stop()

\tctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
\tdefer cancel()
\tconn, err := grpc.DialContext(ctx, lis.Addr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
\tif err != nil { t.Fatal(err) }
\tdefer conn.Close()

\tclient := grpc_health_v1.NewHealthClient(conn)
\tresp, err := client.Check(ctx, &grpc_health_v1.HealthCheckRequest{})
\tif err != nil { t.Fatal(err) }
\tif resp.Status != grpc_health_v1.HealthCheckResponse_SERVING {
\t\tt.Errorf("expected SERVING, got %v", resp.Status)
\t}
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM golang:1.22-bookworm AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/server .
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
CMD ["./server"]

# slim
# FROM gcr.io/distroless/base-debian12 AS runtime
# COPY --from=build /app/server /server
# ENV GRPC_PORT=50051 HTTP_PORT=8080
# EXPOSE 50051 8080
# CMD ["/server"]

# chainguard
# FROM cgr.dev/chainguard/static AS runtime
# COPY --from=build /app/server /server
# EXPOSE 50051 8080
# ENTRYPOINT ["/server"]

# ubi9
# FROM registry.access.redhat.com/ubi9-minimal AS runtime
# COPY --from=build /app/server /server
# EXPOSE 50051 8080
# CMD ["/server"]

# edge (multi-arch)
# FROM --platform=$TARGETPLATFORM debian:bookworm-slim AS runtime
# WORKDIR /app
# COPY --from=build /app/server .
# EXPOSE 50051 8080
# CMD ["./server"]
""")

# 28-node-grpc
name = "28-node-grpc"
mkfile(f"{d(name)}/proto/health.proto", PROTO)
mkfile(f"{d(name)}/package.json", """{
  "name": "28-node-grpc",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "@grpc/grpc-js": "^1.10.0",
    "@grpc/proto-loader": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
""")
mkfile(f"{d(name)}/src/index.ts", """import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as http from "http";
import * as path from "path";

const PROTO_PATH = path.join(__dirname, "../proto/health.proto");
const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true });
const proto = grpc.loadPackageDefinition(packageDef) as any;

function check(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
  cb(null, { status: "SERVING" });
}

const server = new grpc.Server();
server.addService(proto.health.Health.service, { check });

const grpcPort = process.env.GRPC_PORT ?? "50051";
const httpPort = process.env.HTTP_PORT ?? "8080";

server.bindAsync(`0.0.0.0:${grpcPort}`, grpc.ServerCredentials.createInsecure(), () => {
  console.log(`gRPC server on :${grpcPort}`);
});

// HTTP health sidecar
http.createServer((req, res) => {
  if (req.url?.startsWith("/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(httpPort, () => console.log(`HTTP health sidecar on :${httpPort}`));
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src"
  }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/proto ./proto
COPY --from=build /app/node_modules ./node_modules
ENV GRPC_PORT=50051 HTTP_PORT=8080 NODE_ENV=production
EXPOSE 50051 8080
CMD ["node", "dist/index.js"]

# slim
# FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/proto ./proto
# COPY --from=build /app/node_modules ./node_modules
# ENV GRPC_PORT=50051 HTTP_PORT=8080 NODE_ENV=production
# EXPOSE 50051 8080
# CMD ["dist/index.js"]
""")

# 28-python-grpc
name = "28-python-grpc"
mkfile(f"{d(name)}/proto/health.proto", PROTO)
mkfile(f"{d(name)}/requirements.txt", """grpcio==1.63.0
grpcio-tools==1.63.0
grpcio-health-checking==1.63.0
""")
mkfile(f"{d(name)}/src/server.py", """import grpc
import os
from concurrent import futures
from grpc_health.v1 import health, health_pb2, health_pb2_grpc
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/health"):
            body = json.dumps({"status": "ok"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()
    def log_message(self, fmt, *args): pass

def serve():
    grpc_port = os.environ.get("GRPC_PORT", "50051")
    http_port = int(os.environ.get("HTTP_PORT", "8080"))

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    health_servicer = health.HealthServicer()
    health_pb2_grpc.add_HealthServicer_to_server(health_servicer, server)
    health_servicer.set("", health_pb2.HealthCheckResponse.SERVING)
    server.add_insecure_port(f"[::]:{grpc_port}")
    server.start()
    print(f"gRPC server on :{grpc_port}")

    httpd = HTTPServer(("", http_port), HealthHandler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    print(f"HTTP health sidecar on :{http_port}")

    server.wait_for_termination()

if __name__ == "__main__":
    serve()
""")
mkfile(f"{d(name)}/tests/test_server.py", """import grpc
from grpc_health.v1 import health_pb2, health_pb2_grpc

def test_health_check():
    with grpc.insecure_channel("localhost:50051") as ch:
        stub = health_pb2_grpc.HealthStub(ch)
        resp = stub.Check(health_pb2.HealthCheckRequest())
        assert resp.status == health_pb2.HealthCheckResponse.SERVING
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM python:3.12-slim-bookworm AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY src/ ./src/
COPY proto/ ./proto/
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
CMD ["python", "src/server.py"]
""")

# 28-java-grpc
name = "28-java-grpc"
mkfile(f"{d(name)}/pom.xml", """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>ca.yarova</groupId>
  <artifactId>28-java-grpc</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <grpc.version>1.63.0</grpc.version>
  </properties>
  <dependencies>
    <dependency><groupId>io.grpc</groupId><artifactId>grpc-netty-shaded</artifactId><version>${grpc.version}</version></dependency>
    <dependency><groupId>io.grpc</groupId><artifactId>grpc-protobuf</artifactId><version>${grpc.version}</version></dependency>
    <dependency><groupId>io.grpc</groupId><artifactId>grpc-stub</artifactId><version>${grpc.version}</version></dependency>
    <dependency><groupId>io.grpc</groupId><artifactId>grpc-services</artifactId><version>${grpc.version}</version></dependency>
  </dependencies>
</project>
""")
mkfile(f"{d(name)}/src/main/java/ca/yarova/grpc/Server.java", """package ca.yarova.grpc;

import io.grpc.ServerBuilder;
import io.grpc.health.v1.HealthCheckResponse;
import io.grpc.protobuf.services.HealthStatusManager;
import java.net.InetSocketAddress;
import com.sun.net.httpserver.HttpServer;
import java.io.OutputStream;

public class Server {
    public static void main(String[] args) throws Exception {
        int grpcPort = Integer.parseInt(System.getenv().getOrDefault("GRPC_PORT", "50051"));
        int httpPort = Integer.parseInt(System.getenv().getOrDefault("HTTP_PORT", "8080"));

        HealthStatusManager health = new HealthStatusManager();
        health.setStatus("", HealthCheckResponse.ServingStatus.SERVING);

        io.grpc.Server grpcServer = ServerBuilder.forPort(grpcPort)
            .addService(health.getHealthService())
            .build()
            .start();

        System.out.println("gRPC server on :" + grpcPort);

        // HTTP health sidecar
        HttpServer httpServer = HttpServer.create(new InetSocketAddress(httpPort), 0);
        httpServer.createContext("/health", ex -> {
            byte[] body = "{\\\"status\\\":\\\"ok\\\"}".getBytes();
            ex.getResponseHeaders().add("Content-Type", "application/json");
            ex.sendResponseHeaders(200, body.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(body); }
        });
        httpServer.start();
        System.out.println("HTTP health sidecar on :" + httpPort);

        grpcServer.awaitTermination();
    }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM eclipse-temurin:21-jdk-bookworm AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
CMD ["java", "-jar", "app.jar"]

# slim
# FROM gcr.io/distroless/java21-debian12 AS runtime
# COPY --from=build /app/target/*.jar /app.jar
# EXPOSE 50051 8080
# CMD ["/app.jar"]
""")

# 28-kotlin-grpc
name = "28-kotlin-grpc"
mkfile(f"{d(name)}/build.gradle.kts", """plugins {
    kotlin("jvm") version "1.9.0"
    application
}
repositories { mavenCentral() }
dependencies {
    implementation("io.grpc:grpc-kotlin-stub:1.4.0")
    implementation("io.grpc:grpc-protobuf:1.63.0")
    implementation("io.grpc:grpc-netty-shaded:1.63.0")
    implementation("io.grpc:grpc-services:1.63.0")
}
application { mainClass.set("ca.yarova.grpc.ServerKt") }
""")
mkfile(f"{d(name)}/src/main/kotlin/ca/yarova/grpc/Server.kt", """package ca.yarova.grpc

import io.grpc.ServerBuilder
import io.grpc.health.v1.HealthCheckResponse
import io.grpc.protobuf.services.HealthStatusManager

fun main() {
    val grpcPort = System.getenv("GRPC_PORT")?.toInt() ?: 50051
    val health = HealthStatusManager()
    health.setStatus("", HealthCheckResponse.ServingStatus.SERVING)

    val server = ServerBuilder.forPort(grpcPort)
        .addService(health.healthService)
        .build()
        .start()

    println("gRPC server on :$grpcPort")
    server.awaitTermination()
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM gradle:8.7-jdk21 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts* ./
RUN gradle dependencies --no-daemon 2>/dev/null || true
COPY src ./src
RUN gradle installDist --no-daemon

FROM eclipse-temurin:21-jre-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/build/install/28-kotlin-grpc .
ENV GRPC_PORT=50051
EXPOSE 50051
CMD ["bin/28-kotlin-grpc"]
""")

# 28-dotnet-grpc
name = "28-dotnet-grpc"
mkfile(f"{d(name)}/28-dotnet-grpc.csproj", """<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Grpc.AspNetCore" Version="2.62.0" />
    <PackageReference Include="Grpc.AspNetCore.HealthChecks" Version="2.62.0" />
  </ItemGroup>
</Project>
""")
mkfile(f"{d(name)}/Program.cs", """var builder = WebApplication.CreateBuilder(args);
builder.Services.AddGrpc();
builder.Services.AddGrpcHealthChecks();
builder.WebHost.ConfigureKestrel(o => {
    o.ListenAnyIP(50051, lo => lo.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2);
    o.ListenAnyIP(8080);
});
var app = builder.Build();
app.MapGrpcHealthChecksService();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));
app.Run();
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /publish .
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
ENTRYPOINT ["dotnet", "28-dotnet-grpc.dll"]
""")

# 28-rust-grpc
name = "28-rust-grpc"
mkfile(f"{d(name)}/Cargo.toml", """[package]
name = "28-rust-grpc"
version = "1.0.0"
edition = "2021"

[dependencies]
tonic = { version = "0.11", features = ["transport"] }
tonic-health = "0.11"
tokio = { version = "1", features = ["full"] }
""")
mkfile(f"{d(name)}/src/main.rs", r"""use tonic::transport::Server;
use tonic_health::server::HealthReporter;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let grpc_port = std::env::var("GRPC_PORT").unwrap_or_else(|_| "50051".to_string());
    let addr = format!("0.0.0.0:{}", grpc_port).parse()?;

    let (mut reporter, health_svc) = tonic_health::server::health_reporter();
    reporter.set_serving::<()>().await;

    println!("gRPC server on :{}", grpc_port);
    Server::builder()
        .add_service(health_svc)
        .serve(addr)
        .await?;
    Ok(())
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM rust:1.78-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release && rm src/main.rs
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/28-rust-grpc ./server
ENV GRPC_PORT=50051
EXPOSE 50051
CMD ["./server"]

# slim
# FROM gcr.io/distroless/base-debian12 AS runtime
# COPY --from=build /app/target/release/28-rust-grpc /server
# EXPOSE 50051
# CMD ["/server"]
""")

# 28-ruby-grpc
name = "28-ruby-grpc"
mkfile(f"{d(name)}/Gemfile", """source "https://rubygems.org"
gem "grpc", "~> 1.63"
gem "grpc-tools", "~> 1.63"
""")
mkfile(f"{d(name)}/server.rb", """require "grpc"
require "grpc/health/v1/health_services_pb"

class HealthService < Grpc::Health::V1::Health::Service
  def check(req, _call)
    Grpc::Health::V1::HealthCheckResponse.new(status: :SERVING)
  end
end

grpc_port = ENV.fetch("GRPC_PORT", "50051")
s = GRPC::RpcServer.new
s.add_http2_port("0.0.0.0:#{grpc_port}", :this_port_is_insecure)
s.handle(HealthService)
puts "gRPC server on :#{grpc_port}"
s.run_till_terminated_or_interrupted([1, "int", "SIGTERM"])
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM ruby:3.3-bookworm AS build
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install

FROM ruby:3.3-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY . .
ENV GRPC_PORT=50051
EXPOSE 50051
CMD ["ruby", "server.rb"]
""")

# 28-php-grpc
name = "28-php-grpc"
mkfile(f"{d(name)}/composer.json", """{
  "name": "yarova/28-php-grpc",
  "require": {
    "grpc/grpc": "^1.63"
  }
}
""")
mkfile(f"{d(name)}/server.php", """<?php
require 'vendor/autoload.php';

use Grpc\\Channel;
use Grpc\\Server;

$port = getenv('GRPC_PORT') ?: '50051';
echo "gRPC PHP server starting on :$port\\n";
echo "Note: Use grpcio extension + generated stubs for production.\\n";

// HTTP health sidecar
$httpPort = getenv('HTTP_PORT') ?: '8080';
$sock = stream_socket_server("tcp://0.0.0.0:$httpPort", $errno, $errstr);
echo "HTTP health sidecar on :$httpPort\\n";

if ($sock) {
    while ($conn = stream_socket_accept($sock, -1)) {
        $req = fread($conn, 1024);
        $body = json_encode(['status' => 'ok']);
        fwrite($conn, "HTTP/1.1 200 OK\\r\\nContent-Type: application/json\\r\\nContent-Length: " . strlen($body) . "\\r\\n\\r\\n$body");
        fclose($conn);
    }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM php:8.3-fpm-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends zlib1g-dev libgrpc-dev && rm -rf /var/lib/apt/lists/*
COPY composer.json composer.lock* ./
RUN curl -sS https://getcomposer.org/installer | php && php composer.phar install --no-dev

FROM php:8.3-fpm-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/vendor ./vendor
COPY server.php .
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
CMD ["php", "server.php"]
""")

# 28-swift-grpc
name = "28-swift-grpc"
mkfile(f"{d(name)}/Package.swift", """// swift-tools-version:5.10
import PackageDescription
let package = Package(
  name: "28-swift-grpc",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(url: "https://github.com/grpc/grpc-swift.git", from: "2.0.0"),
  ],
  targets: [
    .executableTarget(name: "Server", dependencies: [
      .product(name: "GRPC", package: "grpc-swift"),
    ], path: "Sources/Server"),
  ]
)
""")
mkfile(f"{d(name)}/Sources/Server/main.swift", """import GRPC
import NIOCore
import NIOPosix

@main
struct GRPCServer {
    static func main() async throws {
        let grpcPort = Int(ProcessInfo.processInfo.environment["GRPC_PORT"] ?? "50051") ?? 50051
        let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
        defer { try? group.syncShutdownGracefully() }

        let server = try await GRPC.Server.insecure(group: group)
            .withServiceProviders([GRPCHealthStatusProvider()])
            .bind(host: "0.0.0.0", port: grpcPort)
            .get()

        print("gRPC server on :\\(grpcPort)")
        try await server.onClose.get()
    }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM swift:5.10-bookworm AS build
WORKDIR /app
COPY Package.swift Package.resolved* ./
RUN swift package resolve
COPY Sources ./Sources
RUN swift build -c release

FROM swift:5.10-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/.build/release/Server ./server
ENV GRPC_PORT=50051
EXPOSE 50051
CMD ["./server"]
""")

# ── 29 GraphQL ────────────────────────────────────────────────────────────────

# 29-apollo (Apollo Server 4 + Node.js)
name = "29-apollo"
mkfile(f"{d(name)}/package.json", """{
  "name": "29-apollo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "graphql": "^16.8.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
""")
mkfile(f"{d(name)}/src/index.ts", """import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

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
  const server = new ApolloServer({ typeDefs, resolvers });
  const port = parseInt(process.env.PORT ?? "4000");
  const { url } = await startStandaloneServer(server, { listen: { port } });
  console.log(`Apollo Server ready at ${url}`);
  console.log(`Health: GET http://localhost:${port}/health`);
}

start().catch(console.error);
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src"
  }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV PORT=4000 NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]

# slim
# FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/node_modules ./node_modules
# ENV PORT=4000 NODE_ENV=production
# EXPOSE 4000
# CMD ["dist/index.js"]
""")

# 29-graphql-yoga
name = "29-graphql-yoga"
mkfile(f"{d(name)}/package.json", """{
  "name": "29-graphql-yoga",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts"
  },
  "dependencies": {
    "graphql-yoga": "^5.6.0",
    "graphql": "^16.8.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0"
  }
}
""")
mkfile(f"{d(name)}/src/index.ts", """import { createServer } from "node:http";
import { createSchema, createYoga } from "graphql-yoga";

const yoga = createYoga({
  schema: createSchema({
    typeDefs: `type Query { health: String! }`,
    resolvers: { Query: { health: () => "ok" } },
  }),
});

const port = parseInt(process.env.PORT ?? "4000");
createServer(yoga).listen(port, () => {
  console.log(`GraphQL Yoga ready at http://localhost:${port}/graphql`);
});
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true, "target": "ES2020", "module": "CommonJS",
    "outDir": "dist", "rootDir": "src"
  }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV PORT=4000 NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
""")

# 29-strawberry (Python)
name = "29-strawberry"
mkfile(f"{d(name)}/requirements.txt", """strawberry-graphql[fastapi]==0.235.0
fastapi==0.111.0
uvicorn[standard]==0.30.0
""")
mkfile(f"{d(name)}/src/main.py", """import strawberry
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
import uvicorn
import os

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "ok"

schema = strawberry.Schema(query=Query)
graphql_router = GraphQLRouter(schema)

app = FastAPI()
app.include_router(graphql_router, prefix="/graphql")

@app.get("/health")
@app.get("/health/live")
@app.get("/health/ready")
def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM python:3.12-slim-bookworm AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY src/ ./src/
ENV PORT=8000
EXPOSE 8000
CMD ["python", "src/main.py"]
""")

# 29-gqlgen (Go)
name = "29-gqlgen"
mkfile(f"{d(name)}/go.mod", """module github.com/yarova-ca/29-gqlgen

go 1.22

require (
\tgithub.com/99designs/gqlgen v0.17.49
\tgithub.com/vektah/gqlparser/v2 v2.5.14
)
""")
mkfile(f"{d(name)}/schema.graphql", """type Query {
  health: String!
}
""")
mkfile(f"{d(name)}/main.go", """package main

import (
\t"encoding/json"
\t"log"
\t"net/http"
\t"os"
)

type Query struct{}

func (q *Query) Health() string { return "ok" }

func main() {
\tport := os.Getenv("PORT")
\tif port == "" { port = "8080" }

\thttp.HandleFunc("/graphql", func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("Content-Type", "application/json")
\t\tjson.NewEncoder(w).Encode(map[string]interface{}{
\t\t\t"data": map[string]string{"health": "ok"},
\t\t})
\t})
\thttp.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("Content-Type", "application/json")
\t\tw.Write([]byte(`{"status":"ok","version":"1.0.0"}`))
\t})
\thttp.HandleFunc("/health/live", func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("Content-Type", "application/json")
\t\tw.Write([]byte(`{"status":"ok"}`))
\t})
\thttp.HandleFunc("/health/ready", func(w http.ResponseWriter, r *http.Request) {
\t\tw.Header().Set("Content-Type", "application/json")
\t\tw.Write([]byte(`{"status":"ok"}`))
\t})

\tlog.Printf("gqlgen GraphQL server on :%s/graphql", port)
\tlog.Fatal(http.ListenAndServe(":"+port, nil))
}
""")
mkfile(f"{d(name)}/main_test.go", """package main

import (
\t"net/http"
\t"net/http/httptest"
\t"testing"
)

func TestHealth(t *testing.T) {
\treq := httptest.NewRequest("GET", "/health", nil)
\tw := httptest.NewRecorder()
\thttp.DefaultServeMux.ServeHTTP(w, req)
\tif w.Code != 200 { t.Errorf("expected 200, got %d", w.Code) }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM golang:1.22-bookworm AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/server .
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]

# slim
# FROM gcr.io/distroless/base-debian12 AS runtime
# COPY --from=build /app/server /server
# EXPOSE 8080
# CMD ["/server"]
""")

# 29-spring-graphql (Java)
name = "29-spring-graphql"
mkfile(f"{d(name)}/pom.xml", """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
  </parent>
  <groupId>ca.yarova</groupId>
  <artifactId>29-spring-graphql</artifactId>
  <version>1.0.0</version>
  <dependencies>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-graphql</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-actuator</artifactId></dependency>
  </dependencies>
</project>
""")
mkfile(f"{d(name)}/src/main/resources/application.properties", """server.port=${PORT:8080}
spring.graphql.graphiql.enabled=false
management.endpoints.web.exposure.include=health
""")
mkfile(f"{d(name)}/src/main/resources/graphql/schema.graphqls", """type Query {
  health: String!
}
""")
mkfile(f"{d(name)}/src/main/java/ca/yarova/graphql/Application.java", """package ca.yarova.graphql;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

@Controller
class HealthController {
    @QueryMapping
    public String health() { return "ok"; }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM eclipse-temurin:21-jdk-bookworm AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
""")

# 29-hot-chocolate (.NET)
name = "29-hot-chocolate"
mkfile(f"{d(name)}/29-hot-chocolate.csproj", """<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="HotChocolate.AspNetCore" Version="14.0.0" />
  </ItemGroup>
</Project>
""")
mkfile(f"{d(name)}/Program.cs", """var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>();
var app = builder.Build();
app.MapGraphQL();
app.MapGet("/health", () => Results.Ok(new { status = "ok", version = "1.0.0" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));
app.Run();

public class Query {
    public string Health() => "ok";
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /publish .
ENV PORT=8080 ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "29-hot-chocolate.dll"]
""")

# 29-graphql-ruby
name = "29-graphql-ruby"
mkfile(f"{d(name)}/Gemfile", """source "https://rubygems.org"
gem "graphql", "~> 2.3"
gem "rack", "~> 3.0"
gem "puma", "~> 6.0"
""")
mkfile(f"{d(name)}/app.rb", """require "graphql"
require "rack"

QueryType = GraphQL::ObjectType.define do
  name "Query"
  field :health, !types.String, resolve: ->(_obj, _args, _ctx) { "ok" }
end

Schema = GraphQL::Schema.define { query QueryType }

class App
  def call(env)
    req = Rack::Request.new(env)
    if req.path == "/graphql" && req.post?
      body = JSON.parse(req.body.read)
      result = Schema.execute(body["query"])
      [200, { "Content-Type" => "application/json" }, [result.to_json]]
    elsif req.path.start_with?("/health")
      [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']]
    else
      [404, {}, ["Not Found"]]
    end
  end
end

require "json"
run App.new
""")
mkfile(f"{d(name)}/config.ru", """require_relative "app"
run App.new
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM ruby:3.3-bookworm AS build
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install

FROM ruby:3.3-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY . .
ENV PORT=4567 RACK_ENV=production
EXPOSE 4567
CMD ["bundle", "exec", "puma", "-b", "tcp://0.0.0.0:4567"]
""")

# 29-async-graphql (Rust)
name = "29-async-graphql"
mkfile(f"{d(name)}/Cargo.toml", """[package]
name = "29-async-graphql"
version = "1.0.0"
edition = "2021"

[dependencies]
async-graphql = { version = "7.0", features = ["chrono"] }
async-graphql-axum = "7.0"
axum = "0.7"
tokio = { version = "1", features = ["full"] }
""")
mkfile(f"{d(name)}/src/main.rs", r"""use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};
use async_graphql_axum::GraphQL;
use axum::{routing::get, Router};

struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn health(&self) -> &str { "ok" }
}

#[tokio::main]
async fn main() {
    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let app = Router::new()
        .route("/graphql", get(GraphQL::new(schema.clone())).post(GraphQL::new(schema)))
        .route("/health", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }))
        .route("/health/live", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }))
        .route("/health/ready", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }));

    let addr = format!("0.0.0.0:{}", port);
    println!("async-graphql on http://{}/graphql", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM rust:1.78-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release && rm src/main.rs
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/29-async-graphql ./server
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]
""")

# ── 30 WebSocket ──────────────────────────────────────────────────────────────

# 30-ws-node
name = "30-ws-node"
mkfile(f"{d(name)}/package.json", """{
  "name": "30-ws-node",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "ws": "^8.17.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
""")
mkfile(f"{d(name)}/src/index.ts", """import * as http from "http";
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
""")
mkfile(f"{d(name)}/tsconfig.json", """{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src"
  }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]

# slim
# FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/node_modules ./node_modules
# ENV PORT=8080 NODE_ENV=production
# EXPOSE 8080
# CMD ["dist/index.js"]
""")

# 30-ws-go
name = "30-ws-go"
mkfile(f"{d(name)}/go.mod", """module github.com/yarova-ca/30-ws-go

go 1.22

require github.com/gorilla/websocket v1.5.0
""")
mkfile(f"{d(name)}/main.go", """package main

import (
\t"encoding/json"
\t"log"
\t"net/http"
\t"os"
\t"time"

\t"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
\tCheckOrigin: func(r *http.Request) bool { return true },
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
\tconn, err := upgrader.Upgrade(w, r, nil)
\tif err != nil { log.Printf("upgrade: %v", err); return }
\tdefer conn.Close()

\tfor {
\t\tmt, msg, err := conn.ReadMessage()
\t\tif err != nil { break }
\t\tconn.WriteMessage(mt, []byte(`{"echo":"`+string(msg)+`","ts":`+json.Number(string(rune(time.Now().UnixMilli())))+`}`))
\t}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
\tw.Header().Set("Content-Type", "application/json")
\tw.Write([]byte(`{"status":"ok","version":"1.0.0"}`))
}

func main() {
\tport := os.Getenv("PORT")
\tif port == "" { port = "8080" }

\thttp.HandleFunc("/ws", wsHandler)
\thttp.HandleFunc("/health", healthHandler)
\thttp.HandleFunc("/health/live", healthHandler)
\thttp.HandleFunc("/health/ready", healthHandler)

\tlog.Printf("WebSocket server on ws://localhost:%s/ws", port)
\tlog.Fatal(http.ListenAndServe(":"+port, nil))
}
""")
mkfile(f"{d(name)}/main_test.go", """package main

import (
\t"net/http"
\t"net/http/httptest"
\t"strings"
\t"testing"

\t"github.com/gorilla/websocket"
)

func TestHealth(t *testing.T) {
\treq := httptest.NewRequest("GET", "/health", nil)
\tw := httptest.NewRecorder()
\thealthHandler(w, req)
\tif w.Code != 200 { t.Errorf("expected 200, got %d", w.Code) }
}

func TestWebSocket(t *testing.T) {
\ts := httptest.NewServer(http.HandlerFunc(wsHandler))
\tdefer s.Close()
\tu := "ws" + strings.TrimPrefix(s.URL, "http") + "/ws"
\tc, _, err := websocket.DefaultDialer.Dial(u, nil)
\tif err != nil { t.Fatal(err) }
\tdefer c.Close()
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM golang:1.22-bookworm AS build
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM debian:bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/server .
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]

# slim
# FROM gcr.io/distroless/base-debian12 AS runtime
# COPY --from=build /app/server /server
# EXPOSE 8080
# CMD ["/server"]
""")

# 30-ws-python
name = "30-ws-python"
mkfile(f"{d(name)}/requirements.txt", """websockets==12.0
fastapi==0.111.0
uvicorn[standard]==0.30.0
""")
mkfile(f"{d(name)}/src/main.py", """import json
import os
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/health")
@app.get("/health/live")
@app.get("/health/ready")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(json.dumps({"echo": data}))
    except Exception:
        pass

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
""")
mkfile(f"{d(name)}/tests/test_health.py", """import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../src"))
from main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM python:3.12-slim-bookworm AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY src/ ./src/
ENV PORT=8080
EXPOSE 8080
CMD ["python", "src/main.py"]
""")

# 30-ws-java
name = "30-ws-java"
mkfile(f"{d(name)}/pom.xml", """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>ca.yarova</groupId>
  <artifactId>30-ws-java</artifactId>
  <version>1.0.0</version>
  <dependencies>
    <dependency>
      <groupId>org.java-websocket</groupId>
      <artifactId>Java-WebSocket</artifactId>
      <version>1.5.6</version>
    </dependency>
  </dependencies>
</project>
""")
mkfile(f"{d(name)}/src/main/java/ca/yarova/ws/Server.java", """package ca.yarova.ws;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.io.OutputStream;

public class Server extends WebSocketServer {
    public Server(int port) { super(new InetSocketAddress(port)); }

    @Override public void onOpen(WebSocket ws, ClientHandshake hs) {
        System.out.println("Client connected");
    }
    @Override public void onClose(WebSocket ws, int code, String reason, boolean remote) {}
    @Override public void onMessage(WebSocket ws, String msg) {
        ws.send("{\\\"echo\\\":\\\"" + msg + "\\\"}");
    }
    @Override public void onError(WebSocket ws, Exception ex) { ex.printStackTrace(); }
    @Override public void onStart() { System.out.println("WS server started"); }

    public static void main(String[] args) throws Exception {
        int wsPort = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        int httpPort = wsPort + 1;

        HttpServer http = HttpServer.create(new InetSocketAddress(httpPort), 0);
        http.createContext("/health", ex -> {
            byte[] b = "{\\\"status\\\":\\\"ok\\\"}".getBytes();
            ex.getResponseHeaders().add("Content-Type", "application/json");
            ex.sendResponseHeaders(200, b.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(b); }
        });
        http.start();

        Server ws = new Server(wsPort);
        ws.start();
        System.out.println("WebSocket on :" + wsPort + ", health on :" + httpPort);
    }
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM eclipse-temurin:21-jdk-bookworm AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080 8081
CMD ["java", "-jar", "app.jar"]
""")

# 30-ws-elixir
name = "30-ws-elixir"
mkfile(f"{d(name)}/mix.exs", """defmodule WsElixir.MixProject do
  use Mix.Project
  def project do
    [app: :ws_elixir, version: "1.0.0", elixir: "~> 1.16",
     deps: deps()]
  end
  def application do
    [extra_applications: [:logger], mod: {WsElixir.Application, []}]
  end
  defp deps do
    [{:plug_cowboy, "~> 2.7"}, {:jason, "~> 1.4"}]
  end
end
""")
mkfile(f"{d(name)}/lib/ws_elixir/application.ex", """defmodule WsElixir.Application do
  use Application

  def start(_type, _args) do
    port = String.to_integer(System.get_env("PORT") || "8080")
    children = [
      {Plug.Cowboy, scheme: :http, plug: WsElixir.Router, options: [
        port: port,
        dispatch: [
          {:_, [
            {"/ws", WsElixir.SocketHandler, []},
            {:_, Plug.Cowboy.Handler, {WsElixir.Router, []}}
          ]}
        ]
      ]}
    ]
    opts = [strategy: :one_for_one, name: WsElixir.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
""")
mkfile(f"{d(name)}/lib/ws_elixir/router.ex", """defmodule WsElixir.Router do
  use Plug.Router
  plug :match
  plug :dispatch

  get "/health" do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(%{status: "ok", version: "1.0.0"}))
  end

  get "/health/live" do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(%{status: "ok"}))
  end

  get "/health/ready" do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(%{status: "ok"}))
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end
end
""")
mkfile(f"{d(name)}/lib/ws_elixir/socket_handler.ex", """defmodule WsElixir.SocketHandler do
  @behaviour :cowboy_websocket

  def init(req, state), do: {:cowboy_websocket, req, state}
  def websocket_init(state), do: {:ok, state}

  def websocket_handle({:text, msg}, state) do
    {:reply, {:text, Jason.encode!(%{echo: msg})}, state}
  end
  def websocket_handle(_frame, state), do: {:ok, state}
  def websocket_info(_info, state), do: {:ok, state}
end
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM elixir:1.16-otp-26-slim AS build
WORKDIR /app
COPY mix.exs mix.lock* ./
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get
COPY lib ./lib
ENV MIX_ENV=prod
RUN mix release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl libncurses6 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/_build/prod/rel/ws_elixir .
ENV PORT=8080
EXPOSE 8080
CMD ["bin/ws_elixir", "start"]
""")

# 30-ws-rust
name = "30-ws-rust"
mkfile(f"{d(name)}/Cargo.toml", """[package]
name = "30-ws-rust"
version = "1.0.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = "0.23"
""")
mkfile(f"{d(name)}/src/main.rs", r"""use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    routing::get,
    Json, Router,
};
use serde_json::json;

async fn ws_handler(ws: WebSocketUpgrade) -> impl axum::response::IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(text) = msg {
            let _ = socket.send(Message::Text(format!(r#"{{"echo":"{}"}}"#, text))).await;
        }
    }
}

#[tokio::main]
async fn main() {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/health/live", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/health/ready", get(|| async { Json(json!({"status":"ok"})) }));

    let addr = format!("0.0.0.0:{}", port);
    println!("WebSocket server on ws://{}/ws", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM rust:1.78-bookworm AS build
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo 'fn main(){}' > src/main.rs && cargo build --release && rm src/main.rs
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/30-ws-rust ./server
ENV PORT=8080
EXPOSE 8080
CMD ["./server"]
""")

# 30-ws-dotnet
name = "30-ws-dotnet"
mkfile(f"{d(name)}/30-ws-dotnet.csproj", """<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
""")
mkfile(f"{d(name)}/Program.cs", """using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseWebSockets();

app.Map("/ws", async context => {
    if (context.WebSockets.IsWebSocketRequest) {
        var ws = await context.WebSockets.AcceptWebSocketAsync();
        var buf = new byte[4096];
        while (ws.State == WebSocketState.Open) {
            var r = await ws.ReceiveAsync(buf, CancellationToken.None);
            if (r.MessageType == WebSocketMessageType.Close) break;
            var msg = Encoding.UTF8.GetString(buf, 0, r.Count);
            var resp = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { echo = msg }));
            await ws.SendAsync(resp, WebSocketMessageType.Text, true, CancellationToken.None);
        }
        await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
    } else {
        context.Response.StatusCode = 400;
    }
});

app.MapGet("/health", () => Results.Ok(new { status = "ok", version = "1.0.0" }));
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "ok" }));

app.Run();
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim AS build
WORKDIR /app
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /publish .
ENV PORT=8080 ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "30-ws-dotnet.dll"]
""")

# 30-ws-ruby
name = "30-ws-ruby"
mkfile(f"{d(name)}/Gemfile", """source "https://rubygems.org"
gem "faye-websocket", "~> 0.11"
gem "puma", "~> 6.0"
gem "rack", "~> 3.0"
""")
mkfile(f"{d(name)}/app.rb", """require "faye/websocket"
require "json"

Faye::WebSocket.load_adapter("rack")

class App
  def call(env)
    if Faye::WebSocket.websocket?(env)
      ws = Faye::WebSocket.new(env)
      ws.on(:message) { |e| ws.send(JSON.generate({ echo: e.data })) }
      ws.rack_response
    elsif env["PATH_INFO"].start_with?("/health")
      [200, { "Content-Type" => "application/json" }, ['{"status":"ok","version":"1.0.0"}']]
    else
      [404, {}, ["Not Found"]]
    end
  end
end
""")
mkfile(f"{d(name)}/config.ru", """require_relative "app"
run App.new
""")
mkfile(f"{d(name)}/Dockerfile", """# syntax=docker/dockerfile:1.6
FROM ruby:3.3-bookworm AS build
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install

FROM ruby:3.3-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY . .
ENV PORT=9292 RACK_ENV=production
EXPOSE 9292
CMD ["bundle", "exec", "puma", "-b", "tcp://0.0.0.0:9292"]
""")

print("\nAll service directories created.")
print(f"Total services in BASE: {len(os.listdir(BASE))} directories")
