//! Library root — exposes modules for integration tests.
//!
//! The binary entry point is src/main.rs.
//! Integration tests in tests/ import from this crate via `use axum_service::...`.

pub mod auth;
pub mod db;
pub mod errors;
pub mod routes;

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

async fn hello() -> Json<Value> {
    Json(json!({
        "message": "Hello from Axum 0.8",
        "framework": "20-axum",
        "version": "1.0.0"
    }))
}

async fn health() -> Json<Value> {
    Json(json!({"status": "ok", "version": "1.0.0"}))
}

async fn liveness() -> Json<Value> {
    Json(json!({"status": "ok"}))
}

async fn readiness() -> Json<Value> {
    Json(json!({"status": "ok"}))
}

fn base_routes() -> Router<sqlx::PgPool> {
    Router::new()
        .route("/", get(hello))
        .route("/health", get(health))
        .route("/health/live", get(liveness))
        .route("/health/ready", get(readiness))
}

/// Build the application router.
///
/// When `pool` is `None` (unit tests, no DB): only the base health/hello routes are mounted.
/// State is filled with a dummy pool that is never used for those routes.
/// When `pool` is `Some`: auth and user routes are also mounted.
pub fn app(pool: Option<sqlx::PgPool>) -> Router {
    match pool {
        Some(p) => base_routes()
            .merge(routes::auth::router())
            .merge(routes::users::router())
            .with_state(p),
        None => {
            // No DB: mount only base health routes with no-state.
            // These handlers don't extract State so they compile fine.
            Router::new()
                .route("/", get(hello))
                .route("/health", get(health))
                .route("/health/live", get(liveness))
                .route("/health/ready", get(readiness))
        }
    }
}
