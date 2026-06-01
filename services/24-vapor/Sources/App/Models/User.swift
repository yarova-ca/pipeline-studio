import Fluent
import Vapor

// User — persisted in the `users` table via Fluent ORM.
// Passwords are bcrypt-hashed before storage.
final class User: Model, Content, @unchecked Sendable {
    static let schema = "users"

    @ID(key: .id) var id: UUID?
    @Field(key: "email") var email: String
    @Field(key: "name") var name: String
    @Field(key: "password_hash") var passwordHash: String

    init() {}

    init(id: UUID? = nil, email: String, name: String, passwordHash: String) {
        self.id = id
        self.email = email
        self.name = name
        self.passwordHash = passwordHash
    }
}

// Migration creates the users table on first run.
struct CreateUser: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("users")
            .id()
            .field("email", .string, .required)
            .field("name", .string, .required)
            .field("password_hash", .string, .required)
            .unique(on: "email")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("users").delete()
    }
}
