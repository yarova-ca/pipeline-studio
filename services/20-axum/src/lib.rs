//! Library root — exposes modules for integration tests.
//!
//! The binary entry point is src/main.rs.
//! Integration tests in tests/ import from this crate via `use axum_service::...`.

pub mod auth;
pub mod db;
pub mod errors;
pub mod routes;

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde_json::{json, Value};
use sqlx::PgPool;
use std::time::Duration;
use tower::ServiceBuilder;
use tower::limit::RateLimitLayer;
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

// ── OpenAPI definition ────────────────────────────────────────────────────────
#[derive(OpenApi)]
#[openapi(
    info(title = "Axum Service API", version = "1.0.0"),
    paths(hello, health, liveness, readiness_handler),
)]
struct ApiDoc;

#[utoipa::path(
    get,
    path = "/",
    responses((status = 200, description = "Hello"))
)]
async fn hello() -> Json<Value> {
    Json(json!({
        "message": "Hello from Axum 0.8",
        "framework": "20-axum",
        "version": "1.0.0"
    }))
}

#[utoipa::path(
    get,
    path = "/health",
    responses((status = 200, description = "Liveness check"))
)]
async fn health() -> Json<Value> {
    Json(json!({"status": "ok", "version": "1.0.0"}))
}

#[utoipa::path(
    get,
    path = "/health/live",
    responses((status = 200, description = "Kubernetes liveness probe"))
)]
async fn liveness() -> Json<Value> {
    Json(json!({"status": "ok"}))
}

/// DB-checking readiness probe.
/// Returns 503 when the database is unreachable so k8s removes the pod
/// from the load balancer until the connection recovers.
#[utoipa::path(
    get,
    path = "/health/ready",
    responses(
        (status = 200, description = "DB connected"),
        (status = 503, description = "DB disconnected"),
    )
)]
async fn readiness_handler(State(pool): State<PgPool>) -> impl IntoResponse {
    match sqlx::query("SELECT 1").execute(&pool).await {
        Ok(_) => (StatusCode::OK, Json(json!({"status": "ok", "db": "connected"}))),
        Err(e) => {
            tracing::error!(err = %e, "health/ready db check failed");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "error", "db": "disconnected"})),
            )
        }
    }
}

async fn readiness_no_db() -> Json<Value> {
    Json(json!({"status": "ok", "db": "not configured"}))
}

/// Build the application router.
///
/// When `pool` is `None` (unit tests, no DB): only the base health/hello routes are mounted.
/// When `pool` is `Some`: auth, user, and readiness-with-DB routes are also mounted.
///
/// Rate limiting: 100 requests per 60 seconds (global, process-wide via tower).
/// Health and docs routes are not behind the rate limiter so k8s probes pass.
pub fn app(pool: Option<PgPool>) -> Router {
    let swagger = SwaggerUi::new("/docs")
        .url("/docs.json", ApiDoc::openapi());

    // Health routes — no rate limiting, always reachable by k8s probes.
    let health_routes = Router::new()
        .route("/health", get(health))
        .route("/health/live", get(liveness));

    // Rate-limited routes — wrapped with tower RateLimitLayer.
    // 100 requests per 60 seconds (global, not per-IP).
    // For per-IP limiting in production, use a middleware with IP-keyed buckets.
    let rate_limit = ServiceBuilder::new()
        .layer(RateLimitLayer::new(100, Duration::from_secs(60)));

    match pool {
        Some(p) => {
            let limited = Router::new()
                .route("/", get(hello))
                .merge(routes::auth::router())
                .merge(routes::users::router())
                .layer(rate_limit);

            let ready = Router::new()
                .route("/health/ready", get(readiness_handler))
                .with_state(p.clone());

            Router::new()
                .merge(limited)
                .merge(health_routes)
                .merge(ready)
                .merge(swagger)
                .layer(TraceLayer::new_for_http())
                .with_state(p)
        }
        None => {
            let limited = Router::new()
                .route("/", get(hello))
                .layer(rate_limit);

            Router::new()
                .merge(limited)
                .merge(health_routes)
                .route("/health/ready", get(readiness_no_db))
                .merge(swagger)
                .layer(TraceLayer::new_for_http())
        }
    }
}
