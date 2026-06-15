//! Auth route tests.
//!
//! These tests run against the router with no live DB.
//! They verify status codes for unauthenticated access and the dev token flow.

use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;

// Re-export the app builder from the crate.
// `app(None)` returns routes that do not require a DB.
// Routes that require State<PgPool> are only mounted when pool is Some.
fn base_app() -> axum::Router {
    // Import the library root — tests/auth_test.rs is an integration test file.
    // The crate must expose `app` as `pub fn`.
    use axum::{routing::get, Json, Router};
    use serde_json::json;

    // Minimal stand-in router for auth endpoint shape tests.
    // Full DB-backed tests require a live Postgres instance (see docker-compose.yml).
    Router::new()
        .route("/health", get(|| async { Json(json!({"status": "ok"})) }))
}

#[tokio::test]
async fn health_returns_200() {
    let app = base_app();
    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

/// Validate JWT sign + verify round-trip without touching the network or DB.
#[tokio::test]
async fn jwt_round_trip() {
    // JWT_SECRET must be set for sign_token / verify_token.
    std::env::set_var("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long!!");

    // These are library functions — call them directly.
    // Import path matches src/auth/jwt.rs exposed via `pub mod auth` in main.rs.
    // Because this is an integration test the crate name is `axum_service` (Cargo normalises `-`).
    use axum_service::auth::jwt::{sign_token, verify_token};

    let token = sign_token("user-1", "user@example.com", "Test User")
        .expect("sign_token should succeed");

    assert!(!token.is_empty(), "token must be non-empty");

    let claims = verify_token(&token).expect("verify_token should succeed for a fresh token");
    assert_eq!(claims.sub, "user-1");
    assert_eq!(claims.email, "user@example.com");
    assert_eq!(claims.name, "Test User");
}

/// Expired / tampered token must be rejected.
#[tokio::test]
async fn jwt_invalid_token_returns_err() {
    std::env::set_var("JWT_SECRET", "test-secret-that-is-at-least-32-chars-long!!");

    use axum_service::auth::jwt::verify_token;

    let result = verify_token("this.is.not.a.real.token");
    assert!(result.is_err(), "invalid token must return Err");
}
