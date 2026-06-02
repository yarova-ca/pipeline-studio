import PostgresNIO
import NIOPosix

// Database configuration for Swift gRPC service.
// PostgresNIO: async PostgreSQL driver for Swift — no ORM overhead.
struct DatabaseConfig {
    static func createPool(eventLoop: EventLoopGroup) -> PostgresConnectionPool {
        let config = PostgresConnection.Configuration(
            host: ProcessInfo.processInfo.environment["DB_HOST"] ?? "localhost",
            port: 5432,
            username: ProcessInfo.processInfo.environment["DB_USER"] ?? "app",
            password: ProcessInfo.processInfo.environment["DB_PASSWORD"] ?? "devpassword",
            database: ProcessInfo.processInfo.environment["DB_NAME"] ?? "app"
        )
        return try! PostgresConnectionPool(configuration: config, maxConnections: 10, eventLoop: eventLoop)
    }
}
