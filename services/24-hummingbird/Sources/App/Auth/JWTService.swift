import Foundation
import JWTKit

// UserPayload — JWT claims stored in each token.
// exp: expiration — token rejected after 8 hours.
struct UserPayload: JWTPayload {
    var id: String
    var email: String
    var name: String
    var exp: ExpirationClaim

    func verify(using _: some JWTAlgorithm) throws {
        try exp.verifyNotExpired()
    }
}

// JWTService — signs and verifies tokens using HS256.
// Secret loaded from JWT_SECRET env var at startup.
struct JWTService {
    private let keyCollection: JWTKeyCollection

    init() async throws {
        let secret = ProcessInfo.processInfo.environment["JWT_SECRET"] ?? "dev-secret"
        keyCollection = JWTKeyCollection()
        await keyCollection.add(hmac: .init(from: secret.utf8), digestAlgorithm: .sha256)
    }

    func sign(userId: String, email: String, name: String) async throws -> String {
        let payload = UserPayload(
            id: userId,
            email: email,
            name: name,
            exp: .init(value: Date().addingTimeInterval(8 * 3600))
        )
        return try await keyCollection.sign(payload)
    }

    func verify(token: String) async throws -> UserPayload {
        try await keyCollection.verify(token, as: UserPayload.self)
    }
}
