#include <drogon/drogon.h>
#include <cstdlib>
#include <string>

int main() {
    int port = std::atoi(std::getenv("PORT") ? std::getenv("PORT") : "8080");

    drogon::app()
        .addListener("0.0.0.0", port)
        .registerHandler(
            "/",
            [](const drogon::HttpRequestPtr& req,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {
                auto resp = drogon::HttpResponse::newHttpJsonResponse(
                    Json::Value{} );
                Json::Value body;
                body["message"] = "Hello from Drogon 1.9.13";
                body["framework"] = "27-drogon";
                body["version"] = "1.0.0";
                resp = drogon::HttpResponse::newHttpJsonResponse(body);
                cb(resp);
            },
            {drogon::HttpMethod::Get})
        .registerHandler(
            "/health",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {
                Json::Value body;
                body["status"] = "ok";
                body["version"] = "1.0.0";
                cb(drogon::HttpResponse::newHttpJsonResponse(body));
            },
            {drogon::HttpMethod::Get})
        .registerHandler(
            "/health/live",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {
                Json::Value body; body["status"] = "ok";
                cb(drogon::HttpResponse::newHttpJsonResponse(body));
            },
            {drogon::HttpMethod::Get})
        .registerHandler(
            "/health/ready",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& cb) {
                Json::Value body; body["status"] = "ok";
                cb(drogon::HttpResponse::newHttpJsonResponse(body));
            },
            {drogon::HttpMethod::Get})
        .run();

    return 0;
}
