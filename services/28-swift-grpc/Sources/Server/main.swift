import GRPC
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

        print("gRPC server on :\(grpcPort)")
        try await server.onClose.get()
    }
}
