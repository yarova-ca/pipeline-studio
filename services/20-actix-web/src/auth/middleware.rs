use actix_web::{
    dev::Payload,
    error::ErrorUnauthorized,
    web::Data,
    Error, FromRequest, HttpRequest,
};
use futures::future::{ready, Ready};
use sqlx::PgPool;

use crate::auth::jwt::verify_token;

/// Authenticated user injected into handlers via the `AuthUser` extractor.
///
/// Resolution order:
/// 1. `Authorization: Bearer <JWT>` header → verify JWT.
/// 2. `X-API-Key: <key>` header → DB lookup (actix-web does not support async
///    FromRequest natively; DB check uses block_in_place here for compatibility).
/// When neither header is present: 401.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub email: String,
    pub name: String,
}

impl FromRequest for AuthUser {
    type Error = Error;
    type Future = Ready<Result<Self, Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        // Attempt 1: Bearer JWT.
        if let Some(bearer) = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
        {
            return match verify_token(bearer) {
                Ok(claims) => ready(Ok(AuthUser {
                    id: claims.sub,
                    email: claims.email,
                    name: claims.name,
                })),
                Err(_) => ready(Err(ErrorUnauthorized("Invalid token"))),
            };
        }

        // Attempt 2: X-API-Key header → synchronous DB lookup via block_in_place.
        if let Some(api_key) = req
            .headers()
            .get("X-API-Key")
            .and_then(|v| v.to_str().ok())
        {
            if let Some(pool) = req.app_data::<Data<PgPool>>() {
                let pool = pool.get_ref().clone();
                let api_key = api_key.to_owned();

                let result = tokio::task::block_in_place(|| {
                    tokio::runtime::Handle::current().block_on(async {
                        sqlx::query_as::<_, (String, String, String)>(
                            "SELECT id, email, name FROM users WHERE api_key = $1",
                        )
                        .bind(&api_key)
                        .fetch_optional(&pool)
                        .await
                    })
                });

                match result {
                    Ok(Some((id, email, name))) => {
                        return ready(Ok(AuthUser { id, email, name }));
                    }
                    Ok(None) => return ready(Err(ErrorUnauthorized("Invalid API key"))),
                    Err(_) => return ready(Err(ErrorUnauthorized("DB error"))),
                }
            }
        }

        ready(Err(ErrorUnauthorized("Unauthorized")))
    }
}
