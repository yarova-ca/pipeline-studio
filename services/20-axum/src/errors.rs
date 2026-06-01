use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

/// Unified error type for all handlers.
///
/// Every variant maps to a stable HTTP status code and a JSON body.
#[derive(Debug)]
pub enum AppError {
    /// 401 — missing or invalid credentials.
    Unauthorized,
    /// 404 — resource not found.
    NotFound(String),
    /// 400 — caller supplied bad input.
    BadRequest(String),
    /// 500 — internal failure (DB, external service, etc.).
    Internal(String),
}

impl AppError {
    /// Convenience constructor for 500 errors.
    pub fn internal(msg: &str) -> Self {
        AppError::Internal(msg.to_owned())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_owned()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => {
                tracing::error!("internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_owned())
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        match e {
            sqlx::Error::RowNotFound => AppError::NotFound("record not found".to_owned()),
            other => AppError::internal(&other.to_string()),
        }
    }
}
