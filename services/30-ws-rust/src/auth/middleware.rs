use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use sqlx::PgPool;

use crate::auth::jwt::verify_token;

/// Authenticated user attached to WebSocket upgrade handlers via Axum extractors.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
}

/// Axum extractor — validates auth on the HTTP upgrade request.
///
/// WebSocket clients cannot set custom headers in browser WebSocket API.
/// Two auth paths are supported:
///
/// 1. `Authorization: Bearer <JWT>` header — for server-side / native clients.
/// 2. `?token=<JWT>` query parameter — for browser WebSocket clients.
///
/// When neither header nor token param is present: 401.
/// When provided but invalid: 401.
impl FromRequestParts<PgPool> for AuthUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        _pool: &PgPool,
    ) -> Result<Self, Self::Rejection> {
        // --- attempt 1: Bearer JWT in header (server clients) ---
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

        // --- attempt 2: ?token= query parameter (browser WebSocket clients) ---
        if let Some(query) = parts.uri.query() {
            for (key, value) in url::form_urlencoded::parse(query.as_bytes()) {
                if key == "token" {
                    let claims = verify_token(&value).map_err(|_| StatusCode::UNAUTHORIZED)?;
                    return Ok(AuthUser {
                        id: claims.sub,
                        email: claims.email,
                        name: claims.name,
                    });
                }
            }
        }

        Err(StatusCode::UNAUTHORIZED)
    }
}
