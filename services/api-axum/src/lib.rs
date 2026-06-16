//! Library root — exposes modules for integration tests.
//!
//! The binary entry point is src/main.rs.
//! Integration tests in tests/ import from this crate via `use axum_service::...`.

pub mod auth;
pub mod compliance;
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
use tower::buffer::BufferLayer;
use tower::BoxError;
use tower_http::trace::TraceLayer;
use utoipa::OpenApi;
use axum::error_handling::HandleErrorLayer;
use axum::http::header::{HeaderName, HeaderValue};

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
async fn openapi_spec() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

// The active industry profile and the controls in effect. Switch with
// COMPLIANCE_PROFILE — the controls flip at boot, no rebuild.
async fn compliance_status() -> Json<crate::compliance::Controls> {
    Json(crate::compliance::active().clone())
}

// I-17: hardening response headers on every reply.
async fn security_headers(req: axum::extract::Request, next: axum::middleware::Next) -> axum::response::Response {
    let mut res = next.run(req).await;
    let h = res.headers_mut();
    h.insert(HeaderName::from_static("x-content-type-options"), HeaderValue::from_static("nosniff"));
    h.insert(HeaderName::from_static("x-frame-options"), HeaderValue::from_static("DENY"));
    h.insert(HeaderName::from_static("referrer-policy"), HeaderValue::from_static("strict-origin-when-cross-origin"));
    res
}

pub fn app(pool: Option<PgPool>) -> Router {
    // Health routes — no rate limiting, always reachable by k8s probes.
    // Built inline per branch: a shared binding would let the Some branch
    // infer PgPool state and poison the None branch's return type.

    // Rate-limited routes — tower RateLimitLayer made Clone via Buffer.
    // 100 requests per 60 seconds (global, not per-IP).
    // HandleErrorLayer maps the Buffer/limit BoxError back to a 429 so the
    // stack stays Infallible, which Axum's router requires.
    // For per-IP limiting in production, use a middleware with IP-keyed buckets.
    // Built inline per branch: a shared value would tie the inner-service
    // type to one router's state and break the other branch.

    match pool {
        Some(p) => {
            let health_routes = Router::new()
                .route("/health", get(health))
                .route("/health/live", get(liveness));

            let limited = Router::new()
                .route("/", get(hello))
                .merge(routes::auth::router())
                .merge(routes::users::router())
                .layer(
                    ServiceBuilder::new()
                        .layer(HandleErrorLayer::new(|_: BoxError| async {
                            StatusCode::TOO_MANY_REQUESTS
                        }))
                        .layer(BufferLayer::new(1024))
                        .layer(RateLimitLayer::new(100, Duration::from_secs(60))),
                );

            let ready = Router::new()
                .route("/health/ready", get(readiness_handler))
                .with_state(p.clone());

            Router::new()
                .merge(limited)
                .merge(health_routes)
                .merge(ready)
                .route("/docs.json", get(openapi_spec))
                .route("/compliance", get(compliance_status))
                .layer(axum::middleware::from_fn(security_headers))
                .layer(TraceLayer::new_for_http())
                .with_state(p)
        }
        None => {
            let health_routes = Router::new()
                .route("/health", get(health))
                .route("/health/live", get(liveness));

            let limited = Router::new()
                .route("/", get(hello))
                .layer(
                    ServiceBuilder::new()
                        .layer(HandleErrorLayer::new(|_: BoxError| async {
                            StatusCode::TOO_MANY_REQUESTS
                        }))
                        .layer(BufferLayer::new(1024))
                        .layer(RateLimitLayer::new(100, Duration::from_secs(60))),
                );

            Router::new()
                .merge(limited)
                .merge(health_routes)
                .route("/health/ready", get(readiness_no_db))
                .route("/docs.json", get(openapi_spec))
                .route("/compliance", get(compliance_status))
                .layer(axum::middleware::from_fn(security_headers))
                .layer(TraceLayer::new_for_http())
        }
    }
}
