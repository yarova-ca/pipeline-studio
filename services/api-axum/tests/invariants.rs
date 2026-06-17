//! Yarova platform INVARIANT TEST SUITE — api-axum (golden service "20-axum").
//!
//! Each test maps to one platform invariant by I-id and proves the running app
//! upholds it. The app's real `Router` is built and driven with tower `oneshot`.
//!
//! Coverage map:
//! - I-3  : protected route, no Authorization header        -> 401
//! - I-4  : protected route, garbage/tampered Bearer token   -> 401
//! - I-6  : protected route, valid token + unknown JSON field -> 400
//! - I-10 : GET /health/live                                 -> 200
//! - I-13 : GET /metrics -> 200 + body has http_request_duration_seconds
//! - I-17 : response carries x-content-type-options: nosniff
//!
//! DB note: protected routes mount only in `app(Some(pool))`. We build a LAZY
//! pool (`connect_lazy`) that never opens a TCP connection. The `AuthUser`
//! extractor verifies the Bearer JWT BEFORE any DB query, and the `Json<ItemBody>`
//! body extractor (with `deny_unknown_fields`) rejects unknown fields BEFORE the
//! handler runs its SQL. So none of these invariant paths touch Postgres.

use axum::{
    body::{to_bytes, Body},
    http::{Request, StatusCode},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt; // for `oneshot`

// JWT secret used by both the app (via verify_token) and the test minter.
// Must be >= 32 chars to satisfy the service's config contract.
const JWT_SECRET: &str = "test-secret-that-is-at-least-32-chars-long!!";

// A real protected route mounted only when a pool is present.
// POST /users/me/items requires AuthUser + Json<ItemBody>.
const PROTECTED_POST: &str = "/users/me/items";
const PROTECTED_GET: &str = "/auth/me";

/// Build the full app with a lazy (never-connecting) pool so protected routes mount.
fn protected_app() -> Router {
    std::env::set_var("JWT_SECRET", JWT_SECRET);
    // connect_lazy never performs I/O until a query runs; auth/body rejection
    // happens before any query on the paths under test.
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect_lazy("postgres://invariant:invariant@127.0.0.1:1/invariant_db")
        .expect("lazy pool construction must succeed");
    axum_service::app(Some(pool))
}

/// Mint a valid JWT exactly the way the app verifies it: same crate
/// (jsonwebtoken), same claims (sub/email/name/exp), same HS256 secret.
fn mint_valid_token() -> String {
    std::env::set_var("JWT_SECRET", JWT_SECRET);
    axum_service::auth::jwt::sign_token("user-invariant", "inv@example.com", "Invariant User")
        .expect("sign_token must succeed")
}

// ---------------------------------------------------------------------------
// I-3 — protected route, NO Authorization header -> 401
// ---------------------------------------------------------------------------
#[tokio::test]
async fn i3_protected_route_without_auth_returns_401() {
    let app = protected_app();
    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(PROTECTED_GET)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        res.status(),
        StatusCode::UNAUTHORIZED,
        "I-3: missing Authorization header must yield 401, got {}",
        res.status()
    );
}

// ---------------------------------------------------------------------------
// I-4 — protected route, garbage/tampered Bearer token -> 401
// ---------------------------------------------------------------------------
#[tokio::test]
async fn i4_protected_route_with_garbage_token_returns_401() {
    let app = protected_app();
    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(PROTECTED_GET)
                .header("Authorization", "Bearer this.is.not.a.valid.jwt")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        res.status(),
        StatusCode::UNAUTHORIZED,
        "I-4: tampered/garbage Bearer token must yield 401, got {}",
        res.status()
    );
}

// ---------------------------------------------------------------------------
// I-6 — protected route, VALID token + unknown extra JSON field -> 400
// ---------------------------------------------------------------------------
#[tokio::test]
async fn i6_valid_token_unknown_field_returns_400() {
    let app = protected_app();
    let token = mint_valid_token();

    // `title` is valid; `evil_unknown_field` is not declared on ItemBody.
    // With #[serde(deny_unknown_fields)], the Json extractor rejects -> 400,
    // before the handler runs any DB query.
    let body = serde_json::json!({
        "title": "legit",
        "evil_unknown_field": "should be rejected"
    });

    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(PROTECTED_POST)
                .header("Authorization", format!("Bearer {token}"))
                .header("Content-Type", "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        res.status(),
        StatusCode::BAD_REQUEST,
        "I-6: unknown JSON field with a valid token must yield 400, got {}",
        res.status()
    );
}

/// I-6 control: the SAME request WITHOUT the unknown field must NOT be a 400
/// from deserialization. This proves the 400 above is caused by the unknown
/// field, not by a malformed request in general. (A clean body passes auth +
/// body parsing; the handler then runs, so we only assert it is not a 400.)
#[tokio::test]
async fn i6_control_valid_token_known_fields_not_rejected_as_bad_request() {
    let app = protected_app();
    let token = mint_valid_token();

    let body = serde_json::json!({ "title": "legit", "description": "fine" });

    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(PROTECTED_POST)
                .header("Authorization", format!("Bearer {token}"))
                .header("Content-Type", "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(
        res.status(),
        StatusCode::BAD_REQUEST,
        "I-6 control: a body with only known fields must not be rejected as 400"
    );
}

// ---------------------------------------------------------------------------
// I-10 — GET /health/live -> 200
// ---------------------------------------------------------------------------
#[tokio::test]
async fn i10_health_live_returns_200() {
    let app = protected_app();
    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/health/live")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "I-10: GET /health/live must return 200, got {}",
        res.status()
    );
}

// ---------------------------------------------------------------------------
// I-13 — GET /metrics -> 200 + body contains the golden-signal duration metric
// ---------------------------------------------------------------------------
#[tokio::test]
async fn i13_metrics_returns_200_with_request_duration_metric() {
    let app = protected_app();

    // Drive one real request first so the histogram has at least one sample.
    let _warmup = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/health/live")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/metrics")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "I-13: GET /metrics must return 200, got {}",
        res.status()
    );

    let bytes = to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let text = String::from_utf8_lossy(&bytes);

    assert!(
        text.contains("http_request_duration_seconds"),
        "I-13: /metrics body must contain the request-duration golden signal.\nbody:\n{text}"
    );
}

// ---------------------------------------------------------------------------
// I-17 — response carries security header x-content-type-options: nosniff
// ---------------------------------------------------------------------------
#[tokio::test]
async fn i17_response_has_nosniff_header() {
    let app = protected_app();
    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/health/live")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let header = res
        .headers()
        .get("x-content-type-options")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    assert_eq!(
        header, "nosniff",
        "I-17: response must carry x-content-type-options: nosniff, got {header:?}"
    );
}
