// swift-tools-version:5.10
import PackageDescription
let package = Package(
  name: "28-swift-grpc",
  platforms: [.macOS(.v14)],
  dependencies: [
    .package(url: "https://github.com/grpc/grpc-swift.git", from: "2.0.0"),
    .package(url: "https://github.com/vapor/postgres-nio.git", from: "1.21.0"),
  ],
  targets: [
    .executableTarget(name: "Server", dependencies: [
      .product(name: "GRPC", package: "grpc-swift"),
      .product(name: "PostgresNIO", package: "postgres-nio"),
    ], path: "Sources/Server"),
  ]
)
