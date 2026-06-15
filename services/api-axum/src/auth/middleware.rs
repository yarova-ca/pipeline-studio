use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use sqlx::PgPool;

use crate::auth::jwt::verify_token;

/// Authenticated user injected into handlers via the `RequireAuth` extractor.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Axum extractor — validates auth on every request that declares it.
///
/// Resolution order:
/// 1. `Authorization: Bearer <JWT>` header → verify JWT.
/// 2. `X-API-Key: <key>` header → DB lookup.
///
/// When neither header is present: 401.
/// When header is present but invalid: 401.
impl FromRequestParts<PgPool> for AuthUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        pool: &PgPool,
    ) -> Result<Self, Self::Rejection> {
        // --- attempt 1: Bearer JWT ---
        if let Some(bearer) = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
        {
            let claims = verify_token(bearer).map_err(|_| StatusCode::UNAUTHORIZED)?;
            return Ok(AuthUser {
                id: claims.sub,
                email: claims.email,
                name: claims.name,
            });
        }

        // --- attempt 2: X-API-Key header → DB lookup ---
        if let Some(api_key) = parts
            .headers
            .get("X-API-Key")
            .and_then(|v| v.to_str().ok())
        {
            let row = sqlx::query_as::<_, (String, String, String)>(
                "SELECT id, email, name FROM users WHERE api_key = $1",
            )
            .bind(api_key)
            .fetch_optional(pool)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            if let Some((id, email, name)) = row {
                return Ok(AuthUser { id, email, name });
            }
        }

        Err(StatusCode::UNAUTHORIZED)
    }
}
