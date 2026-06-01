package ca.yarova.grpc;

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
            byte[] body = "{\"status\":\"ok\"}".getBytes();
            ex.getResponseHeaders().add("Content-Type", "application/json");
            ex.sendResponseHeaders(200, body.length);
            try (OutputStream os = ex.getResponseBody()) { os.write(body); }
        });
        httpServer.start();
        System.out.println("HTTP health sidecar on :" + httpPort);

        grpcServer.awaitTermination();
    }
}
