import * as grpc from "@grpc/grpc-js";
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
