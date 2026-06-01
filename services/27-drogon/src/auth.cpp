#include "auth.hpp"
#include <jwt-cpp/jwt.h>
#include <cstdlib>
#include <chrono>
#include <stdexcept>

static std::string get_secret() {
    const char* env = std::getenv("JWT_SECRET");
    return env ? std::string(env) : "dev-secret";
}

std::string sign_token(
    const std::string& user_id,
    const std::string& email,
    const std::string& name)
{
    using namespace std::chrono;
    auto now     = system_clock::now();
    auto expires = now + hours(8);

    return jwt::create()
        .set_type("JWT")
        .set_payload_claim("id",    jwt::claim(user_id))
        .set_payload_claim("email", jwt::claim(email))
        .set_payload_claim("name",  jwt::claim(name))
        .set_expires_at(expires)
        .sign(jwt::algorithm::hs256{get_secret()});
}

std::optional<AuthUser> verify_token(const std::string& auth_header) {
    // Expect format: "Bearer <token>"
    if (auth_header.size() < 8 || auth_header.substr(0, 7) != "Bearer ") {
        return std::nullopt;
    }
    const std::string token = auth_header.substr(7);
    try {
        auto verifier = jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{get_secret()})
            .with_type("JWT");

        auto decoded = jwt::decode(token);
        verifier.verify(decoded);

        AuthUser user;
        user.id    = decoded.get_payload_claim("id").as_string();
        user.email = decoded.get_payload_claim("email").as_string();
        user.name  = decoded.get_payload_claim("name").as_string();
        return user;
    } catch (...) {
        return std::nullopt;
    }
}
