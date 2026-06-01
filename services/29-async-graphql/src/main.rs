use async_graphql::{EmptyMutation, EmptySubscription, Object, Schema};
use async_graphql_axum::GraphQL;
use axum::{routing::get, Router};

struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn health(&self) -> &str { "ok" }
}

#[tokio::main]
async fn main() {
    let schema = Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish();
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let app = Router::new()
        .route("/graphql", get(GraphQL::new(schema.clone())).post(GraphQL::new(schema)))
        .route("/health", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }))
        .route("/health/live", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }))
        .route("/health/ready", get(|| async { axum::Json(serde_json::json!({"status":"ok"})) }));

    let addr = format!("0.0.0.0:{}", port);
    println!("async-graphql on http://{}/graphql", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
