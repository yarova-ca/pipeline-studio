use axum::{routing::get, Router, Json};
use serde_json::{json, Value};
use std::{env, net::SocketAddr};
use tokio::net::TcpListener;

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

pub fn app() -> Router {
    Router::new()
        .route("/", get(hello))
        .route("/health", get(health))
        .route("/health/live", get(liveness))
        .route("/health/ready", get(readiness))
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse().unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("Axum running on port {}", port);
    axum::serve(listener, app()).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::app;
    use axum::{body::Body, http::Request};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_health() {
        let response = app()
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    async fn test_liveness() {
        let response = app()
            .oneshot(Request::builder().uri("/health/live").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    async fn test_readiness() {
        let response = app()
            .oneshot(Request::builder().uri("/health/ready").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }

    #[tokio::test]
    async fn test_hello() {
        let response = app()
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await.unwrap();
        assert_eq!(response.status(), 200);
    }
}
