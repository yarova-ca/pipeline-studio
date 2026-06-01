@testable import App
import XCTVapor
import Testing

@Suite("24-vapor health tests")
struct HealthTests {
    @Test("GET / returns hello")
    func testHello() async throws {
        let app = try await Application.make(.testing)
        defer { app.shutdown() }
        try configure(app)
        try await app.test(.GET, "/") { res async in
            #expect(res.status == .ok)
        }
    }

    @Test("GET /health returns ok")
    func testHealth() async throws {
        let app = try await Application.make(.testing)
        defer { app.shutdown() }
        try configure(app)
        try await app.test(.GET, "/health") { res async in
            #expect(res.status == .ok)
        }
    }
}
