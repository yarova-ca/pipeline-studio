//! Request extractors with explicit error mapping.
//!
//! I-6: unknown/extra JSON fields must be rejected with HTTP 400.
//!
//! Axum 0.8's built-in `Json` extractor returns 422 (Unprocessable Entity) for
//! deserialization failures — including the `deny_unknown_fields` error — and
//! 400 only for malformed JSON syntax. The platform invariant requires 400 for
//! a rejected body. `ValidatedJson` wraps `axum::Json` and maps EVERY rejection
//! (syntax, type, unknown field, missing content-type) to `AppError::BadRequest`,
//! which renders as 400.

use axum::{
    extract::{rejection::JsonRejection, FromRequest, Request},
    Json,
};
use serde::de::DeserializeOwned;

use crate::errors::AppError;

/// JSON body extractor that rejects any invalid body with 400.
pub struct ValidatedJson<T>(pub T);

impl<S, T> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        match Json::<T>::from_request(req, state).await {
            Ok(Json(value)) => Ok(ValidatedJson(value)),
            Err(rejection) => Err(map_rejection(rejection)),
        }
    }
}

/// Map any JSON rejection to a 400 with a stable message.
fn map_rejection(rejection: JsonRejection) -> AppError {
    AppError::BadRequest(format!("invalid request body: {rejection}"))
}
