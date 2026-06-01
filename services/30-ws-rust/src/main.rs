use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    routing::get,
    Json, Router,
};
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

#[tokio::main]
async fn main() {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/health/live", get(|| async { Json(json!({"status":"ok"})) }))
        .route("/health/ready", get(|| async { Json(json!({"status":"ok"})) }));

    let addr = format!("0.0.0.0:{}", port);
    println!("WebSocket server on ws://{}/ws", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
