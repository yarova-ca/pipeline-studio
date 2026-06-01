import Vapor

public func configure(_ app: Application) throws {
    app.http.server.configuration.port = Int(Environment.get("PORT") ?? "8080") ?? 8080
    try routes(app)
}
