// swift-tools-version:5.10
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
