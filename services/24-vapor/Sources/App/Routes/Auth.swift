import Vapor
import Fluent

// POST /auth/register — create a new user account
// POST /auth/login    — exchange credentials for a JWT
func authRoutes(_ app: Application) throws {
    let auth = app.grouped("auth")

    struct RegisterRequest: Content {
        var email: String
        var name: String
        var password: String
    }

    struct LoginRequest: Content {
        var email: String
        var password: String
    }

    struct TokenResponse: Content {
        var token: String
    }

    // Register: hash password, persist user, return JWT.
    auth.post("register") { req async throws -> TokenResponse in
        let body = try req.content.decode(RegisterRequest.self)
        let hash = try await req.password.async.hash(body.password)
        let user = User(email: body.email, name: body.name, passwordHash: hash)
        try await user.save(on: req.db)
        let token = try req.application.signToken(
            userId: user.id!.uuidString,
            email: user.email,
            name: user.name
        )
        return TokenResponse(token: token)
    }

    // Login: verify password hash, return JWT.
    auth.post("login") { req async throws -> TokenResponse in
        let body = try req.content.decode(LoginRequest.self)
        guard let user = try await User.query(on: req.db)
            .filter(\.$email == body.email)
            .first()
        else {
            throw Abort(.unauthorized, reason: "Invalid credentials")
        }
        let valid = try await req.password.async.verify(body.password, created: user.passwordHash)
        guard valid else { throw Abort(.unauthorized, reason: "Invalid credentials") }
        let token = try req.application.signToken(
            userId: user.id!.uuidString,
            email: user.email,
            name: user.name
        )
        return TokenResponse(token: token)
    }
}
