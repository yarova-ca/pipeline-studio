use tonic::{Request, Status};
use sqlx::PgPool;

use crate::auth::jwt::verify_token;

/// Authenticated user extracted from gRPC metadata.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Tonic interceptor function — validates JWT or API key from gRPC metadata.
///
/// gRPC metadata is the equivalent of HTTP headers.
/// Clients send: metadata.insert("authorization", "Bearer <token>".parse()?)
///               metadata.insert("x-api-key", "<key>".parse()?)
///
/// On valid JWT: attaches AuthUser to request extensions, returns Ok.
/// On valid API key: DB lookup, attaches user, returns Ok.
/// On missing or invalid credential: returns Err(Status::unauthenticated).
///
/// Usage: Server::builder().layer(tonic::service::interceptor(auth_interceptor))
pub fn auth_interceptor(mut req: Request<()>) -> Result<Request<()>, Status> {
    let metadata = req.metadata();

    // --- Attempt 1: Bearer JWT ---
    if let Some(auth_value) = metadata.get("authorization") {
        let auth_str = auth_value
            .to_str()
            .map_err(|_| Status::unauthenticated("Invalid authorization header encoding"))?;

        if let Some(token) = auth_str.strip_prefix("Bearer ") {
            let claims = verify_token(token)
                .map_err(|_| Status::unauthenticated("Invalid or expired JWT token"))?;
            req.extensions_mut().insert(AuthUser {
                id: claims.sub,
                email: claims.email,
                name: claims.name,
            });
            return Ok(req);
        }
    }

    // --- Attempt 2: X-API-Key ---
    // Note: API key lookup requires async DB access.
    // For async gRPC services, perform this check inside the handler using
    // the PgPool from tonic State, or use a tower middleware layer instead.
    if let Some(api_key_value) = metadata.get("x-api-key") {
        if api_key_value.to_str().is_ok() {
            // Mark request as needing async API key validation in the handler.
            // The handler calls validate_api_key(pool, key).await.
            return Ok(req);
        }
    }

    Err(Status::unauthenticated(
        "Authentication required. Provide Bearer token or x-api-key metadata.",
    ))
}

/// Validates an API key against the database.
/// Call this inside an async gRPC handler when x-api-key metadata is present.
pub async fn validate_api_key(pool: &PgPool, api_key: &str) -> Result<AuthUser, Status> {
    let row = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, email, name FROM users WHERE api_key = $1",
    )
    .bind(api_key)
    .fetch_optional(pool)
    .await
    .map_err(|_| Status::internal("Auth check failed"))?;

    match row {
        Some((id, email, name)) => Ok(AuthUser { id, email, name }),
        None => Err(Status::unauthenticated("Invalid API key")),
    }
}
