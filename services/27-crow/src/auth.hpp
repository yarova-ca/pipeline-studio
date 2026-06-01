#pragma once
#include <string>
#include <optional>

// AuthUser — claims extracted from a verified JWT.
struct AuthUser {
    std::string id;
    std::string email;
    std::string name;
};

// verify_token — extracts and verifies the Bearer token from an Authorization header.
// Returns the decoded AuthUser when the token is valid and not expired.
// Returns nullopt when the header is missing, malformed, or carries an invalid token.
std::optional<AuthUser> verify_token(const std::string& auth_header);

// sign_token — creates a signed HS256 JWT for the given user.
// Token expires in 8 hours.
// JWT_SECRET env var is used as the signing secret; falls back to "dev-secret".
std::string sign_token(
    const std::string& user_id,
    const std::string& email,
    const std::string& name
);
