use axum_service::{app, db::init_pool};
use std::{env, net::SocketAddr};
use tokio::net::TcpListener;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialise JSON structured logging via tracing-subscriber.
/// Emits one JSON object per log line to stdout.
fn init_logging() {
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().json())
        .init();
}

/// Initialise OpenTelemetry when OTEL_ENABLED=true.
/// Returns a shutdown guard. No-op when the env var is absent.
#[cfg(not(test))]
fn init_otel() -> Option<opentelemetry_sdk::trace::SdkTracerProvider> {
    if env::var("OTEL_ENABLED").as_deref() != Ok("true") {
        return None;
    }
    use opentelemetry_otlp::SpanExporter;
    use opentelemetry_sdk::trace::SdkTracerProvider;

    // service.name is set via the OTEL_RESOURCE_ATTRIBUTES env var
    // (e.g. service.name=20-axum) — the standard OTel resource convention.
    //
    // OTel-rust 0.28+ API: SpanExporter::builder().with_tonic().build(),
    // SdkTracerProvider (renamed from TracerProvider), and the batch processor
    // no longer takes a runtime — it spawns its own background thread.
    let exporter = SpanExporter::builder()
        .with_tonic()
        .build()
        .expect("failed to build OTLP exporter");
    let provider = SdkTracerProvider::builder()
        .with_batch_exporter(exporter)
        .build();
    opentelemetry::global::set_tracer_provider(provider.clone());
    tracing::info!(endpoint = ?env::var("OTEL_EXPORTER_OTLP_ENDPOINT").ok(), "otel enabled");
    Some(provider)
}

#[tokio::main]
async fn main() {
    // I-1: fail fast on missing or weak required config.
    if std::env::var("JWT_SECRET").map(|v| v.len()).unwrap_or(0) < 32 {
        eprintln!("FATAL: JWT_SECRET must be set and at least 32 characters");
        std::process::exit(1);
    }
    let _ = dotenvy::dotenv();

    init_logging();

    // OpenTelemetry — guarded by OTEL_ENABLED=true.
    // Hold the provider alive for the server lifetime; shutdown on drop.
    #[cfg(not(test))]
    let _otel_provider = init_otel();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = init_pool(&database_url)
        .await
        .expect("failed to connect to database");

    let port: u16 = env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = TcpListener::bind(addr).await.unwrap();
    tracing::info!(port, "Axum server started");
    axum::serve(listener, app(Some(pool))).await.unwrap();
}
