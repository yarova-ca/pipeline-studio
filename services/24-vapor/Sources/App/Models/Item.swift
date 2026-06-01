import Fluent
import Vapor

// Item — a resource owned by a User, persisted in the `items` table.
final class Item: Model, Content, @unchecked Sendable {
    static let schema = "items"

    @ID(key: .id) var id: UUID?
    @Field(key: "title") var title: String
    @Field(key: "user_id") var userId: UUID

    init() {}

    init(id: UUID? = nil, title: String, userId: UUID) {
        self.id = id
        self.title = title
        self.userId = userId
    }
}

// Migration creates the items table on first run.
struct CreateItem: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("items")
            .id()
            .field("title", .string, .required)
            .field("user_id", .uuid, .required)
            .foreignKey("user_id", references: "users", "id", onDelete: .cascade)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("items").delete()
    }
}
