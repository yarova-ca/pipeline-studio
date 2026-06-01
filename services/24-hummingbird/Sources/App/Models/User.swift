// User model for Hummingbird + PostgreSQL.
// Uses raw SQL via PostgresNIO — no ORM abstraction layer.
struct User: Codable, Sendable {
    var id: UUID
    var email: String
    var name: String
    var passwordHash: String

    // SQL to create the users table on first run.
    static let createTableSQL = """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL
        );
        """
}

// Item model — owned by a User.
struct Item: Codable, Sendable {
    var id: UUID
    var title: String
    var userId: UUID

    // SQL to create the items table on first run.
    static let createTableSQL = """
        CREATE TABLE IF NOT EXISTS items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
        );
        """
}
