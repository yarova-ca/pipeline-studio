use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};
use async_graphql_axum::GraphQL;
use axum::{routing::get, Router};
use prometheus::{Encoder, TextEncoder};

struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn health(&self) -> &str { "ok" }
}

async fn metrics_handler() -> impl axum::response::IntoResponse {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    (
        [(axum::http::header::CONTENT_TYPE, "text/plain; version=0.0.4")],
        buffer,
    )
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive(tracing::Level::INFO.into()))
        .init();

    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let app = Router::new()
        .route("/graphql", get(GraphQL::new(schema.clone())).post(GraphQL::new(schema)))
        .route("/metrics", get(metrics_handler))
        .route("/health", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }))
        .route("/health/live", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }))
        .route("/health/ready", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }));

    let addr = format!("0.0.0.0:{}", port);
    tracing::info!(addr = %addr, "async-graphql starting");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
