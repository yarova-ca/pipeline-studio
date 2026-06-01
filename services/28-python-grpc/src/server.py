import grpc
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
