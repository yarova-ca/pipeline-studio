use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    routing::get,
    Json, Router,
};
use prometheus::{Encoder, TextEncoder};
use serde_json::json;

async fn ws_handler(ws: WebSocketUpgrade) -> impl axum::response::IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(text) = msg {
            let _ = socket.send(Message::Text(format!(r#"{{"echo":"{}"}}"#, text))).await;
        }
    }
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

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/metrics", get(metrics_handler))
        .route("/health", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/health/live", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/health/ready", get(|| async { Json(json!({"status":"ok"})) }));

    let addr = format!("0.0.0.0:{}", port);
    tracing::info!(addr = %addr, "WebSocket server starting");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
