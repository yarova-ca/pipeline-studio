import Vapor
import Fluent
import JWT

// Protected CRUD routes for Items.
// All routes require a valid JWT in the Authorization: Bearer header.
func userItemsRoutes(_ app: Application) throws {
    let protected = app.grouped(JWTAuthMiddleware())
    let items = protected.grouped("items")

    struct ItemRequest: Content { var title: String }

    // GET /items — list all items for the authenticated user.
    items.get { req async throws -> [Item] in
        let payload = try req.jwt.verify(as: UserPayload.self)
        return try await Item.query(on: req.db)
            .filter(\.$userId == UUID(uuidString: payload.id)!)
            .all()
    }

    // POST /items — create a new item for the authenticated user.
    items.post { req async throws -> Item in
        let payload = try req.jwt.verify(as: UserPayload.self)
        let body = try req.content.decode(ItemRequest.self)
        let item = Item(title: body.title, userId: UUID(uuidString: payload.id)!)
        try await item.save(on: req.db)
        return item
    }

    // DELETE /items/:id — delete an item owned by the authenticated user.
    items.delete(":id") { req async throws -> HTTPStatus in
        let payload = try req.jwt.verify(as: UserPayload.self)
        guard let itemId = req.parameters.get("id", as: UUID.self),
              let item = try await Item.find(itemId, on: req.db),
              item.userId == UUID(uuidString: payload.id)!
        else {
            throw Abort(.notFound)
        }
        try await item.delete(on: req.db)
        return .noContent
    }
}
