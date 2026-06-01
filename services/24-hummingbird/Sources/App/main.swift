import Hummingbird
import Foundation

@main
struct App {
    static func main() async throws {
        let port = Int(ProcessInfo.processInfo.environment["PORT"] ?? "8080") ?? 8080
        let router = Router()

        router.get("/") { _, _ in
            return ["message": "Hello from Hummingbird 2.0", "framework": "24-hummingbird", "version": "1.0.0"]
        }

        router.get("/health") { _, _ in
            return ["status": "ok", "version": "1.0.0"]
        }

        router.get("/health/live") { _, _ in
            return ["status": "ok"]
        }

        router.get("/health/ready") { _, _ in
            return ["status": "ok"]
        }

        let app = Application(router: router, configuration: .init(address: .hostname("0.0.0.0", port: port)))
        print("Hummingbird running on port \(port)")
        try await app.runService()
    }
}
