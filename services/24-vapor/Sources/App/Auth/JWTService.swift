import JWT
import Vapor

// UserPayload — the JWT claims stored in each token.
// exp: expiration claim — token rejected after 8 hours.
struct UserPayload: JWTPayload {
    var id: String
    var email: String
    var name: String
    var exp: ExpirationClaim

    func verify(using _: some JWTAlgorithm) throws {
        try exp.verifyNotExpired()
    }
}

extension Application {
    // Signs a JWT for the given user. Expires in 8 hours.
    func signToken(userId: String, email: String, name: String) throws -> String {
        let payload = UserPayload(
            id: userId,
            email: email,
            name: name,
            exp: .init(value: Date().addingTimeInterval(8 * 3600))
        )
        return try jwt.signers.sign(payload)
    }
}

// Middleware: rejects requests missing a valid Bearer token.
struct JWTAuthMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        guard let authHeader = request.headers.bearerAuthorization else {
            throw Abort(.unauthorized, reason: "Missing Authorization header")
        }
        let _: UserPayload = try await request.jwt.verify(authHeader.token)
        return try await next.respond(to: request)
    }
}
