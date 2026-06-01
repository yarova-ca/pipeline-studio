use actix_web::{web, App, HttpServer, Responder, HttpResponse};
use serde_json::json;
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

async fn readiness() -> impl Responder {
    HttpResponse::Ok().json(json!({"status": "ok"}))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let _ = dotenvy::dotenv();
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse().unwrap_or(8080);
    println!("Actix-web running on port {}", port);
    HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(hello))
            .route("/health", web::get().to(health))
            .route("/health/live", web::get().to(liveness))
            .route("/health/ready", web::get().to(readiness))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}

#[cfg(test)]
mod tests {
    use actix_web::{test, App, web};
    use super::*;

    #[actix_web::test]
    async fn test_health() {
        let app = test::init_service(App::new().route("/health", web::get().to(health))).await;
        let req = test::TestRequest::get().uri("/health").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }

    #[actix_web::test]
    async fn test_liveness() {
        let app = test::init_service(App::new().route("/health/live", web::get().to(liveness))).await;
        let req = test::TestRequest::get().uri("/health/live").to_request();
        let resp = test::call_service(&app, req).await;
        assert!(resp.status().is_success());
    }
}
