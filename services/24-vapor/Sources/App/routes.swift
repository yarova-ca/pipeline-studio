import Vapor

func routes(_ app: Application) throws {
    app.get {_ in
        return ["message": "Hello from Vapor 4.121", "framework": "24-vapor", "version": "1.0.0"]
    }

    app.get("health") {_ in
        return ["status": "ok", "version": "1.0.0"]
    }

    app.get("health", "live") {_ in
        return ["status": "ok"]
    }

    app.get("health", "ready") {_ in
        return ["status": "ok"]
    }
}
