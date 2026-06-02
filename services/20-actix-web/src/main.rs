mod auth;
mod db;
mod routes;

use actix_web::{middleware::Logger, web, App, HttpResponse, HttpServer, Responder};
use prometheus::{Encoder, TextEncoder};
use serde_json::json;
use sqlx::PgPool;
use std::env;

async fn hello() -> impl Responder {
    HttpResponse::Ok().json(json!({
        "message": "Hello from Actix-web 4.9",
        "framework": "20-actix-web",
        "version": "1.0.0"
    }))
}

async fn health() -> impl Responder {
    HttpResponse::Ok().json(json!({"status": "ok", "version": "1.0.0"}))
}

async fn liveness() -> impl Responder {
    HttpResponse::Ok().json(json!({"status": "ok"}))
}

async fn metrics() -> impl Responder {
    let encoder = TextEncoder::new();
    let metric_families = prometheus::gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(buffer)
}

async fn readiness(pool: web::Data<PgPool>) -> impl Responder {
    match sqlx::query("SELECT 1").execute(pool.get_ref()).await {
        Ok(_) => HttpResponse::Ok().json(json!({"status": "ok", "db": "connected"})),
        Err(_) => {
            HttpResponse::ServiceUnavailable().json(json!({"status": "error", "db": "disconnected"}))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let _ = dotenvy::dotenv();

    tracing_subscriber::fmt()
        .json()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive(tracing::Level::INFO.into()))
        .init();

    let pool = db::connect().await.expect("Failed to connect to database");
    let pool = web::Data::new(pool);

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);

    println!("Actix-web running on port {port}");

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(pool.clone())
            .route("/", web::get().to(hello))
            .route("/health", web::get().to(health))
            .route("/health/live", web::get().to(liveness))
            .route("/health/ready", web::get().to(readiness))
            .route("/metrics", web::get().to(metrics))
            .configure(routes::auth::configure)
            .configure(routes::users::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}

#[cfg(test)]
mod tests {
    use actix_web::{test, web, App};
    use super::*;

    #[actix_web::test]
    async fn test_health() {
        let app = test::init_service(
            App::new().route("/health", web::get().to(health)),
        )
        .await;
        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}
