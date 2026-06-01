package ca.yarova.grpc

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
