#include "crow.h"
#include <cstdlib>

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/")([] {
        crow::json::wvalue body;
        body["message"] = "Hello from Crow 1.3.2";
        body["framework"] = "27-crow";
        body["version"] = "1.0.0";
        return crow::response(body);
    });

    CROW_ROUTE(app, "/health")([] {
        crow::json::wvalue body;
        body["status"] = "ok";
        body["version"] = "1.0.0";
        return crow::response(body);
    });

    CROW_ROUTE(app, "/health/live")([] {
        crow::json::wvalue body; body["status"] = "ok";
        return crow::response(body);
    });

    CROW_ROUTE(app, "/health/ready")([] {
        crow::json::wvalue body; body["status"] = "ok";
        return crow::response(body);
    });

    int port = std::atoi(std::getenv("PORT") ? std::getenv("PORT") : "8080");
    app.port(port).multithreaded().run();
    return 0;
}
